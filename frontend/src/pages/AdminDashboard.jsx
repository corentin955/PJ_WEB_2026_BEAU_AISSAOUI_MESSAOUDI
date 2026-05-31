import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../utils/api';
import { Users, Stethoscope, LayoutDashboard, Trash2, CheckCircle, XCircle, Loader } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/AdminDashboard.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR'); }
  catch { return d; }
}

function fmtPrix(n) {
  return Number(n).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

// ── Tableau de bord ───────────────────────────────────────────────────────────

function SectionStats() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    adminAPI.getStats()
      .then(r => setData(r.data.data))
      .catch(() => setError('Impossible de charger les statistiques.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loader"><Loader size={22} className="spin" /></div>;
  if (error)   return <div className="admin-error">{error}</div>;

  const cards = [
    { label: 'Utilisateurs',   value: data.total_utilisateurs, icon: Users },
    { label: 'Reservations',   value: data.total_reservations, icon: LayoutDashboard },
    { label: 'Services actifs',value: data.total_services,     icon: Stethoscope },
    { label: "Chiffre d'affaires", value: fmtPrix(data.chiffre_affaires), icon: CheckCircle },
  ];

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Tableau de bord</h2>
      <div className="admin-stats-grid">
        {cards.map(({ label, value, icon: Icon }) => (
          <div className="admin-stat-card" key={label}>
            <div className="admin-stat-icon"><Icon size={20} /></div>
            <div className="admin-stat-value">{value}</div>
            <div className="admin-stat-label">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Utilisateurs ──────────────────────────────────────────────────────────────

function SectionUtilisateurs() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [busy, setBusy]         = useState(null);
  const [modal, setModal]       = useState(null);

  const load = useCallback((role = roleFilter) => {
    setLoading(true);
    adminAPI.getUtilisateurs(role)
      .then(r => setUsers(r.data.data || []))
      .catch(() => setError('Impossible de charger les utilisateurs.'))
      .finally(() => setLoading(false));
  }, [roleFilter]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleFilter = (role) => {
    setRoleFilter(role);
    load(role);
  };

  const doUserAction = async (userId, action) => {
    setModal(null);
    setBusy(userId + action);
    try {
      await adminAPI.updateUser({ user_id: userId, action });
      if (action === 'supprimer') {
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, actif: action === 'activer' ? 1 : 0 } : u
        ));
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Une erreur est survenue.');
    } finally {
      setBusy(null);
    }
  };

  const handleAction = (userId, action) => {
    if (action !== 'supprimer') {
      doUserAction(userId, action);
      return;
    }

    setModal({
      title: 'Supprimer un utilisateur',
      message: 'Etes-vous sur de vouloir supprimer cet utilisateur ?',
      confirmLabel: 'Oui, continuer',
      cancelLabel: 'Annuler',
      onConfirm: () => setModal({
        title: 'Confirmation definitive',
        message: 'Supprimer definitivement cet utilisateur de la base de donnees, ou le desactiver uniquement ?',
        confirmLabel: 'Supprimer definitivement',
        cancelLabel: 'Desactiver uniquement',
        onConfirm: () => doUserAction(userId, 'supprimer'),
        onCancel:  () => doUserAction(userId, 'suspendre'),
      }),
      onCancel: () => setModal(null),
    });
  };

  return (
    <div className="admin-section">
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
      <div className="admin-section-header">
        <h2 className="admin-section-title">Utilisateurs</h2>
        <div className="admin-filter-tabs">
          {['', 'patient', 'praticien'].map(r => (
            <button
              key={r || 'tous'}
              className={`admin-filter-tab ${roleFilter === r ? 'active' : ''}`}
              onClick={() => handleFilter(r)}
            >
              {r === '' ? 'Tous' : r === 'patient' ? 'Patients' : 'Praticiens'}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="admin-loader"><Loader size={22} className="spin" /></div>}
      {error   && <div className="admin-error">{error}</div>}

      {!loading && !error && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Role</th>
                <th>Inscription</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={6} className="admin-empty">Aucun utilisateur.</td></tr>
              )}
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.prenom} {u.nom}</td>
                  <td className="admin-cell-muted">{u.email}</td>
                  <td>
                    <span className={`admin-badge ${u.role}`}>{u.role}</span>
                  </td>
                  <td className="admin-cell-muted">{fmtDate(u.date_inscription)}</td>
                  <td>
                    <span className={`admin-badge ${u.actif == 1 ? 'actif' : 'suspendu'}`}>
                      {u.actif == 1 ? 'Actif' : 'Suspendu'}
                    </span>
                  </td>
                  <td className="admin-actions">
                    {u.actif == 1 ? (
                      <button
                        className="admin-btn admin-btn-warn"
                        onClick={() => handleAction(u.id, 'suspendre')}
                        disabled={busy === u.id + 'suspendre'}
                      >
                        <XCircle size={14} /> Suspendre
                      </button>
                    ) : (
                      <button
                        className="admin-btn admin-btn-success"
                        onClick={() => handleAction(u.id, 'activer')}
                        disabled={busy === u.id + 'activer'}
                      >
                        <CheckCircle size={14} /> Activer
                      </button>
                    )}
                    <button
                      className="admin-btn admin-btn-danger"
                      onClick={() => handleAction(u.id, 'supprimer')}
                      disabled={busy === u.id + 'supprimer'}
                    >
                      <Trash2 size={14} /> Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Services ──────────────────────────────────────────────────────────────────

function SectionServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(null);
  const [modal, setModal]       = useState(null);

  const load = () => {
    setLoading(true);
    adminAPI.getServices()
      .then(r => setServices(r.data.data || []))
      .catch(() => setError('Impossible de charger les services.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const doServiceAction = async (serviceId, action) => {
    setModal(null);
    setBusy(serviceId + action);
    try {
      await adminAPI.updateService({ service_id: serviceId, action });
      if (action === 'supprimer') {
        setServices(prev => prev.filter(s => s.id !== serviceId));
      } else {
        setServices(prev => prev.map(s =>
          s.id === serviceId ? { ...s, actif: action === 'activer' ? 1 : 0 } : s
        ));
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Une erreur est survenue.');
    } finally {
      setBusy(null);
    }
  };

  const handleAction = (serviceId, action) => {
    if (action !== 'supprimer') {
      doServiceAction(serviceId, action);
      return;
    }
    setModal({
      title: 'Supprimer un service',
      message: 'Supprimer definitivement ce service ? Cette action est irreversible.',
      confirmLabel: 'Supprimer definitivement',
      cancelLabel: 'Annuler',
      onConfirm: () => doServiceAction(serviceId, 'supprimer'),
      onCancel:  () => setModal(null),
    });
  };

  return (
    <div className="admin-section">
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
      <h2 className="admin-section-title">Services</h2>

      {loading && <div className="admin-loader"><Loader size={22} className="spin" /></div>}
      {error   && <div className="admin-error">{error}</div>}

      {!loading && !error && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Praticien</th>
                <th>Categorie</th>
                <th>Prix</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 && (
                <tr><td colSpan={6} className="admin-empty">Aucun service.</td></tr>
              )}
              {services.map(s => (
                <tr key={s.id}>
                  <td>{s.titre}</td>
                  <td className="admin-cell-muted">{s.prenom} {s.nom}</td>
                  <td className="admin-cell-muted">{s.categorie}</td>
                  <td>{fmtPrix(s.prix)}</td>
                  <td>
                    <span className={`admin-badge ${s.actif == 1 ? 'actif' : 'suspendu'}`}>
                      {s.actif == 1 ? 'Actif' : 'Suspendu'}
                    </span>
                  </td>
                  <td className="admin-actions">
                    {s.actif == 1 ? (
                      <button
                        className="admin-btn admin-btn-warn"
                        onClick={() => handleAction(s.id, 'suspendre')}
                        disabled={busy === s.id + 'suspendre'}
                      >
                        <XCircle size={14} /> Suspendre
                      </button>
                    ) : (
                      <button
                        className="admin-btn admin-btn-success"
                        onClick={() => handleAction(s.id, 'activer')}
                        disabled={busy === s.id + 'activer'}
                      >
                        <CheckCircle size={14} /> Activer
                      </button>
                    )}
                    <button
                      className="admin-btn admin-btn-danger"
                      onClick={() => handleAction(s.id, 'supprimer')}
                      disabled={busy === s.id + 'supprimer'}
                    >
                      <Trash2 size={14} /> Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section') || 'stats';

  return (
    <div className="admin-page">
      {section === 'stats'        && <SectionStats />}
      {section === 'utilisateurs' && <SectionUtilisateurs />}
      {section === 'services'     && <SectionServices />}
    </div>
  );
}
