import { fetch } from '@tauri-apps/plugin-http';
import { toast } from 'sonner';
import { useAppStatusStore } from '../stores/app-status';
import { useSessionExpiryStore } from '../stores/session-expiry';
import { useSettingsStore } from '../stores/settings';
import { API_BASE, BYPASS_API_BASE } from './constants';
import {
  isTauri,
  logHttpError,
  logHttpFailure,
  TauriUnavailableError,
  trackAsync,
} from './diagnostics';
import { isHealthy, markHealthy, markUnhealthy } from './host-health';
import { getIsPremium } from './premium-cache';

// ─── Session ────────────────────────────────────────────────

let sessionId: string | null = null;

export function setSessionId(id: string | null) {
  sessionId = id;
}

export function getSessionId() {
  return sessionId;
}

// ─── Error ──────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`API ${status}: ${body}`);
    this.name = 'ApiError';
  }
}

// ─── Host resolution ────────────────────────────────────────

const AUTH_PATHS = ['/auth/', '/me/subscription'];

function isAuthPath(path: string): boolean {
  return AUTH_PATHS.some((p) => path.startsWith(p));
}

function resolveApiBases(path: string): string[] {
  // Auth paths + subscription check: always try both hosts
  if (isAuthPath(path)) {
    return isHealthy(BYPASS_API_BASE) ? [BYPASS_API_BASE, API_BASE] : [API_BASE, BYPASS_API_BASE];
  }

  const bypass = useSettingsStore.getState().bypassWhitelist;
  const premium = getIsPremium();

  // Premium + bypass: white first, regular fallback
  if (bypass && premium) {
    return isHealthy(BYPASS_API_BASE) ? [BYPASS_API_BASE, API_BASE] : [API_BASE];
  }

  // Default: regular only
  return [API_BASE];
}

// ─── Helpers ────────────────────────────────────────────────

function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 10_000,
): Promise<Response> {
  if (!isTauri()) return Promise.reject(new TauriUnavailableError(`http_fetch ${url}`));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  ) as Promise<Response>;
}

function handleApiError(err: ApiError): void {
  if (err.status === 429) return; // rate-limit: silent (UI already retried)
  if (err.status >= 500) {
    toast.error(`Server error (${err.status})`);
  } else if (err.status >= 400 && err.status !== 401) {
    try {
      const parsed = JSON.parse(err.body);
      toast.error(parsed.message || parsed.error || `Error ${err.status}`);
    } catch {
      toast.error(`Error ${err.status}`);
    }
  }
}

const RATE_LIMIT_MAX_RETRIES = 3;
const RATE_LIMIT_BASE_DELAY_MS = 800;

function rateLimitDelay(res: Response, attempt: number): number {
  const header = res.headers.get('Retry-After');
  if (header) {
    const seconds = Number.parseFloat(header);
    if (Number.isFinite(seconds) && seconds > 0) return Math.min(seconds * 1000, 8000);
  }
  return RATE_LIMIT_BASE_DELAY_MS * 2 ** attempt;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main API client ────────────────────────────────────────

export async function apiRequest<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (sessionId) headers.set('x-session-id', sessionId);
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');

  const bases = resolveApiBases(path);
  const method = options.method ?? 'GET';
  let lastError: unknown = null;
  let rateLimitAttempt = 0;

  const label = `${method.toUpperCase()} ${path}`;

  for (let i = 0; i < bases.length; i++) {
    const base = bases[i];
    const url = `${base}${path}`;
    try {
      const res = await trackAsync(`http:${label}`, fetchWithTimeout(url, { ...options, headers }));

      markHealthy(base);
      useAppStatusStore.getState().setBackendReachable(true);

      if (!res.ok) {
        // 429: silent backoff retry, don't burn through hosts on the same broken request
        if (res.status === 429 && rateLimitAttempt < RATE_LIMIT_MAX_RETRIES) {
          await sleep(rateLimitDelay(res, rateLimitAttempt));
          rateLimitAttempt++;
          i--; // retry same base
          continue;
        }

        const body = await res.text();
        const err = new ApiError(res.status, body);
        logHttpError(label, res.status, url, body);

        // Backend lost the user↔session binding (e.g. OAuth callback never completed,
        // or backend DB row was wiped). Treat as expired session — show re-auth modal
        // and stop hammering the same broken sessionId across all hosts.
        const isOrphanSession =
          body.includes('User not found in session') ||
          body.includes('Session not found') ||
          body.includes('Refresh token expired') ||
          body.includes('re-authenticate');

        if (res.status === 401 || (res.status === 500 && isOrphanSession)) {
          if (isOrphanSession) {
            useSessionExpiryStore.getState().setSessionExpired(true);
          }
          console.error(`HTTP ERROR: url: ${path}, `, err);
          throw err;
        }

        // 5xx with more bases to try → mark unhealthy, continue
        if (res.status >= 500 && i < bases.length - 1) {
          markUnhealthy(base);
          lastError = err;
          continue;
        }

        handleApiError(err);
        console.error(`HTTP ERROR: url: ${path}, `, err);
        throw err;
      }

      const ct = res.headers.get('content-type');
      return ct?.includes('application/json') ? res.json() : (res.text() as T);
    } catch (error) {
      // Already handled ApiError — rethrow
      if (error instanceof ApiError) throw error;
      // Network error — mark unhealthy, try next
      logHttpFailure(label, url, error);
      markUnhealthy(base);
      lastError = error;
    }
  }

  useAppStatusStore.getState().setBackendReachable(false);
  throw lastError ?? new Error('All API hosts unreachable');
}

// ─── Aliases ────────────────────────────────────────────────

export const fetchWithAuthFallback = apiRequest;
