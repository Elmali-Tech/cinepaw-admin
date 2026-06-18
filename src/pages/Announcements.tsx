import { useState, useEffect } from 'react';
import api, { errMsg } from '../lib/api';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import type { Announcement } from '../types';
import './announcements.css';

const MAX_MSG = 1000;

const fmtDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export default function Announcements() {
  const { notify } = useToast();

  // ── form state ────────────────────────────────────────────────────────────
  const [message, setMessage]       = useState('');
  const [actionUrl, setActionUrl]   = useState('');
  const [useSchedule, setUseSchedule] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [sending, setSending]       = useState(false);

  // ── history state ─────────────────────────────────────────────────────────
  const [history, setHistory]       = useState<Announcement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // ── cancel confirm ────────────────────────────────────────────────────────
  const [cancelTarget, setCancelTarget] = useState<Announcement | null>(null);
  const [cancelling, setCancelling]     = useState(false);

  // minimum datetime-local value = now + 2 minutes (rounded to the minute)
  const minSchedule = (): string => {
    const d = new Date(Date.now() + 2 * 60 * 1000);
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  };

  const loadHistory = async () => {
    try {
      const { data } = await api.get<Announcement[]>('/admin/announcements');
      setHistory(data);
    } catch (err) {
      notify(errMsg(err, 'Duyuru geçmişi yüklenemedi.'), 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) { notify('Lütfen bir mesaj girin.', 'error'); return; }
    if (trimmed.length > MAX_MSG) { notify('Mesaj çok uzun.', 'error'); return; }

    if (useSchedule) {
      if (!scheduledFor) { notify('Zamanlama tarihi seçin.', 'error'); return; }
      if (new Date(scheduledFor).getTime() <= Date.now() + 60_000) {
        notify('Zamanlama en az 1 dakika ileri olmalı.', 'error');
        return;
      }
    }

    setSending(true);
    try {
      const payload: Record<string, string> = { message: trimmed };
      if (actionUrl.trim()) payload.actionUrl = actionUrl.trim();
      if (useSchedule && scheduledFor) payload.scheduledFor = new Date(scheduledFor).toISOString();

      const { data } = await api.post<{ message: string; recipientCount?: number; scheduledFor?: string }>(
        '/admin/announcements',
        payload
      );

      notify(data.message, 'success');
      setMessage('');
      setActionUrl('');
      setScheduledFor('');
      setUseSchedule(false);
      await loadHistory();
    } catch (err) {
      notify(errMsg(err, 'Duyuru gönderilemedi.'), 'error');
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.delete(`/admin/announcements/${cancelTarget.id}`);
      notify('Zamanlanmış duyuru iptal edildi.', 'success');
      setCancelTarget(null);
      await loadHistory();
    } catch (err) {
      notify(errMsg(err, 'İptal işlemi başarısız.'), 'error');
    } finally {
      setCancelling(false);
    }
  };

  const charLeft = MAX_MSG - message.length;

  return (
    <div className="ann-layout fade-in">
      {/* ── Compose ── */}
      <div className="ann-compose">
        <div className="card">
          <div className="ann-compose-head">
            <div className="ann-compose-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <line x1="10" y1="9" x2="8" y2="9"/>
              </svg>
            </div>
            <div>
              <h3>Yeni Duyuru</h3>
              <p>Tüm kullanıcılara bildirim gönder</p>
            </div>
          </div>

          <form className="ann-form" onSubmit={handleSend}>
            <div className="ann-field">
              <label htmlFor="ann-msg">Mesaj *</label>
              <textarea
                id="ann-msg"
                className="input ann-textarea"
                placeholder="Kullanıcılara iletmek istediğiniz duyuruyu yazın…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={MAX_MSG}
                disabled={sending}
              />
              <span className={`ann-char-count${charLeft < 100 ? ' warn' : ''}`}>
                {charLeft} / {MAX_MSG} karakter kaldı
              </span>
            </div>

            <div className="ann-field">
              <label htmlFor="ann-url">Bağlantı URL (isteğe bağlı)</label>
              <input
                id="ann-url"
                type="url"
                className="input"
                placeholder="https://…"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                disabled={sending}
              />
            </div>

            <label className="ann-schedule-toggle">
              <input
                type="checkbox"
                checked={useSchedule}
                onChange={(e) => {
                  setUseSchedule(e.target.checked);
                  if (!e.target.checked) setScheduledFor('');
                }}
                disabled={sending}
              />
              Zamanlı gönderim
            </label>

            {useSchedule && (
              <div className="ann-field">
                <label htmlFor="ann-schedule">Gönderim tarihi & saati *</label>
                <input
                  id="ann-schedule"
                  type="datetime-local"
                  className="input"
                  min={minSchedule()}
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  disabled={sending}
                />
              </div>
            )}

            <div className="ann-form-footer">
              <span className="ann-recipient-hint">
                {useSchedule ? 'Belirtilen saatte tüm aktif kullanıcılara gönderilecek.' : 'Anında tüm aktif kullanıcılara gönderilecek.'}
              </span>
              <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !message.trim()}>
                {sending ? (
                  <>
                    <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" opacity=".25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                    Gönderiliyor…
                  </>
                ) : useSchedule ? 'Zamanla' : 'Gönder'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── History ── */}
      <div className="ann-history">
        <div className="card">
          <div className="ann-history-head">
            <h3>Duyuru Geçmişi</h3>
            <span>{history.length} kayıt</span>
          </div>

          {loadingHistory ? (
            <div className="ann-loading">
              <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" opacity=".25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
              Yükleniyor…
            </div>
          ) : history.length === 0 ? (
            <div className="ann-empty">Henüz duyuru gönderilmemiş.</div>
          ) : (
            <table className="ann-table">
              <thead>
                <tr>
                  <th>Mesaj</th>
                  <th>Durum</th>
                  <th>Alıcı</th>
                  <th>Tarih</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {history.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="ann-msg">{a.message}</div>
                      {a.actionUrl && (
                        <a className="ann-action-link" href={a.actionUrl} target="_blank" rel="noreferrer">
                          {a.actionUrl}
                        </a>
                      )}
                    </td>
                    <td>
                      {a.status === 'sent' ? (
                        <span className="ann-status-sent">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          Gönderildi
                        </span>
                      ) : (
                        <>
                          <span className="ann-status-scheduled">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            Zamanlandı
                          </span>
                          {a.scheduledFor && (
                            <div className="ann-scheduled-info">{fmtDate(a.scheduledFor)}</div>
                          )}
                        </>
                      )}
                    </td>
                    <td className="ann-recipients">
                      {a.status === 'sent' ? a.recipientCount.toLocaleString('tr-TR') : '—'}
                    </td>
                    <td className="ann-date">
                      {a.status === 'sent' ? fmtDate(a.sentAt) : fmtDate(a.createdAt)}
                    </td>
                    <td>
                      {a.status === 'scheduled' && (
                        <button
                          className="ann-cancel-btn"
                          title="Zamanlamayı iptal et"
                          onClick={() => setCancelTarget(a)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Cancel confirm ── */}
      {cancelTarget && (
        <ConfirmDialog
          open={true}
          title="Duyuruyu İptal Et"
          message={`"${cancelTarget.message.slice(0, 80)}${cancelTarget.message.length > 80 ? '…' : ''}" adlı zamanlanmış duyuru iptal edilecek.`}
          confirmLabel="İptal Et"
          danger={true}
          busy={cancelling}
          onConfirm={handleCancel}
          onCancel={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}
