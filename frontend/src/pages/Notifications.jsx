import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI, api } from '../utils/api';
import { Bell, CheckCheck, Calendar, Info, AlertCircle, Zap, CheckSquare, X, Trash2 } from 'lucide-react';
import Toast from '../components/Toast';

const TYPE_CONFIG = {
  reservation:     { icon: Calendar,     color: '#00C853' },
  annulation:      { icon: AlertCircle,  color: '#FF4444' },
  rappel:          { icon: Bell,         color: '#FFB300' },
  nouveau_service: { icon: Zap,          color: '#A8E063' },
  info:            { icon: Info,         color: '#7A9E82' },
};

const TYPE_DEST = {
  reservation:     '/mes-reservations',
  annulation:      '/mes-reservations',
  rappel:          '/mes-reservations',
  nouveau_service: '/services',
  info:            '/tableau-de-bord',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await notificationsAPI.getAll();
      setNotifications(r.data.data || []);
    } catch (err) {
      if (err.response?.status === 401) navigate('/connexion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleClick = async (notif) => {
    if (selectionMode) {
      toggleSelection(notif.id);
      return;
    }
    if (!notif.lu) {
      await notificationsAPI.markRead(notif.id).catch(() => {});
    }
    navigate(TYPE_DEST[notif.type] || '/tableau-de-bord');
  };

  const markAllRead = async () => {
    await notificationsAPI.markAllRead().catch(() => {});
    load();
  };

  const enterSelectionMode = () => {
    setSelectionMode(true);
    setSelected([]);
    setConfirmBulkDelete(false);
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelected([]);
    setConfirmBulkDelete(false);
  };

  const toggleSelection = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelected(notifications.map(n => n.id));
  };

  const deleteSelected = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map(id => api.post(`/notifications.php?action=supprimer&id=${id}`)));
      setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
      showToast(`${ids.length} notification(s) supprimée(s)`);
      exitSelectionMode();
    } catch (err) {
      if (err.response?.status === 401) navigate('/connexion');
    }
  };

  const selectedCount = selected.length;

  return (
    <div className="container" style={{ paddingBottom: selectionMode ? 100 : undefined }}>
      <Toast toast={toast} bottom={selectionMode ? 88 : 24} />

      <div className="page-hero">
        <div className="page-kicker">Alertes & mises à jour</div>
        <h1 className="section-title">Mes <span className="gradient-text">Notifications</span></h1>
        <p className="page-subtitle">Restez informé de vos réservations et activités.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div className="spinner" />
        </div>
      ) : (
        <div style={{ maxWidth: 720 }}>
          {notifications.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
              {!selectionMode && (
                <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
                  <CheckCheck size={15} /> Tout marquer comme lu
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={selectionMode ? exitSelectionMode : enterSelectionMode}>
                {selectionMode ? <X size={15} /> : <CheckSquare size={15} />}
                {selectionMode ? 'Annuler' : 'Sélectionner'}
              </button>
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="empty-state">
              <Bell size={48} />
              <h3>Aucune notification</h3>
              <p>Vous êtes à jour !</p>
            </div>
          ) : (
            notifications.map(notif => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
              const Icon = cfg.icon;
              const isSelected = selected.includes(notif.id);
              return (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    padding: '16px 20px',
                    marginBottom: 8,
                    background: isSelected
                      ? 'rgba(168,224,99,0.1)'
                      : notif.lu ? 'var(--bg-card)' : 'rgba(168,224,99,0.06)',
                    border: `1px solid ${isSelected
                      ? '#A8E063'
                      : notif.lu ? 'var(--border2)' : 'rgba(168,224,99,0.22)'}`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {selectionMode && (
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${isSelected ? '#A8E063' : 'var(--border)'}`,
                      background: isSelected ? '#A8E063' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: 9, transition: 'all 0.15s',
                    }}>
                      {isSelected && (
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#0D2B1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  )}

                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: notif.lu ? 'rgba(255,255,255,0.05)' : cfg.color + '22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: notif.lu ? 'var(--text-muted)' : cfg.color,
                  }}>
                    <Icon size={17} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {notif.titre && (
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                        {notif.titre}
                      </div>
                    )}
                    <div style={{ fontSize: '0.88rem', fontWeight: notif.lu ? 400 : 500, color: notif.lu ? 'var(--text-muted)' : 'var(--text)' }}>
                      {notif.message}
                    </div>
                    {notif.date_creation && (
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: 5 }}>
                        {new Date(notif.date_creation).toLocaleString('fr-FR', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>

                  {!selectionMode && !notif.lu && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--primary)', flexShrink: 0, marginTop: 6
                    }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Floating action bar */}
      {selectionMode && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#0a2218',
          borderTop: '1px solid #2a4030',
          padding: '16px 24px',
          display: 'flex', alignItems: 'center', gap: 12,
          zIndex: 999,
          flexWrap: 'wrap',
        }}>
          {confirmBulkDelete ? (
            <>
              <span style={{ color: '#FAFAF7', fontWeight: 600, fontSize: '0.9rem', flex: 1 }}>
                Supprimer {selectedCount} notification(s) ?
              </span>
              <button
                className="btn btn-sm"
                style={{ background: '#ef4444', color: '#fff', border: 'none' }}
                onClick={deleteSelected}
              >
                Confirmer
              </button>
              <button
                className="btn btn-sm"
                style={{ background: 'transparent', border: '1px solid #2a4030', color: '#9ca3af' }}
                onClick={() => setConfirmBulkDelete(false)}
              >
                Annuler
              </button>
            </>
          ) : (
            <>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flex: 1 }}>
                {selectedCount} notification(s) sélectionnée(s)
              </span>
              <button className="btn btn-ghost btn-sm" onClick={selectAll}>
                Tout sélectionner
              </button>
              {selectedCount > 0 && (
                <button
                  className="btn btn-sm"
                  style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  onClick={() => setConfirmBulkDelete(true)}
                >
                  <Trash2 size={14} /> Supprimer la sélection
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
