import { getCurrentWindow } from '@tauri-apps/api/window';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Disc3, Fullscreen, Minus, Square, X } from '../../lib/icons';
import { toggleWindowFullscreen } from '../../lib/window';

const NavButtons = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  // track history length to enable/disable (basic heuristic)
  const canGoBack = location.key !== 'default';

  return (
    <div className="flex items-center gap-1 ml-4">
      <button
        type="button"
        disabled={!canGoBack}
        onClick={() => navigate(-1)}
        className="swlz-icon-button w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-20 disabled:cursor-default active:scale-90"
      >
        <ChevronLeft size={14} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={() => navigate(1)}
        className="swlz-icon-button w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90"
      >
        <ChevronRight size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
});

export const Titlebar = React.memo(() => {
  const { t } = useTranslation();
  const minimize = () => getCurrentWindow().minimize();
  const toggleMaximize = () => getCurrentWindow().toggleMaximize();
  const toggleFullscreen = () => void toggleWindowFullscreen();
  const close = () => getCurrentWindow().close();

  return (
    <div
      className="swlz-titlebar flex items-center justify-between select-none shrink-0"
      data-tauri-drag-region
    >
      <div className="flex items-center gap-1.5" data-tauri-drag-region>
        <Disc3 size={22} className="text-white" strokeWidth={2.4} />
        <span className="swlz-brand-title">SoundCloud</span>
        <NavButtons />
      </div>

      <div className="flex items-center">
        <button
          type="button"
          title={t('kb.fullscreen')}
          aria-label={t('kb.fullscreen')}
          className="swlz-icon-button w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer"
          onClick={toggleFullscreen}
        >
          <Fullscreen size={12} />
        </button>
        <button
          type="button"
          className="swlz-icon-button w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer"
          onClick={minimize}
        >
          <Minus size={13} />
        </button>
        <button
          type="button"
          className="swlz-icon-button w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer"
          onClick={toggleMaximize}
        >
          <Square size={10} />
        </button>
        <button
          type="button"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/35 hover:text-white hover:bg-white/[0.06] transition-all duration-150 cursor-pointer"
          onClick={close}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
});
