import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  Users, DollarSign, Receipt, Map, LogOut, Menu, X,
  ChevronDown, Plane, Globe,
} from 'lucide-react';

const LANGS = [
  { code: 'uz', label: 'UZ', flag: '🇺🇿', name: 'O\'zbekcha' },
  { code: 'ru', label: 'RU', flag: '🇷🇺', name: 'Русский' },
  { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
] as const;

const PAGE_ICONS: Record<string, { Icon: React.ComponentType<{size?:number;strokeWidth?:number}>, bg: string, color: string }> = {
  users:      { Icon: Users,      bg: 'var(--primary-light)',  color: 'var(--primary)' },
  currencies: { Icon: DollarSign, bg: 'var(--success-light)',  color: 'var(--success)' },
  expenses:   { Icon: Receipt,    bg: 'var(--warning-light)',  color: 'var(--warning)' },
  groups:     { Icon: Map,        bg: 'var(--purple-light)',   color: 'var(--purple)' },
};

function usePageMeta() {
  const { t } = useTranslation();
  const location = useLocation();
  const path = location.pathname;
  if (path.startsWith('/users'))      return { key: 'users',      label: t('nav.users') };
  if (path.startsWith('/currencies')) return { key: 'currencies', label: t('nav.currencies') };
  if (path.startsWith('/expenses'))   return { key: 'expenses',   label: t('nav.expenses') };
  if (path.startsWith('/groups'))     return { key: 'groups',     label: t('nav.groups') };
  return { key: 'groups', label: 'Travel' };
}

export default function Layout() {
  const { logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const pageMeta = usePageMeta();

  const currentLang = LANGS.find(l => l.code === i18n.language) ?? LANGS[0];
  const pageIconData = PAGE_ICONS[pageMeta.key];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const closeMenu = () => setMenuOpen(false);

  const changeLang = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
    setLangOpen(false);
  };

  const navItems = [
    ...(isAdmin ? [
      { to: '/users',      label: t('nav.users'),      Icon: Users },
      { to: '/currencies', label: t('nav.currencies'), Icon: DollarSign },
      { to: '/expenses',   label: t('nav.expenses'),   Icon: Receipt },
    ] : []),
    { to: '/groups', label: t('nav.groups'), Icon: Map },
  ];

  const initials = (user?.full_name ?? user?.email ?? 'U').slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      {/* ── Mobile header ── */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="sidebar-logo-icon" style={{ width: 30, height: 30, borderRadius: 8 }}>
            <Plane size={14} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>Travel</span>
        </div>
        <button
          className="btn-ghost btn-icon hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* ── Sidebar backdrop ── */}
      {menuOpen && <div className="sidebar-backdrop" onClick={closeMenu} />}

      {/* ── Sidebar ── */}
      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Plane size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div className="sidebar-logo-text">Travel</div>
            <span className="sidebar-logo-sub">{t('nav.adminPanel')}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={closeMenu}
            >
              <span className="nav-item-icon">
                <item.Icon size={16} strokeWidth={2} />
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={handleLogout} title={t('nav.logout')}>
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.full_name ?? user?.email ?? t('nav.user')}</div>
              <div className="sidebar-user-role">
                {isAdmin ? t('nav.administrator') : t('nav.user')} · {t('nav.logout')}
              </div>
            </div>
            <span className="sidebar-logout-icon">
              <LogOut size={14} />
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            {pageIconData && (
              <div className="topbar-page-icon" style={{ background: pageIconData.bg, color: pageIconData.color }}>
                <pageIconData.Icon size={16} strokeWidth={2} />
              </div>
            )}
            <h1 className="topbar-page-title">{pageMeta.label}</h1>
          </div>

          <div className="topbar-right">
            {/* Language dropdown */}
            <div className="lang-dropdown" ref={langRef}>
              <button
                className="lang-trigger"
                onClick={() => setLangOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={langOpen}
              >
                <span className="lang-flag">{currentLang.flag}</span>
                <span className="lang-label">{currentLang.label}</span>
                <span className={`lang-chevron${langOpen ? ' open' : ''}`}>
                  <ChevronDown size={12} strokeWidth={2.5} />
                </span>
              </button>

              {langOpen && (
                <div className="lang-menu" role="listbox">
                  {LANGS.map(l => (
                    <button
                      key={l.code}
                      className={`lang-option${i18n.language === l.code ? ' selected' : ''}`}
                      onClick={() => changeLang(l.code)}
                      role="option"
                      aria-selected={i18n.language === l.code}
                    >
                      <span className="lang-flag">{l.flag}</span>
                      <span className="lang-option-name">{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Globe icon for aesthetics */}
            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <Globe size={16} />
            </div>
          </div>
        </div>

        <div className="main-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
