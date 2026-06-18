import { useEffect, useRef, useState } from 'react';
import api, { errMsg } from '../lib/api';
import { useToast } from '../context/ToastContext';
import type { AppSettings } from '../types';
import './settings.css';

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  busy: boolean;
  onChange: (next: boolean) => void;
}

function ToggleRow({ label, description, checked, busy, onChange }: ToggleRowProps) {
  return (
    <div className="setting-row">
      <div className="setting-info">
        <span className="setting-label">{label}</span>
        <span className="setting-desc">{description}</span>
      </div>
      <button
        className={`switch${checked ? ' on' : ''}${busy ? ' busy' : ''}`}
        onClick={() => !busy && onChange(!checked)}
        aria-pressed={checked}
        aria-label={label}
        type="button"
      >
        {busy ? (
          <svg className="spin knob-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <span className="switch-knob" />
        )}
      </button>
    </div>
  );
}

export default function Settings() {
  const { notify } = useToast();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  // ── Splash video state ────────────────────────────────────────────────────
  const [splashUrl, setSplashUrl]         = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading]         = useState(false);
  const [removing, setRemoving]           = useState(false);
  const [ytUrl, setYtUrl]                 = useState('');
  const [ytUploading, setYtUploading]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get<AppSettings>('/admin/settings')
      .then(({ data }) => {
        setSettings(data);
        setSplashUrl(data.splash_video_url ?? null);
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key: keyof AppSettings, next: boolean) => {
    if (!settings) return;
    setBusy(key as string);
    try {
      await api.patch('/admin/settings', { key, value: next });
      setSettings((s) => s ? { ...s, [key]: next } : s);
      notify(next ? 'Özellik etkinleştirildi.' : 'Özellik devre dışı bırakıldı.', 'success');
    } catch (e) {
      notify(errMsg(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      notify('Lütfen bir video dosyası seçin.', 'error');
      return;
    }

    // Client-side size guard: 200 MB
    if (file.size > 200 * 1024 * 1024) {
      notify('Video çok büyük. Maks. 200 MB.', 'error');
      return;
    }

    const form = new FormData();
    form.append('file', file);

    setUploading(true);
    setUploadProgress(0);
    try {
      const { data } = await api.post<{ url: string }>('/admin/splash/video', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      setSplashUrl(data.url);
      notify('Giriş ekranı videosu güncellendi.', 'success');
    } catch (e) {
      notify(errMsg(e, 'Video yüklenemedi.'), 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleYtUpload = async () => {
    if (!ytUrl.trim()) return;
    setYtUploading(true);
    try {
      const { data } = await api.post<{ url: string }>('/admin/splash/youtube', { url: ytUrl.trim() });
      setSplashUrl(data.url);
      setYtUrl('');
      notify('Giriş ekranı videosu güncellendi.', 'success');
    } catch (e) {
      notify(errMsg(e, 'YouTube videosu indirilemedi.'), 'error');
    } finally {
      setYtUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await api.delete('/admin/splash/video');
      setSplashUrl(null);
      notify('Giriş ekranı videosu kaldırıldı.', 'success');
    } catch (e) {
      notify(errMsg(e, 'Video kaldırılamadı.'), 'error');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="settings-page fade-in">

      {/* ── Media upload toggle ── */}
      <div className="settings-section card">
        <div className="settings-section-head">
          <div className="settings-section-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M9 9h1M14 9h1M9 14h6" />
            </svg>
          </div>
          <div>
            <h3>Medya Ayarları</h3>
            <p>Kullanıcıların uygulama üzerinden dosya yükleyip yükleyemeyeceğini kontrol et.</p>
          </div>
        </div>

        <div className="settings-rows">
          {loading ? (
            <div className="settings-loading">
              <svg className="spin" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
          ) : error ? (
            <div className="settings-error">{error}</div>
          ) : settings ? (
            <ToggleRow
              label="Medya Yükleme"
              description="Kapatılırsa kullanıcılar profil fotoğrafı, banner ve gönderi medyası yükleyemez. Mevcut medyalar etkilenmez."
              checked={!!settings.media_uploads_allowed}
              busy={busy === 'media_uploads_allowed'}
              onChange={(next) => toggle('media_uploads_allowed', next)}
            />
          ) : null}
        </div>
      </div>

      {/* ── Splash video ── */}
      <div className="settings-section card">
        <div className="settings-section-head">
          <div className="settings-section-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div>
            <h3>Giriş Ekranı Videosu</h3>
            <p>Uygulama açılışında oynatılan tanıtım videosu. Maks. 8 saniye · 200 MB.</p>
          </div>
        </div>

        <div className="splash-body">
          {/* Current video preview */}
          {splashUrl && (
            <div className="splash-preview">
              <video
                src={splashUrl}
                controls
                muted
                playsInline
                className="splash-video-preview"
              />
              <div className="splash-preview-footer">
                <span className="splash-preview-label">Mevcut video</span>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleRemove}
                  disabled={removing || uploading}
                >
                  {removing ? (
                    <svg className="spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  )}
                  Kaldır
                </button>
              </div>
            </div>
          )}

          {/* Upload area */}
          <div
            className={`splash-upload-area${uploading ? ' uploading' : ''}`}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {uploading ? (
              <div className="splash-upload-progress">
                <svg className="spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span>Yükleniyor… {uploadProgress}%</span>
                <div className="splash-progress-bar">
                  <div className="splash-progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : (
              <>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span className="splash-upload-title">
                  {splashUrl ? 'Videoyu değiştir' : 'Video yükle'}
                </span>
                <span className="splash-upload-hint">MP4, MOV veya WEBM · Maks. 8sn · 200MB</span>
              </>
            )}
          </div>

          {/* YouTube URL */}
          <div className="splash-yt-row">
            <span className="splash-yt-divider">— veya YouTube'dan indir —</span>
            <div className="splash-yt-input-row">
              <input
                className="splash-yt-input"
                type="url"
                placeholder="https://youtube.com/watch?v=…"
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                disabled={uploading || ytUploading || removing}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleYtUpload}
                disabled={!ytUrl.trim() || uploading || ytUploading || removing}
                type="button"
              >
                {ytUploading ? (
                  <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                )}
                {ytUploading ? 'İndiriliyor…' : 'İndir'}
              </button>
            </div>
            <span className="splash-yt-hint">Video sunucuya indirilir ve Supabase'e yüklenir. Kısa videolar önerilir (maks. 20 sn).</span>
          </div>

          <p className="splash-note">
            Videoyu yüklemeden önce Supabase Storage'da <code>splash-videos</code> adında bir <strong>public</strong> bucket oluşturulmuş olmalıdır.
          </p>
        </div>
      </div>

    </div>
  );
}
