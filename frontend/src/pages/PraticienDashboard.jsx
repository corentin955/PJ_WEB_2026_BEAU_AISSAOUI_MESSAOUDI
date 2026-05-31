import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { praticienAPI, servicesAPI } from '../utils/api';
import {
  Calendar, CalendarDays, CheckCircle, XCircle,
  Loader, ChevronLeft, ChevronRight, User, ImageIcon,
  Plus, X, Send, Layers,
} from 'lucide-react';
import { format, startOfWeek, addWeeks, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import '../styles/PraticienDashboard.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUT_META = {
  en_attente: { label: 'En attente', cls: 'badge-warning'  },
  confirmee:  { label: 'Confirmee',  cls: 'badge-success'  },
  annulee:    { label: 'Annulee',    cls: 'badge-danger'   },
  terminee:   { label: 'Terminee',   cls: 'badge-neutral'  },
};

const STATUT_COLORS = {
  en_attente: '#F59E0B',
  confirmee:  '#10B981',
  annulee:    '#EF4444',
  terminee:   '#6B7280',
};

function StatutBadge({ statut }) {
  const m = STATUT_META[statut] || { label: statut, cls: '' };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}

const fmtDate = (d) => {
  try { return format(new Date(d), 'EEE d MMM yyyy', { locale: fr }); }
  catch { return d || '—'; }
};

const emitNotifUpdate = () =>
  window.dispatchEvent(new CustomEvent('vitacare:notif-update'));

// ─── Patient Modal ────────────────────────────────────────────────────────────

