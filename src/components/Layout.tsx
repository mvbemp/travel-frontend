import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const LANGS = [
  { code: 'uz', label: 'UZ', flag: '🇺🇿' },
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
] as const;

function usePageTitle() {
  const { t } = useTranslation();
  const location = useLocation();
  const path = location.pathname;
  if (path.startsWith('/users')) return { icon: '👥', label: t('nav.users') };
  if (path.startsWith('/currencies')) return { icon: '💱', label: t('nav.currencies') };
  if (path.startsWith('/expenses')) return { icon: '💰', label: t('nav.expenses') };
  if (path.match(/^\/groups\/.+/)) return { icon: '🗂️', label: t('nav.groups') };
  if (path.startsWith('/groups')) return { icon: '🗂️', label: t('nav.groups') };
  return { icon: '✈️', label: 'Travel' };
}

export default function Layout() {
  const { logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const pageTitle = usePageTitle();

  const currentLang = LANGS.find(l => l.code === i18n.language) ?? LANGS[0];

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
      { to: '/users', label: t('nav.users'), icon: '👥' },
      { to: '/currencies', label: t('nav.currencies'), icon: '💱' },
      { to: '/expenses', label: t('nav.expenses'), icon: '💰' },
    ] : []),
    { to: '/groups', label: t('nav.groups'), icon: '🗂️' },
  ];

  return (
    <div className="app-shell">
      {/* ── Mobile top bar ── */}
      <header className="mobile-header">
        <div className="sidebar-logo" style={{ border: 'none', padding: 0 }}>
          <div className="sidebar-logo-icon">✈</div>
          <div>
            <div className="sidebar-logo-text">Travel</div>
            <span className="sidebar-logo-sub">{t('nav.adminPanel')}</span>
          </div>
        </div>
        <button className="btn-ghost btn-icon hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <span className="hamburger-icon">{menuOpen ? '✕' : '☰'}</span>
        </button>
      </header>

      {/* ── Backdrop ── */}
      {menuOpen && <div className="sidebar-backdrop" onClick={closeMenu} />}

      {/* ── Sidebar ── */}
      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">✈</div>
          <div>
            <div className="sidebar-logo-text">Travel</div>
            <span className="sidebar-logo-sub">{t('nav.adminPanel')}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={closeMenu}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={handleLogout} title={t('nav.logout')}>
            <div className="sidebar-user-avatar">
              {user?.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.full_name ?? user?.email ?? t('nav.user')}</div>
              <div className="sidebar-user-role">{isAdmin ? t('nav.administrator') : t('nav.user')} · {t('nav.logout')}</div>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>→</span>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main-content">
        {/* ── Top header bar ── */}
        <div className="topbar">
          <div className="topbar-left">
            <span className="topbar-page-icon">{pageTitle.icon}</span>
            <h1 className="topbar-page-title">{pageTitle.label}</h1>
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
                <svg className={`lang-chevron${langOpen ? ' open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
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
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
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
