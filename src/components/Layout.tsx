import { NavLink, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import './layout.css';

const NAV = [
  {
    to: '/users',
    label: 'Kullanıcılar',
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    to: '/announcements',
    label: 'Duyurular',
    icon: (
      <>
        <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z"/>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
      </>
    ),
  },
  {
    to: '/settings',
    label: 'Ayarlar',
    icon: (
      <>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/users': 'Kullanıcı Yönetimi',
  '/announcements': 'Duyurular',
  '/settings': 'Ayarlar',
};

export default function Layout({ children }: { children: ReactNode }) {
  const { admin, logout } = useAuth();
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'CinePaw Admin';

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
              <circle cx="6.5" cy="9" r="2.1" />
              <circle cx="11" cy="6.2" r="2.1" />
              <circle cx="15.5" cy="6.2" r="2.1" />
              <circle cx="18.5" cy="10" r="1.8" />
              <path d="M12 11.5c-2.5 0-4.6 1.9-4.6 4.2 0 1.7 1.3 2.6 3 2.6 1 0 1.1-.4 1.6-.4s.6.4 1.6.4c1.7 0 3-.9 3-2.6 0-2.3-2.1-4.2-4.6-4.2z" />
            </svg>
          </div>
          <div className="brand-text">
            <strong>CinePaw</strong>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav className="nav">
          <p className="nav-section">Yönetim</p>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {item.icon}
              </svg>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="me-card">
            <Avatar name={admin?.name ?? 'Admin'} src={admin?.profileImage} size={38} />
            <div className="me-info">
              <strong>{admin?.name}</strong>
              <span>{admin?.email}</span>
            </div>
          </div>
          <button className="btn btn-ghost logout" onClick={logout}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Çıkış Yap
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <h1 className="page-title">{title}</h1>
            <p className="page-sub">
            {pathname === '/settings'
              ? 'Uygulama genelindeki özellikleri aç veya kapat'
              : pathname === '/announcements'
              ? 'Tüm kullanıcılara sistem bildirimi gönder'
              : 'CinePaw kullanıcılarını görüntüle ve yönet'}
          </p>
          </div>
          <div className="topbar-right">
            <span className="badge admin dot">Yönetici</span>
            <Avatar name={admin?.name ?? 'Admin'} src={admin?.profileImage} size={40} />
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}
