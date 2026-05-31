import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, XCircle, ChevronRight, Trash2 } from 'lucide-react';
import { reservationsAPI, api } from '../utils/api';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/MesReservations.css';

const DAYS_FR   = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
const MONTHS_FR = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];

const STATUS_MAP = {
  confirmee:  { label: 'Confirmé',   bg: 'rgba(0,200,83,.15)',   color: '#00C853' },
  en_attente: { label: 'En attente', bg: 'rgba(255,179,0,.15)',  color: '#FFB300' },
  annulee:    { label: 'Annulé',     bg: 'rgba(255,68,68,.15)',  color: '#FF4444' },
  terminee:   { label: 'Terminé',    bg: 'rgba(100,120,100,.2)', color: '#7A9E82' },
};

const TABS = ['Tous', 'À venir', 'Passés', 'Annulés'];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}

function today0() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isUpcoming(r) {
  if (r.statut === 'annulee') return false;
  return new Date(r.date_reservation + 'T00:00:00') >= today0();
}

function isPast(r) {
  if (r.statut === 'annulee') return false;
  return new Date(r.date_reservation + 'T00:00:00') < today0() || r.statut === 'terminee';
}

export default function MesReservations() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]   = useState('Tous');
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const navigate        = useNavigate();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await reservationsAPI.getAll();
      setItems(r.data.data || []);
    } catch (err) {
      if (err.response?.status === 401) navigate('/connexion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const annuler = (id) => {
    setModal({
      title: 'Annuler la reservation',
      message: 'Etes-vous sur de vouloir annuler cette reservation ?',
      confirmLabel: 'Oui, annuler',
      cancelLabel: 'Garder',
      onConfirm: async () => {
        setModal(null);
        try {
          await reservationsAPI.annuler(id);
          load();
        } catch (err) {
          if (err.response?.status === 401) navigate('/connexion');
        }
      },
      onCancel: () => setModal(null),
    });
  };

  const supprimer = async (id) => {
    try {
      await api.post(`/reservations.php?action=supprimer&id=${id}`);
      setItems(prev => prev.filter(r => r.id !== id));
      showToast('Réservation supprimée');
    } catch (err) {
      if (err.response?.status === 401) navigate('/connexion');
    }
  };

  const filtered = useMemo(() => {
    if (tab === 'À venir') return items.filter(isUpcoming);
    if (tab === 'Passés')  return items.filter(isPast);
    if (tab === 'Annulés') return items.filter(r => r.statut === 'annulee');
    return items;
  }, [items, tab]);

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', paddingBottom: 64 }}>
      <Toast toast={toast} />
      {modal && (
        <ConfirmModal
          title={modal.title}
          message={modal.message}
          confirmLabel={modal.confirmLabel}
          cancelLabel={modal.cancelLabel}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
        />
      )}
      <div className="page-hero">
        <div className="page-kicker">Suivi et historique</div>
        <h1 className="section-title">Mes <span className="gradient-text">Rendez-vous</span></h1>
        <p className="page-subtitle">Retrouvez vos rendez-vous confirmés, passés ou annulés.</p>
      </div>

        {/* Filter tabs */}
        <div className="rdv-tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`rdv-tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
              {t === 'Tous'    && <span className="rdv-tab-count">{items.length}</span>}
              {t === 'À venir' && <span className="rdv-tab-count">{items.filter(isUpcoming).length}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} />
            <h3>Aucun rendez-vous</h3>
            <p>Aucune réservation dans cette catégorie.</p>
          </div>
        ) : (
          <div className="rdv-list">
            {filtered.map(r => (
              <ReservationCard key={r.id} r={r} onCancel={annuler} onDelete={supprimer} />
            ))}
          </div>
        )}
    </div>
  );
}

function ReservationCard({ r, onCancel, onDelete }) {
  const [detail, setDetail] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = STATUS_MAP[r.statut] || STATUS_MAP.en_attente;
  const canCancel = r.statut !== 'annulee' && r.statut !== 'terminee';
  const canDelete = r.statut === 'annulee';

  return (
    <div className="rdv-card">
      <div className="rdv-card-img">
        <img
          src={r.image_url || 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300'}
          alt={r.nom_praticien}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300'; }}
        />
      </div>

      <div className="rdv-card-body">
        <div className="rdv-card-top">
          <div>
            <div className="rdv-card-praticien">{r.nom_praticien}</div>
            <div className="rdv-card-specialite">{r.categorie_nom || r.titre}</div>
          </div>
          <span className="rdv-card-status" style={{ background: status.bg, color: status.color }}>
            {status.label}
          </span>
        </div>

        <div className="rdv-card-date-block">
          <div className="rdv-card-date">{formatDate(r.date_reservation)}</div>
        </div>

        <div className="rdv-card-meta">
          <span><Clock size={13} /> {String(r.heure_reservation).slice(0, 5)} · {r.duree} min</span>
          <span><MapPin size={13} /> {r.lieu?.split(',')[0]}</span>
        </div>

        <div className="rdv-card-footer">
          <span className="rdv-card-price">
            {Number(r.prix_paye || r.service_prix || 0).toFixed(0)} €
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {confirmDelete ? (
              <>
                <button
                  className="btn btn-sm"
                  style={{ background: '#ef4444', color: '#fff', border: 'none' }}
                  onClick={() => { setConfirmDelete(false); onDelete(r.id); }}
                >
                  Confirmer la suppression
                </button>
                <button
                  className="btn btn-sm"
                  style={{ background: 'transparent', border: '1px solid #2a4030', color: '#9ca3af' }}
                  onClick={() => setConfirmDelete(false)}
                >
                  Annuler
                </button>
              </>
            ) : (
              <>
                {canCancel && (
                  <button className="btn btn-danger btn-sm" onClick={() => onCancel(r.id)}>
                    <XCircle size={14} /> Annuler
                  </button>
                )}
                {canDelete && (
                  <button
                    className="btn btn-sm"
                    style={{
                      background: 'transparent',
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 size={14} /> Supprimer
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setDetail(d => !d)}>
                  Détails
                  <ChevronRight
                    size={14}
                    style={{ transform: detail ? 'rotate(90deg)' : '', transition: '0.2s' }}
                  />
                </button>
              </>
            )}
          </div>
        </div>

        {detail && (
          <div className="rdv-card-detail">
            <div><strong>Service :</strong> {r.titre}</div>
            <div><strong>Lieu complet :</strong> {r.lieu}</div>
            <div><strong>Prix :</strong> {Number(r.prix_paye || r.service_prix || 0).toFixed(2)} €</div>
          </div>
        )}
      </div>
    </div>
  );
}
