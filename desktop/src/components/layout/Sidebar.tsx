import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/shallow';
import { changeAppLanguage } from '../../i18n';
import { art } from '../../lib/formatters';
import {
  Clock,
  Download,
  Globe,
  Home,
  Library,
  ListMusic,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
} from '../../lib/icons';
import { useAppStatusStore } from '../../stores/app-status';
import { useAuthStore } from '../../stores/auth';
import { useSettingsStore } from '../../stores/settings';
import { Avatar } from '../ui/Avatar';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'tr', label: 'Turkce' },
] as const;

const navItems = [
  { to: '/home', icon: Home, label: 'nav.home' },
  { to: '/search', icon: Search, label: 'nav.search' },
  { to: '/library', icon: Library, label: 'nav.library' },
  { to: '/offline', icon: Download, label: 'nav.offline' },
];

export const Sidebar = React.memo(() => {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const appMode = useAppStatusStore((s) =>
    !s.navigatorOnline || !s.backendReachable ? 'offline' : 'online',
  );
  const { collapsed, pinnedPlaylists, toggleSidebar } = useSettingsStore(
    useShallow((s) => ({
      collapsed: s.sidebarCollapsed,
      pinnedPlaylists: s.pinnedPlaylists,
      toggleSidebar: s.toggleSidebar,
    })),
  );
  const toggleLanguage = () => {
    const next = i18n.language === 'ru' ? 'en' : 'ru';
    void changeAppLanguage(next);
  };

  const currentLang = languages.find((l) => l.code === i18n.language) ?? languages[0];
  const navIconSize = collapsed ? 21 : 18;
  const utilityIconSize = collapsed ? 22 : 16;

  return (
    <aside
      className="swlz-sidebar shrink-0 flex flex-col h-full transition-[width] duration-200 ease-[var(--ease-apple)]"
      data-collapsed={collapsed ? 'true' : 'false'}
      style={{ width: collapsed ? 72 : 214 }}
    >
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? t(item.label) : undefined}
            className={({ isActive }) =>
              `swlz-nav-link flex items-center gap-3 transition-all duration-200 ease-[var(--ease-apple)] ${
                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
              } ${
                isActive
                  ? 'swlz-nav-link-active shadow-[inset_0_0.5px_0_rgba(255,255,255,0.1)]'
                  : item.to === '/offline' && appMode !== 'online'
                    ? 'text-white bg-white/[0.08] ring-1 ring-white/15'
                    : ''
              }`
            }
          >
            <item.icon size={navIconSize} strokeWidth={1.8} />
            {!collapsed && t(item.label)}
          </NavLink>
        ))}
      </nav>

      <div className="pt-4 space-y-2">
        {!collapsed && (
          <div className="px-3 pb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/30 font-black">
            <MapPin size={11} strokeWidth={1.8} />
            {t('sidebar.quickAccess')}
          </div>
        )}

        <NavLink
          to="/library?tab=history"
          title={collapsed ? t('library.history') : undefined}
          className={({ isActive }) =>
            `swlz-nav-link flex items-center gap-2.5 w-full transition-all duration-200 ${
              collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            } ${
              isActive
                ? 'swlz-nav-link-active'
                : ''
            }`
          }
        >
          <Clock size={utilityIconSize} strokeWidth={1.8} />
          {!collapsed && <span className="truncate">{t('library.history')}</span>}
        </NavLink>

        {pinnedPlaylists.map((playlist) => {
          const artwork = art(playlist.artworkUrl, 'small');

          return (
            <NavLink
              key={playlist.urn}
              to={`/playlist/${encodeURIComponent(playlist.urn)}`}
              title={collapsed ? playlist.title : undefined}
              className={({ isActive }) =>
                `swlz-nav-link flex items-center gap-2.5 w-full transition-all duration-200 ${
                  collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
                } ${
                  isActive
                    ? 'swlz-nav-link-active'
                    : ''
                }`
              }
            >
              {artwork ? (
                <img
                  src={artwork}
                  alt=""
                  className="w-4 h-4 rounded-[4px] object-cover shrink-0 ring-1 ring-white/[0.08]"
                  decoding="async"
                  loading="lazy"
                />
              ) : (
                <ListMusic size={utilityIconSize} strokeWidth={1.8} />
              )}
              {!collapsed && <span className="truncate">{playlist.title}</span>}
            </NavLink>
          );
        })}
      </div>

      <div className="flex-1" />

      <div className="pb-1 flex flex-col gap-2">
        {/* Toggle sidebar */}
        <button
          type="button"
          onClick={toggleSidebar}
          title={collapsed ? t('nav.expand') : undefined}
          className={`swlz-nav-link flex items-center gap-2.5 w-full px-3 py-2 transition-all duration-200 cursor-pointer ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? (
            <PanelLeftOpen size={utilityIconSize} strokeWidth={1.8} />
          ) : (
            <PanelLeftClose size={utilityIconSize} strokeWidth={1.8} />
          )}
          {!collapsed && <span className="truncate">{t('nav.collapse')}</span>}
        </button>
        <button
          type="button"
          onClick={toggleLanguage}
          title={collapsed ? currentLang.label : undefined}
          className={`swlz-nav-link flex items-center gap-2.5 w-full px-3 py-2 transition-all duration-200 cursor-pointer ${collapsed ? 'justify-center' : ''}`}
        >
          <Globe size={utilityIconSize} strokeWidth={1.8} />
          {!collapsed && <span className="truncate">{currentLang.label}</span>}
        </button>
        <NavLink
          to="/settings"
          title={collapsed ? t('nav.settings') : undefined}
          className={({ isActive }) =>
            `swlz-nav-link flex items-center gap-2.5 w-full px-3 py-2 transition-all duration-200 ${
              collapsed ? 'justify-center' : ''
            } ${
              isActive
                ? 'swlz-nav-link-active'
                : ''
            }`
          }
        >
          <Settings size={utilityIconSize} strokeWidth={1.8} />
          {!collapsed && <span className="truncate">{t('nav.settings')}</span>}
        </NavLink>
      </div>

      {user && (
        <div className="pb-1">
          <NavLink
            to={`/user/${encodeURIComponent(user.urn)}`}
            title={collapsed ? user.username : undefined}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-[18px] transition-all duration-200 cursor-pointer ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-white text-black shadow-[inset_0_0.5px_0_rgba(255,255,255,0.1)]'
                  : 'hover:bg-white/[0.05]'
              }`
            }
          >
            <Avatar src={user.avatar_url} alt={user.username} size={26} />
            {!collapsed && (
              <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[12px] text-white/55 truncate font-black">
                  {user.username}
                </span>
              </div>
            )}
          </NavLink>
        </div>
      )}
    </aside>
  );
});
