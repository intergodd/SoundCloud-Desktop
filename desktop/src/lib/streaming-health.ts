import { fetch } from '@tauri-apps/plugin-http';
import {
  BYPASS_STORAGE_BASE,
  BYPASS_STREAMING_BASE,
  BYPASS_STREAMING_PREMIUM_BASE,
  STORAGE_BASE,
  STREAMING_BASE,
  STREAMING_PREMIUM_BASE,
} from './constants';
import { markHealthy, markUnhealthy } from './host-health';

const PROBE_TIMEOUT_MS = 4000;
const PROBE_INTERVAL_MS = 60_000;

let monitorStarted = false;

const HOSTS = [
  ...new Set([
    STREAMING_PREMIUM_BASE,
    STREAMING_BASE,
    STORAGE_BASE,
    BYPASS_STREAMING_PREMIUM_BASE,
    BYPASS_STREAMING_BASE,
    BYPASS_STORAGE_BASE,
  ]),
];

async function probeHost(base: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    // Treat any non-5xx as alive (some hosts answer 404 on /health but proxy itself works)
    if (res.status < 500) {
      markHealthy(base);
    } else {
      markUnhealthy(base);
    }
  } catch {
    markUnhealthy(base);
  } finally {
    clearTimeout(timer);
  }
}

export function probeStreamingHosts(): Promise<void> {
  return Promise.allSettled(HOSTS.map(probeHost)).then(() => undefined);
}

export function startStreamingHealthMonitor(): void {
  if (monitorStarted) return;
  monitorStarted = true;
  void probeStreamingHosts();
  window.setInterval(() => {
    void probeStreamingHosts();
  }, PROBE_INTERVAL_MS);
}
