import { useEffect, useState } from 'react';
import api, { errMsg } from '../lib/api';
import type { AdminUser, UserDetail } from '../types';
import Avatar from './Avatar';

interface UserDrawerProps {
  user: AdminUser;
  isSelf: boolean;
  onClose: () => void;
  onEdit: (u: AdminUser) => void;
  onToggleAdmin: (u: AdminUser) => void;
  onBlock: (u: AdminUser) => void;
  onDelete: (u: AdminUser) => void;
}

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

export default function UserDrawer({
  user,
  isSelf,
  onClose,
  onEdit,
  onToggleAdmin,
  onBlock,
  onDelete,
}: UserDrawerProps) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setDetail(null);
    setError('');
    api
      .get<UserDetail>(`/admin/users/${user.id}`)
      .then(({ data }) => alive && setDetail(data))
      .catch((e) => alive && setError(errMsg(e)));
    return () => {
      alive = false;
    };
  }, [user.id]);

  const stats = detail?.stats;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-banner">
          {detail?.backgroundImage && <img src={detail.backgroundImage} alt="" />}
          <button className="drawer-close" onClick={onClose} aria-label="Kapat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="drawer-head">
          <span className="drawer-avatar-ring">
            <Avatar name={user.name} src={user.profileImage} size={80} />
          </span>
          <div className="drawer-name">{user.name}</div>
          <div className="drawer-email">{user.email}</div>
          <div className="drawer-meta-row">
            {user.isBlocked && <span className="badge blocked dot">Engelli</span>}
            {user.isAdmin ? (
              <span className="badge admin dot">Yönetici</span>
            ) : (
              <span className="badge dot">Üye</span>
            )}
            <span className="badge">ID #{user.id}</span>
            {user.letterboxdUsername && <span className="badge">Letterboxd</span>}
          </div>
        </div>

        <div className="drawer-body">
          {error && <div className="login-error">{error}</div>}

          <div className="stat-grid">
            <div className="stat-mini">
              <strong>{stats?.followers ?? '—'}</strong>
              <span>Takipçi</span>
            </div>
            <div className="stat-mini">
              <strong>{stats?.following ?? '—'}</strong>
              <span>Takip</span>
            </div>
            <div className="stat-mini">
              <strong>{stats?.rated ?? '—'}</strong>
              <span>Puanlama</span>
            </div>
            <div className="stat-mini">
              <strong>{stats?.watched ?? '—'}</strong>
              <span>İzlenen</span>
            </div>
            <div className="stat-mini">
              <strong>{stats?.posts ?? '—'}</strong>
              <span>Gönderi</span>
            </div>
            <div className="stat-mini">
              <strong>{user.isAdmin ? '✓' : '–'}</strong>
              <span>Yönetici</span>
            </div>
          </div>

          {user.bio && (
            <div className="detail-section">
              <h4>Hakkında</h4>
              <p className="detail-bio">{user.bio}</p>
            </div>
          )}

          <div className="detail-section">
            <h4>Bilgiler</h4>
            <div className="detail-rows">
              <div className="detail-line">
                <span className="k">Şehir</span>
                <span className="v">{user.city || '—'}</span>
              </div>
              <div className="detail-line">
                <span className="k">Kayıt tarihi</span>
                <span className="v">{fmtDate(user.createdAt)}</span>
              </div>
              <div className="detail-line">
                <span className="k">Letterboxd</span>
                <span className="v">{user.letterboxdUsername || '—'}</span>
              </div>
              {detail?.letterboxdConnectedAt && (
                <div className="detail-line">
                  <span className="k">Letterboxd bağlandı</span>
                  <span className="v">{fmtDate(detail.letterboxdConnectedAt)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h4>İşlemler</h4>
            <div className="drawer-actions">
              <button className="btn" onClick={() => onEdit(user)}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
                Bilgileri Düzenle
              </button>
              <button
                className="btn"
                onClick={() => onToggleAdmin(user)}
                disabled={isSelf}
                title={isSelf ? 'Kendi yetkini buradan değiştiremezsin' : ''}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3z" />
                </svg>
                {user.isAdmin ? 'Yönetici Yetkisini Kaldır' : 'Yönetici Yap'}
              </button>
              <button
                className="btn"
                onClick={() => onBlock(user)}
                disabled={isSelf}
                title={isSelf ? 'Kendini engelleyemezsin' : ''}
              >
                {user.isBlocked ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m4.9 4.9 14.2 14.2" />
                  </svg>
                )}
                {user.isBlocked ? 'Engeli Kaldır' : 'Uygulamadan Engelle'}
              </button>
              <button
                className="btn btn-danger"
                onClick={() => onDelete(user)}
                disabled={isSelf}
                title={isSelf ? 'Kendi hesabını silemezsin' : ''}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Kullanıcıyı Sil
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
