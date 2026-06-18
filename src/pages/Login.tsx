import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/users', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      {/* Brand / hero side */}
      <div className="login-hero">
        <div className="hero-glow" />
        <div className="hero-content">
          <div className="hero-mark">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff">
              <circle cx="6.5" cy="9" r="2.1" />
              <circle cx="11" cy="6.2" r="2.1" />
              <circle cx="15.5" cy="6.2" r="2.1" />
              <circle cx="18.5" cy="10" r="1.8" />
              <path d="M12 11.5c-2.5 0-4.6 1.9-4.6 4.2 0 1.7 1.3 2.6 3 2.6 1 0 1.1-.4 1.6-.4s.6.4 1.6.4c1.7 0 3-.9 3-2.6 0-2.3-2.1-4.2-4.6-4.2z" />
            </svg>
          </div>
          <h1>CinePaw Admin</h1>
          <p>Kullanıcıları yönet, toplulukla ilgilen, platformu kontrol et.</p>
          <ul className="hero-points">
            <li>Kullanıcı arama, filtreleme ve yönetimi</li>
            <li>Yönetici yetkilerini kontrol et</li>
            <li>Topluluk istatistiklerini takip et</li>
          </ul>
        </div>
      </div>

      {/* Form side */}
      <div className="login-form-wrap">
        <form className="login-form fade-in" onSubmit={onSubmit}>
          <h2>Tekrar hoş geldin 👋</h2>
          <p className="login-sub">Devam etmek için yönetici hesabınla giriş yap.</p>

          {error && (
            <div className="login-error">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label className="field-label">E-posta</label>
            <input
              className="input"
              type="email"
              placeholder="admin@cinepaw.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label className="field-label">Şifre</label>
            <div className="pw-field">
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw((s) => !s)}
                tabIndex={-1}
                aria-label="Şifreyi göster/gizle"
              >
                {showPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button className="btn btn-primary login-submit" type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Giriş yapılıyor…
              </>
            ) : (
              'Giriş Yap'
            )}
          </button>

          <button
            type="button"
            className="demo-hint"
            onClick={() => {
              setEmail('admin@cinepaw.com');
              setPassword('CinePaw2026!');
            }}
          >
            <span className="demo-dot" />
            Demo girişini doldur · <code>admin@cinepaw.com</code> / <code>CinePaw2026!</code>
          </button>

          <p className="login-foot">Yalnızca yönetici yetkisi olan hesaplar giriş yapabilir.</p>
        </form>
      </div>
    </div>
  );
}
