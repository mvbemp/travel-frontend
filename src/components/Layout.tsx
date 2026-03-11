import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  const navItems = [
    ...(isAdmin ? [{ to: '/users', label: 'Users', icon: '👥' }] : []),
    { to: '/groups', label: 'Groups', icon: '🗂️' },
  ];

  return (
    <div className="app-shell">
      {/* Mobile top header */}
      <header className="mobile-header">
        <div className="sidebar-logo" style={{ border: 'none', padding: 0 }}>
          <div className="sidebar-logo-icon">✈</div>
          <div>
            <div className="sidebar-logo-text">Travel</div>
            <span className="sidebar-logo-sub">Admin Panel</span>
          </div>
        </div>
        <button className="btn-ghost btn-icon hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <span className="hamburger-icon">{menuOpen ? '✕' : '☰'}</span>
        </button>
      </header>

      {/* Backdrop */}
      {menuOpen && <div className="sidebar-backdrop" onClick={closeMenu} />}

      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">✈</div>
          <div>
            <div className="sidebar-logo-text">Travel</div>
            <span className="sidebar-logo-sub">Admin Panel</span>
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
          <div className="sidebar-user" onClick={handleLogout} title="Logout">
            <div className="sidebar-user-avatar">
              {user?.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.full_name ?? user?.email ?? 'User'}</div>
              <div className="sidebar-user-role">{isAdmin ? 'Administrator' : 'User'} · logout</div>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>→</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="main-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
