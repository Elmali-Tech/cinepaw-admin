import { useState, type FormEvent } from 'react';
import api, { errMsg } from '../lib/api';
import type { AdminUser } from '../types';
import './modal.css';

interface UserFormModalProps {
  mode: 'create' | 'edit';
  user?: AdminUser;
  onClose: () => void;
  onSaved: (user: AdminUser, mode: 'create' | 'edit') => void;
}

export default function UserFormModal({ mode, user, onClose, onSaved }: UserFormModalProps) {
  const isEdit = mode === 'edit';
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState(user?.city ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [isAdmin, setIsAdmin] = useState(user?.isAdmin ?? false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isEdit && user) {
        const payload: Record<string, unknown> = {
          name,
          email,
          city,
          bio,
          isAdmin,
        };
        if (password) payload.password = password;
        const { data } = await api.patch<{ user: AdminUser }>(`/admin/users/${user.id}`, payload);
        onSaved(data.user, 'edit');
      } else {
        const { data } = await api.post<{ user: AdminUser }>('/admin/users', {
          name,
          email,
          password,
          city,
          bio,
          isAdmin,
        });
        onSaved(data.user, 'create');
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <form className="form-modal fade-in" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="form-modal-head">
          <h3>{isEdit ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı'}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Kapat">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="form-modal-body">
          {error && (
            <div className="login-error">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </div>
          )}

          <div>
            <label className="field-label">İsim</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ad Soyad" />
          </div>

          <div>
            <label className="field-label">E-posta</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="kullanici@cinepaw.com" />
          </div>

          <div>
            <label className="field-label">
              Şifre {isEdit && <span className="hint-inline">(boş bırak = değişmez)</span>}
            </label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isEdit}
              placeholder={isEdit ? '••••••••' : 'En az 6 karakter'}
              autoComplete="new-password"
            />
          </div>

          <div className="form-grid-2">
            <div>
              <label className="field-label">Şehir</label>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="İsteğe bağlı" />
            </div>
            <div className="admin-toggle-wrap">
              <label className="field-label">Yönetici</label>
              <button
                type="button"
                className={`switch${isAdmin ? ' on' : ''}`}
                onClick={() => setIsAdmin((v) => !v)}
                aria-pressed={isAdmin}
              >
                <span className="switch-knob" />
              </button>
            </div>
          </div>

          <div>
            <label className="field-label">Hakkında</label>
            <textarea className="input textarea" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="İsteğe bağlı kısa biyografi" rows={3} />
          </div>
        </div>

        <div className="form-modal-foot">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Vazgeç
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? (
              <svg className="spin" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : isEdit ? (
              'Kaydet'
            ) : (
              'Oluştur'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
