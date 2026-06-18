import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import api, { errMsg } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { AdminUser, Stats, UsersResponse } from '../types';
import Avatar from '../components/Avatar';
import UserDrawer from '../components/UserDrawer';
import UserFormModal from '../components/UserFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import './users.css';

const LIMIT = 10;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

type SortKey = 'newest' | 'oldest' | 'name';
type FilterKey = 'admin' | 'letterboxd' | 'new';

const STAT_CARDS: {
  key: keyof Stats;
  label: string;
  tint: string;
  icon: ReactNode;
  filter?: FilterKey;
}[] = [
  {
    key: 'totalUsers',
    label: 'Toplam Kullanıcı',
    tint: '#7c5cff',
    icon: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
  },
  {
    key: 'admins',
    label: 'Yönetici',
    tint: '#b14cff',
    filter: 'admin',
    icon: <path d="M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3z" />,
  },
  {
    key: 'newThisWeek',
    label: 'Bu Hafta Yeni',
    tint: '#16a34a',
    filter: 'new',
    icon: <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" />,
  },
  {
    key: 'withLetterboxd',
    label: 'Letterboxd Bağlı',
    tint: '#f2a93b',
    filter: 'letterboxd',
    icon: <><circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v8" /></>,
  },
];

export default function Users() {
  const { admin } = useAuth();
  const { notify } = useToast();

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortKey>('newest');
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [confirmAdmin, setConfirmAdmin] = useState<AdminUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [confirmBlock, setConfirmBlock] = useState<AdminUser | null>(null);
  const [formModal, setFormModal] = useState<{ mode: 'create' | 'edit'; user?: AdminUser } | null>(null);
  const [busy, setBusy] = useState(false);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadStats = useCallback(() => {
    api
      .get<Stats>('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch(() => {});
  }, []);

  const loadUsers = useCallback(() => {
    setLoading(true);
    setError('');
    const params: Record<string, unknown> = { search, page, limit: LIMIT, sort };
    if (activeFilter) params.filter = activeFilter;
    api
      .get<UsersResponse>('/admin/users', { params })
      .then(({ data }) => {
        setUsers(data.users);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [search, page, sort, activeFilter]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const refresh = () => {
    loadUsers();
    loadStats();
  };

  // ----- Actions -----
  const doToggleAdmin = async () => {
    if (!confirmAdmin) return;
    setBusy(true);
    try {
      const next = !confirmAdmin.isAdmin;
      await api.patch(`/admin/users/${confirmAdmin.id}/admin`, { isAdmin: next });
      notify(next ? 'Yönetici yetkisi verildi.' : 'Yönetici yetkisi kaldırıldı.', 'success');
      setConfirmAdmin(null);
      setSelected(null);
      refresh();
    } catch (e) {
      notify(errMsg(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      await api.delete(`/admin/users/${confirmDelete.id}`);
      notify('Kullanıcı silindi.', 'success');
      setConfirmDelete(null);
      setSelected(null);
      refresh();
    } catch (e) {
      notify(errMsg(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const doBlock = async () => {
    if (!confirmBlock) return;
    setBusy(true);
    try {
      const next = !confirmBlock.isBlocked;
      await api.patch(`/admin/users/${confirmBlock.id}/block`, { blocked: next });
      notify(next ? 'Kullanıcı engellendi.' : 'Engel kaldırıldı.', 'success');
      setConfirmBlock(null);
      setSelected(null);
      refresh();
    } catch (e) {
      notify(errMsg(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSaved = (_u: AdminUser, mode: 'create' | 'edit') => {
    notify(mode === 'create' ? 'Kullanıcı oluşturuldu.' : 'Kullanıcı güncellendi.', 'success');
    setFormModal(null);
    setSelected(null);
    refresh();
  };

  const pageNumbers = useMemo(() => {
    const arr: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [page, totalPages]);

  return (
    <div className="users-page fade-in">
      {/* Stat cards — clicking a filterable card filters the list below */}
      <div className="stats-row">
        {STAT_CARDS.map((c) => {
          const isActive = c.filter ? activeFilter === c.filter : false;
          const handleClick = () => {
            if (c.filter) {
              setActiveFilter((prev) => (prev === c.filter ? null : c.filter!));
            } else {
              setActiveFilter(null);
            }
            setPage(1);
          };
          return (
            <div
              className={`stat-card filterable${isActive ? ' active' : ''}`}
              key={c.key}
              onClick={handleClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleClick()}
              title={
                c.filter
                  ? isActive
                    ? 'Filtreyi kaldır'
                    : 'Bu grupla filtrele'
                  : 'Tüm kullanıcıları göster'
              }
              style={isActive ? { '--active-tint': c.tint } as React.CSSProperties : undefined}
            >
              <div className="stat-icon" style={{ background: `${c.tint}1a`, color: c.tint }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {c.icon}
                </svg>
              </div>
              <div className="stat-text">
                <strong>{stats ? stats[c.key] : '—'}</strong>
                <span>{c.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            placeholder="İsim veya e-posta ara…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button className="clear-search" onClick={() => setSearchInput('')} aria-label="Temizle">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="toolbar-right">
          <div className="sort-tabs">
            {([
              ['newest', 'En Yeni'],
              ['oldest', 'En Eski'],
              ['name', 'İsim'],
            ] as [SortKey, string][]).map(([k, label]) => (
              <button
                key={k}
                className={`sort-tab${sort === k ? ' active' : ''}`}
                onClick={() => {
                  setSort(k);
                  setPage(1);
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button className="btn btn-primary" onClick={() => setFormModal({ mode: 'create' })}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Yeni Kullanıcı
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-card card">
        <div className="table-head">
          <div className="col-user">Kullanıcı</div>
          <div className="col-city">Şehir</div>
          <div className="col-role">Rol</div>
          <div className="col-date">Kayıt</div>
          <div className="col-actions">İşlemler</div>
        </div>

        {loading ? (
          <div className="table-state">
            <svg className="spin" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        ) : error ? (
          <div className="table-state error">{error}</div>
        ) : users.length === 0 ? (
          <div className="table-state">
            <p>Sonuç bulunamadı.</p>
            {search && <span>"{search}" için kullanıcı yok.</span>}
          </div>
        ) : (
          users.map((u) => {
            const isSelf = u.id === admin?.id;
            return (
              <div className="table-row" key={u.id} onClick={() => setSelected(u)}>
                <div className="col-user">
                  <Avatar name={u.name} src={u.profileImage} size={42} />
                  <div className="user-cell">
                    <strong>
                      {u.name}
                      {isSelf && <span className="you-tag">sen</span>}
                    </strong>
                    <span>{u.email}</span>
                  </div>
                </div>
                <div className="col-city">{u.city || <span className="muted">—</span>}</div>
                <div className="col-role">
                  {u.isBlocked ? (
                    <span className="badge blocked dot">Engelli</span>
                  ) : u.isAdmin ? (
                    <span className="badge admin dot">Yönetici</span>
                  ) : (
                    <span className="badge dot">Üye</span>
                  )}
                </div>
                <div className="col-date">{fmtDate(u.createdAt)}</div>
                <div className="col-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="icon-btn"
                    title="Düzenle"
                    onClick={() => setFormModal({ mode: 'edit', user: u })}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </button>
                  <button
                    className={`icon-btn${u.isBlocked ? '' : ' danger'}`}
                    title={u.isBlocked ? 'Engeli kaldır' : 'Engelle'}
                    onClick={() => setConfirmBlock(u)}
                    disabled={isSelf}
                  >
                    {u.isBlocked ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12l2 2 4-4" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m4.9 4.9 14.2 14.2" />
                      </svg>
                    )}
                  </button>
                  <button
                    className="icon-btn danger"
                    title="Sil"
                    onClick={() => setConfirmDelete(u)}
                    disabled={isSelf}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && total > 0 && (
        <div className="pagination">
          <span className="page-info">
            {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} / {total} kullanıcı
          </span>
          <div className="page-controls">
            <button className="icon-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            {pageNumbers.map((n) => (
              <button
                key={n}
                className={`page-num${n === page ? ' active' : ''}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button
              className="icon-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Drawer */}
      {selected && (
        <UserDrawer
          user={selected}
          isSelf={selected.id === admin?.id}
          onClose={() => setSelected(null)}
          onEdit={(u) => setFormModal({ mode: 'edit', user: u })}
          onToggleAdmin={(u) => setConfirmAdmin(u)}
          onBlock={(u) => setConfirmBlock(u)}
          onDelete={(u) => setConfirmDelete(u)}
        />
      )}

      {/* Create / Edit form */}
      {formModal && (
        <UserFormModal
          mode={formModal.mode}
          user={formModal.user}
          onClose={() => setFormModal(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Confirms */}
      <ConfirmDialog
        open={!!confirmAdmin}
        title={confirmAdmin?.isAdmin ? 'Yönetici yetkisini kaldır' : 'Yönetici yap'}
        message={
          confirmAdmin?.isAdmin
            ? `${confirmAdmin?.name} kullanıcısının yönetici yetkisini kaldırmak istediğine emin misin?`
            : `${confirmAdmin?.name} kullanıcısına yönetici yetkisi vermek istediğine emin misin?`
        }
        confirmLabel={confirmAdmin?.isAdmin ? 'Yetkiyi Kaldır' : 'Yönetici Yap'}
        busy={busy}
        onConfirm={doToggleAdmin}
        onCancel={() => setConfirmAdmin(null)}
      />
      <ConfirmDialog
        open={!!confirmBlock}
        danger={!confirmBlock?.isBlocked}
        title={confirmBlock?.isBlocked ? 'Engeli kaldır' : 'Kullanıcıyı engelle'}
        message={
          confirmBlock?.isBlocked
            ? `${confirmBlock?.name} tekrar uygulamaya giriş yapabilecek.`
            : `${confirmBlock?.name} uygulamaya giriş yapamayacak. Verileri silinmez.`
        }
        confirmLabel={confirmBlock?.isBlocked ? 'Engeli Kaldır' : 'Engelle'}
        busy={busy}
        onConfirm={doBlock}
        onCancel={() => setConfirmBlock(null)}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        danger
        title="Kullanıcıyı sil"
        message={`${confirmDelete?.name} kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Evet, Sil"
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