function PatientModal({ patientId, onClose }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    praticienAPI.profilPatient(patientId)
      .then(r => setData(r.data.data))
      .catch(() => setError('Impossible de charger ce profil.'))
      .finally(() => setLoading(false));
  }, [patientId]);

  return (
    <div className="prat-modal-overlay" onClick={onClose}>
      <div className="prat-modal" onClick={e => e.stopPropagation()}>
        <div className="prat-modal-header">
          <div className="prat-modal-title"><User size={17} /> Profil patient</div>
          <button className="prat-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {loading && (
          <div className="praticien-loading"><Loader size={20} className="spin" /> Chargement...</div>
        )}
        {error && <div className="alert alert-error">{error}</div>}
        {data && (
          <>
            <div className="prat-patient-name">{data.prenom} {data.nom}</div>
            <div className="prat-patient-grid">
              <div><span className="prat-field-label">Email</span>{data.email || '—'}</div>
              <div><span className="prat-field-label">Telephone</span>{data.telephone || '—'}</div>
              <div><span className="prat-field-label">Poids</span>{data.poids ? `${data.poids} kg` : '—'}</div>
              <div><span className="prat-field-label">Taille</span>{data.taille ? `${data.taille} cm` : '—'}</div>
              {data.historique_sportif && (
                <div className="prat-patient-full">
                  <span className="prat-field-label">Historique sportif</span>
                  <span>{data.historique_sportif}</span>
                </div>
              )}
            </div>

            {data.historique?.length > 0 && (
              <>
                <div className="prat-modal-section-title">Historique des rendez-vous</div>
                <div className="prat-modal-table-wrap">
                  <table className="agenda-table" style={{ fontSize: '0.83rem' }}>
                    <thead>
                      <tr>
                        <th>Date</th><th>Heure</th><th>Service</th><th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.historique.map((h, i) => (
                        <tr key={i}>
                          <td>{fmtDate(h.date_reservation)}</td>
                          <td><span className="time-chip">{h.heure_reservation?.slice(0, 5)}</span></td>
                          <td>{h.service_titre}</td>
                          <td><StatutBadge statut={h.statut} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Vue Semaine ──────────────────────────────────────────────────────────────

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

function WeekView({ rdvs, weekOffset, onWeekChange, onRdvClick }) {
  const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getRdv = (day, slot) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return rdvs.filter(r =>
      r.date_reservation === dayStr &&
      (r.heure_reservation || '').slice(0, 5) === slot
    );
  };

  return (
    <div>
      <div className="week-nav">
        <button className="btn btn-ghost btn-sm" onClick={() => onWeekChange(weekOffset - 1)}>
          <ChevronLeft size={15} /> Precedente
        </button>
        <span className="week-nav-label">
          {format(weekStart, 'd MMM', { locale: fr })} &mdash;{' '}
          {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: fr })}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={() => onWeekChange(weekOffset + 1)}>
          Suivante <ChevronRight size={15} />
        </button>
      </div>

      <div className="week-table-wrap">
        <table className="week-table">
          <thead>
            <tr>
              <th className="week-time-th"></th>
              {days.map((d, i) => (
                <th key={i} className="week-day-th">
                  {format(d, 'EEE d', { locale: fr })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map(slot => (
              <tr key={slot}>
                <td className="week-time-td">{slot}</td>
                {days.map((day, i) => {
                  const matches = getRdv(day, slot);
                  return (
                    <td key={i} className="week-cell">
                      {matches.map(rdv => (
                        <div
                          key={rdv.id}
                          className="week-rdv-block"
                          style={{ borderLeftColor: STATUT_COLORS[rdv.statut] || 'var(--primary)' }}
                          onClick={() => onRdvClick(rdv)}
                          title={`${rdv.patient_prenom} ${rdv.patient_nom} — ${rdv.service_titre}`}
                        >
                          <div className="week-rdv-patient">
                            {rdv.patient_prenom} {rdv.patient_nom?.[0]}.
                          </div>
                          <div className="week-rdv-service">{rdv.service_titre}</div>
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Agenda Section ───────────────────────────────────────────────────────────

function AgendaSection() {
  const [rdvs, setRdvs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [view, setView]               = useState('liste');
  const [weekOffset, setWeekOffset]   = useState(0);
  const [selectedPatientId, setSPId]  = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [propForm, setPropForm]       = useState({ date: '', heure: '', message: '' });
  const [actionLoading, setActLoad]   = useState(null);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  const fetchAgenda = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await praticienAPI.getAgenda();
      setRdvs(r.data.data || []);
    } catch {
      setError("Impossible de charger l'agenda.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAgenda(); }, [fetchAgenda]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 3000);
    return () => clearTimeout(t);
  }, [success]);

  const handleStatut = async (id, statut) => {
    setActLoad(`${id}-${statut}`); setError(''); setSuccess('');
    try {
      await praticienAPI.updateStatut({ reservation_id: id, statut });
      setSuccess('Statut mis a jour.');
      emitNotifUpdate();
      await fetchAgenda();
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur lors de la mise a jour.');
    } finally { setActLoad(null); }
  };

  const handleProposer = async (id) => {
    if (!propForm.date || !propForm.heure) { setError('Date et heure requises.'); return; }
    setActLoad(`${id}-prop`); setError(''); setSuccess('');
    try {
      await praticienAPI.proposerCreneau({
        reservation_id: id,
        nouvelle_date:  propForm.date,
        nouvelle_heure: propForm.heure,
        message:        propForm.message,
      });
      setSuccess('Proposition envoyee.');
      setExpandedRow(null);
      setPropForm({ date: '', heure: '', message: '' });
      emitNotifUpdate();
      await fetchAgenda();
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur lors de l\'envoi.');
    } finally { setActLoad(null); }
  };

  const toggleProp = (id) => {
    setExpandedRow(prev => prev === id ? null : id);
    setPropForm({ date: '', heure: '', message: '' });
    setError('');
  };

  const renderActions = (rdv) => (
    <div className="action-btns">
      {rdv.statut === 'en_attente' && (
        <button
          className="btn btn-sm action-confirm"
          disabled={!!actionLoading}
          onClick={() => handleStatut(rdv.id, 'confirmee')}
        >
          <CheckCircle size={13} /> Confirmer
        </button>
      )}
      {(rdv.statut === 'en_attente' || rdv.statut === 'confirmee') && (
        <button
          className="btn btn-sm action-cancel"
          disabled={!!actionLoading}
          onClick={() => handleStatut(rdv.id, 'annulee')}
        >
          <XCircle size={13} /> Refuser
        </button>
      )}
      {(rdv.statut === 'en_attente' || rdv.statut === 'confirmee') && (
        <button
          className={`btn btn-sm action-propose${expandedRow === rdv.id ? ' open' : ''}`}
          disabled={!!actionLoading}
          onClick={() => toggleProp(rdv.id)}
        >
          <CalendarDays size={13} /> Proposer un creneau
        </button>
      )}
      {actionLoading?.startsWith(String(rdv.id)) && <Loader size={14} className="spin" />}
    </div>
  );

  const renderPropForm = (rdv) => expandedRow !== rdv.id ? null : (
    <div className="proposition-form">
      <div className="proposition-form-title"><Send size={14} /> Proposer un nouveau creneau</div>
      <div className="proposition-form-fields">
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            className="input-field"
            value={propForm.date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={e => setPropForm(f => ({ ...f, date: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Heure</label>
          <input
            type="time"
            className="input-field"
            value={propForm.heure}
            onChange={e => setPropForm(f => ({ ...f, heure: e.target.value }))}
          />
        </div>
        <div className="prop-form-msg">
          <label className="label">Message (optionnel)</label>
          <textarea
            className="input-field"
            rows={2}
            placeholder="Precisions eventuelles..."
            value={propForm.message}
            onChange={e => setPropForm(f => ({ ...f, message: e.target.value }))}
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>
      <div className="prop-form-actions">
        <button
          className="btn btn-primary btn-sm"
          disabled={actionLoading === `${rdv.id}-prop`}
          onClick={() => handleProposer(rdv.id)}
        >
          <Send size={13} /> Envoyer
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setExpandedRow(null)}>
          Annuler
        </button>
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="prat-section-header">
        <h1 className="prat-page-title">Mon Agenda</h1>
      </div>

      {error   && <div className="alert alert-error"   style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      <div className="agenda-view-tabs">
        <button
          className={`agenda-view-tab${view === 'liste' ? ' active' : ''}`}
          onClick={() => setView('liste')}
        >
          <CalendarDays size={14} /> Vue Liste
        </button>
        <button
          className={`agenda-view-tab${view === 'semaine' ? ' active' : ''}`}
          onClick={() => setView('semaine')}
        >
          <Calendar size={14} /> Vue Semaine
        </button>
      </div>

      {loading ? (
        <div className="praticien-loading"><Loader size={22} className="spin" /> Chargement...</div>
      ) : view === 'liste' ? (
        rdvs.length === 0 ? (
          <div className="empty-state">
            <Calendar size={40} />
            <p>Aucun rendez-vous.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="agenda-table-wrap">
              <table className="agenda-table">
                <thead>
                  <tr>
                    <th>Date</th><th>Heure</th><th>Patient</th>
                    <th>Service</th><th>Statut</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rdvs.map(rdv => (
                    <React.Fragment key={rdv.id}>
                      <tr>
                        <td>{fmtDate(rdv.date_reservation)}</td>
                        <td><span className="time-chip">{rdv.heure_reservation?.slice(0, 5)}</span></td>
                        <td>
                          <button className="patient-btn" onClick={() => setSPId(rdv.patient_id)}>
                            <div className="patient-cell">
                              <div className="patient-avatar">
                                {rdv.patient_prenom?.[0]}{rdv.patient_nom?.[0]}
                              </div>
                              <div>
                                <div className="patient-name">{rdv.patient_prenom} {rdv.patient_nom}</div>
                                <div className="patient-email">{rdv.patient_email}</div>
                              </div>
                            </div>
                          </button>
                        </td>
                        <td>{rdv.service_titre}</td>
                        <td><StatutBadge statut={rdv.statut} /></td>
                        <td>{renderActions(rdv)}</td>
                      </tr>
                      {expandedRow === rdv.id && (
                        <tr className="proposition-row">
                          <td colSpan="6">{renderPropForm(rdv)}</td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="agenda-cards">
              {rdvs.map(rdv => (
                <div key={rdv.id} className="agenda-card">
                  <div className="agenda-card-header">
                    <div>
                      <div className="agenda-card-date">
                        {fmtDate(rdv.date_reservation)} — {rdv.heure_reservation?.slice(0, 5)}
                      </div>
                      <div className="agenda-card-service">{rdv.service_titre}</div>
                    </div>
                    <StatutBadge statut={rdv.statut} />
                  </div>
                  <button
                    className="patient-btn"
                    onClick={() => setSPId(rdv.patient_id)}
                    style={{ marginTop: 10, width: '100%', textAlign: 'left' }}
                  >
                    <div className="patient-cell">
                      <div className="patient-avatar">{rdv.patient_prenom?.[0]}{rdv.patient_nom?.[0]}</div>
                      <div>
                        <div className="patient-name">{rdv.patient_prenom} {rdv.patient_nom}</div>
                        <div className="patient-email">{rdv.patient_email}</div>
                      </div>
                    </div>
                  </button>
                  <div style={{ marginTop: 12 }}>{renderActions(rdv)}</div>
                  {renderPropForm(rdv)}
                </div>
              ))}
            </div>
          </>
        )
      ) : (
        <WeekView
          rdvs={rdvs}
          weekOffset={weekOffset}
          onWeekChange={setWeekOffset}
          onRdvClick={rdv => setSPId(rdv.patient_id)}
        />
      )}

      {selectedPatientId && (
        <PatientModal
          patientId={selectedPatientId}
          onClose={() => setSPId(null)}
        />
      )}
    </div>
  );
}

// ─── Mes Services ─────────────────────────────────────────────────────────────

function MesServicesSection({ onNavigate }) {
  const [services, setServices]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [confirmId, setConfirmId]   = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    praticienAPI.getMesServices()
      .then(r => setServices(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    setDeleting(true); setError('');
    try {
      await praticienAPI.deleteService(id);
      setServices(prev => prev.filter(s => s.id !== id));
      setConfirmId(null);
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur lors de la suppression.');
    } finally { setDeleting(false); }
  };

  return (
    <div className="container">
      <div className="prat-section-header prat-section-header-row">
        <h1 className="prat-page-title">Mes Services</h1>
        <button className="btn btn-primary btn-sm" onClick={() => onNavigate('ajouter')}>
          <Plus size={15} /> Ajouter un service
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="praticien-loading"><Loader size={22} className="spin" /> Chargement...</div>
      ) : services.length === 0 ? (
        <div className="empty-state">
          <Layers size={40} />
          <p>Vous n'avez pas encore de service publie.</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => onNavigate('ajouter')}
          >
            <Plus size={15} /> Ajouter un service
          </button>
        </div>
      ) : (
        <div className="prat-services-grid">
          {services.map(s => (
            <div key={s.id} className="prat-service-card card">
              {s.image_url ? (
                <img
                  src={s.image_url}
                  alt={s.titre}
                  className="prat-service-img"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="prat-service-img-placeholder">
                  <ImageIcon size={28} />
                </div>
              )}
              <div className="prat-service-body">
                <div
                  className="prat-service-category"
                  style={{ color: s.couleur || 'var(--primary)' }}
                >
                  {s.categorie_nom}
                </div>
                <div className="prat-service-title">{s.titre}</div>
                <div className="prat-service-meta">
                  <span>{s.prix} EUR</span>
                  <span>{s.duree} min</span>
                  {s.lieu && <span>{s.lieu}</span>}
                </div>

                {confirmId === s.id ? (
                  <div className="service-delete-confirm">
                    <span>Confirmer la suppression ?</span>
                    <div className="service-delete-actions">
                      <button
                        className="btn btn-sm action-cancel"
                        disabled={deleting}
                        onClick={() => handleDelete(s.id)}
                      >
                        {deleting ? <Loader size={13} className="spin" /> : <X size={13} />}
                        Supprimer
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={deleting}
                        onClick={() => setConfirmId(null)}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn btn-ghost btn-sm service-delete-btn"
                    onClick={() => setConfirmId(s.id)}
                  >
                    <X size={13} /> Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Ajouter Service ──────────────────────────────────────────────────────────

function AjouterServiceSection({ onSuccess }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    categorie_id:  '',
    nom_praticien: user ? `${user.prenom} ${user.nom}` : '',
    titre: '', description: '', prix: '', duree: '', lieu: '', adresse: '', image_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    servicesAPI.getCategories()
      .then(r => setCategories(r.data.data || []))
      .catch(() => {});
  }, []);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await servicesAPI.create({
        ...form,
        categorie_id: parseInt(form.categorie_id),
        prix:  parseFloat(form.prix),
        duree: parseInt(form.duree),
      });
      setSuccess('Service cree avec succes ! Redirection vers Mes Services...');
      setTimeout(onSuccess, 1400);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la creation.');
    } finally { setLoading(false); }
  };

  return (
    <div className="container">
      <div className="prat-section-header prat-section-header-compact">
        <h1 className="prat-page-title prat-page-title-sm">Ajouter un service</h1>
      </div>

      <div className="add-service-wrap">
        {success && <div className="alert alert-success" style={{ marginBottom: 10 }}>{success}</div>}
        {error   && <div className="alert alert-error"   style={{ marginBottom: 10 }}>{error}</div>}

        <form onSubmit={submit} className="add-service-form">
          <div className="form-grid">

            {/* Ligne 1 : Categorie | Nom | Titre */}
            <div>
              <label className="label">Categorie</label>
              <select
                className="select-field"
                value={form.categorie_id}
                onChange={e => upd('categorie_id', e.target.value)}
                required
              >
                <option value="">Selectionner une categorie...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Nom du praticien</label>
              <input
                className="input-field"
                value={form.nom_praticien}
                onChange={e => upd('nom_praticien', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Titre du service</label>
              <input
                className="input-field"
                placeholder="ex : Kinesitherapie du sport"
                value={form.titre}
                onChange={e => upd('titre', e.target.value)}
                required
              />
            </div>

            {/* Ligne 2 : Description (2/3) | Prix + Duree empiles (1/3) */}
            <div className="col-2">
              <label className="label">Description</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Decrivez votre service..."
                value={form.description}
                onChange={e => upd('description', e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            <div className="form-stacked">
              <div>
                <label className="label">Prix (EUR)</label>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="65.00"
                  value={form.prix}
                  onChange={e => upd('prix', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Duree (minutes)</label>
                <input
                  className="input-field"
                  type="number"
                  min="5"
                  step="5"
                  placeholder="45"
                  value={form.duree}
                  onChange={e => upd('duree', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Ligne 3 : Lieu | Adresse | URL image */}
            <div>
              <label className="label">Lieu</label>
              <input
                className="input-field"
                placeholder="Cabinet Sport Sante Paris 8"
                value={form.lieu}
                onChange={e => upd('lieu', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Adresse</label>
              <input
                className="input-field"
                placeholder="12 Rue du Faubourg Saint-Honore, 75008 Paris"
                value={form.adresse}
                onChange={e => upd('adresse', e.target.value)}
              />
            </div>

            <div>
              <label className="label">URL de l'image</label>
              <input
                className="input-field"
                type="url"
                placeholder="https://..."
                value={form.image_url}
                onChange={e => upd('image_url', e.target.value)}
              />
            </div>

            {/* Ligne 4 : Apercu (flex) + Bouton Publier */}
            <div className="form-footer">
              <div className="image-preview-area">
                <label className="label">Apercu de l'image</label>
                {form.image_url ? (
                  <div className="image-preview">
                    <img
                      src={form.image_url}
                      alt="Apercu"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <div className="image-preview-placeholder">
                    <ImageIcon size={22} />
                  </div>
                )}
              </div>
              <button className="btn btn-primary btn-publish" disabled={loading}>
                <Plus size={17} /> {loading ? 'Creation...' : 'Publier le service'}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────

export default function PraticienDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const section = searchParams.get('section') || 'agenda';
  const nav     = (s) => setSearchParams({ section: s });

  return (
    <div className="prat-page">
      {section === 'agenda'    && <AgendaSection />}
      {section === 'services'  && <MesServicesSection onNavigate={nav} />}
      {section === 'ajouter'   && <AjouterServiceSection onSuccess={() => nav('services')} />}
    </div>
  );
}
