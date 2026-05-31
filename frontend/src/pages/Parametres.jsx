import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Bell, Trash2, Eye, EyeOff, Check } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import '../styles/Parametres.css';

export default function Parametres() {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  /* ── Password state ── */
  const [pwForm, setPwForm]    = useState({ ancien: '', nouveau: '', confirm: '' });
  const [showPw, setShowPw]    = useState({ ancien: false, nouveau: false, confirm: false });
  const [pwLoading, setPwLoad] = useState(false);
  const [pwMsg, setPwMsg]      = useState(null);

  /* ── Notification toggles ── */
  const [notifRappel, setNotifRappel] = useState(
    () => localStorage.getItem('notif_rappel') !== 'false'
  );
  const [notifEmail, setNotifEmail] = useState(
    () => localStorage.getItem('notif_email') !== 'false'
  );

  /* ── Delete account state ── */
  const [showModal, setShowModal]   = useState(false);
  const [delLoading, setDelLoading] = useState(false);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.nouveau !== pwForm.confirm) {
      setPwMsg({ text: 'Les mots de passe ne correspondent pas', type: 'error' });
      return;
    }
    setPwLoad(true);
    setPwMsg(null);
    try {
      await api.post('/auth.php?action=change_password', {
        ancien_mot_de_passe:  pwForm.ancien,
        nouveau_mot_de_passe: pwForm.nouveau,
        confirmation:         pwForm.confirm,
      });
      setPwMsg({ text: 'Mot de passe modifié avec succès', type: 'success' });
      setPwForm({ ancien: '', nouveau: '', confirm: '' });
    } catch (err) {
      setPwMsg({ text: err.response?.data?.error || 'Erreur lors du changement', type: 'error' });
    } finally {
      setPwLoad(false);
    }
  };

  const toggleRappel = (val) => { setNotifRappel(val); localStorage.setItem('notif_rappel', String(val)); };
  const toggleEmail  = (val) => { setNotifEmail(val);  localStorage.setItem('notif_email',  String(val)); };

  const handleDeleteAccount = async () => {
    setDelLoading(true);
    try {
      await api.post('/auth.php?action=delete_account');
      await logout();
      navigate('/');
    } catch (err) {
      setShowModal(false);
      showToast(err.response?.data?.error || 'Erreur lors de la suppression', 'error');
    } finally {
      setDelLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: 64 }}>

      <div className="page-hero">
        <div className="page-kicker">Mon compte</div>
        <h1 className="section-title">Para<span className="gradient-text">mètres</span></h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Sécurité ── */}
        <div style={CARD}>
          <div className="params-section-row">
            <div className="params-left-zone">
              <Shield size={20} color="var(--primary)" />
              <div style={SECTION_TITLE}>Sécurité</div>
              <div style={SECTION_SUB}>Modifier votre mot de passe</div>
            </div>
            <div className="params-right-zone">
              <form onSubmit={handlePasswordChange} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <PwField
                    label="Mot de passe actuel"
                    value={pwForm.ancien}
                    show={showPw.ancien}
                    onChange={v => setPwForm(f => ({ ...f, ancien: v }))}
                    onToggle={() => setShowPw(s => ({ ...s, ancien: !s.ancien }))}
                  />
                  <PwField
                    label="Nouveau mot de passe"
                    value={pwForm.nouveau}
                    show={showPw.nouveau}
                    onChange={v => setPwForm(f => ({ ...f, nouveau: v }))}
                    onToggle={() => setShowPw(s => ({ ...s, nouveau: !s.nouveau }))}
                  />
                  <PwField
                    label="Confirmer"
                    value={pwForm.confirm}
                    show={showPw.confirm}
                    onChange={v => setPwForm(f => ({ ...f, confirm: v }))}
                    onToggle={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={pwLoading}
                    style={{ height: 44, whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    <Check size={14} /> {pwLoading ? '…' : 'Modifier'}
                  </button>
                </div>
                {pwMsg && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 6, fontSize: '0.82rem',
                    background: pwMsg.type === 'error' ? '#2d1515' : '#1a2e20',
                    borderLeft: `4px solid ${pwMsg.type === 'error' ? '#ef4444' : '#A8E063'}`,
                    color: '#FAFAF7',
                  }}>
                    {pwMsg.text}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* ── Notifications ── */}
        <div style={CARD}>
          <div className="params-section-row">
            <div className="params-left-zone">
              <Bell size={20} color="var(--primary)" />
              <div style={SECTION_TITLE}>Notifications</div>
              <div style={SECTION_SUB}>Gérer vos alertes</div>
            </div>
            <div className="params-right-zone">
              <div className="params-notif-grid">
                <ToggleRow
                  label="Rappels de RDV"
                  desc="Recevoir une alerte avant chaque rendez-vous"
                  value={notifRappel}
                  onChange={toggleRappel}
                />
                <ToggleRow
                  label="Notifications email"
                  desc="Recevoir les alertes importantes sur votre email"
                  value={notifEmail}
                  onChange={toggleEmail}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Compte — danger zone ── */}
        <div style={{ ...CARD, border: '1px solid #7f1d1d', background: 'rgba(127,29,29,0.06)' }}>
          <div className="params-section-row">
            <div className="params-left-zone" style={{ borderRightColor: 'rgba(127,29,29,0.4)' }}>
              <Trash2 size={20} color="#fca5a5" />
              <div style={{ ...SECTION_TITLE, color: '#fca5a5' }}>Compte</div>
              <div style={SECTION_SUB}>La suppression est irréversible</div>
            </div>
            <div className="params-right-zone" style={{ justifyContent: 'flex-end' }}>
              <button
                className="btn btn-sm"
                style={{ background: '#991b1b', color: '#fff', border: 'none' }}
                onMouseOver={e => { e.currentTarget.style.background = '#7f1d1d'; }}
                onMouseOut={e  => { e.currentTarget.style.background = '#991b1b'; }}
                onClick={() => setShowModal(true)}
              >
                <Trash2 size={14} /> Supprimer mon compte
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── Delete confirmation modal ── */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => !delLoading && setShowModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card)', border: '1px solid #7f1d1d',
              borderRadius: 16, padding: '32px 28px',
              maxWidth: 420, width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fca5a5', marginBottom: 12 }}>
              Êtes-vous sûr ?
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.65, marginBottom: 28 }}>
              Cette action est irréversible. Votre compte, vos réservations et toutes vos données seront supprimés définitivement.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setShowModal(false)}
                disabled={delLoading}
              >
                Annuler
              </button>
              <button
                className="btn btn-sm"
                style={{ flex: 1, justifyContent: 'center', background: '#ef4444', color: '#fff', border: 'none' }}
                onClick={handleDeleteAccount}
                disabled={delLoading}
              >
                {delLoading ? 'Suppression…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}

/* ── Sub-components ── */

function PwField({ label, value, show, onChange, onToggle }) {
  return (
    <div style={{ flex: 1, minWidth: 160 }}>
      <label style={LABEL_STYLE}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="input-field"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ height: 44, paddingRight: 44 }}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={onToggle}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', padding: 0,
          }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 46, height: 26, borderRadius: 13, flexShrink: 0, border: 'none',
          background: value ? 'var(--primary)' : 'var(--border)', cursor: 'pointer',
          position: 'relative', transition: 'background 0.22s',
          boxShadow: value ? '0 0 12px rgba(168,224,99,0.3)' : 'none',
        }}
        aria-label={label}
      >
        <div style={{
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 3, left: value ? 23 : 3,
          transition: 'left 0.22s', boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
        }} />
      </button>
    </div>
  );
}

/* ── Shared tokens ── */

const CARD = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 24,
};

const SECTION_TITLE = {
  fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'var(--primary)', marginTop: 8,
};

const SECTION_SUB = {
  fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5,
};

const LABEL_STYLE = {
  display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)',
  marginBottom: 6, fontWeight: 500,
};
