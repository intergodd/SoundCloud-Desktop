import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { changeAppLanguage } from './i18n';
import { setupCacheMaintenance } from './lib/cache';
import { setServerPorts } from './lib/constants';
import { setupUiWatchdog, trackedInvoke as invoke } from './lib/diagnostics';
import { queryClient } from './lib/query-client';
import './index.css';
import { useSettingsStore } from './stores/settings';

// Sync language from persisted settings → i18n after tauriStorage rehydration
useSettingsStore.persist.onFinishHydration((state) => {
  if (state.language) {
    void changeAppLanguage(state.language);
  }
});

function scheduleAfterFirstPaint(task: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => task(), { timeout: 1500 });
      } else {
        setTimeout(task, 1);
      }
    });
  });
}

function startDeferredRuntime() {
  scheduleAfterFirstPaint(() => {
    setupUiWatchdog();
    setupCacheMaintenance();
    void import('./lib/scproxy');
    void import('./lib/tray');
    void import('./lib/audio');
    void import('./lib/discord');
  });
}

async function fixWebviewScale() {
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const { getCurrentWebview } = await import('@tauri-apps/api/webview');
    const monitorScale = await getCurrentWindow().scaleFactor();
    const webviewDpr = window.devicePixelRatio;
    if (monitorScale > 1 && webviewDpr < monitorScale * 0.8) {
      await getCurrentWebview().setZoom(monitorScale / webviewDpr);
    }
  } catch {}
}

async function resolveServerPorts(): Promise<[number, number] | null> {
  if (!(window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__) {
    return null;
  }

  try {
    return await invoke<[number, number]>('get_server_ports');
  } catch (error) {
    console.warn('[Bootstrap] Tauri server ports unavailable, rendering without local proxy:', error);
    return null;
  }
}

async function bootstrap() {
  await fixWebviewScale();
  await useSettingsStore.persist.rehydrate();

  const settings = useSettingsStore.getState();
  await changeAppLanguage(settings.language);

  const serverPorts = await resolveServerPorts();
  if (serverPorts) {
    const [staticPort, proxyPort] = serverPorts;
    setServerPorts(staticPort, proxyPort);
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>,
  );

  void startDeferredRuntime();
}

void bootstrap();
