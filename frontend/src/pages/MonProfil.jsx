import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Edit2, Check, X, Save, ChevronDown } from 'lucide-react';
import { api, authAPI, reservationsAPI, praticienAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import '../styles/MonProfil.css';

// ─── Patient constants ────────────────────────────────────────────────────────

const SPORT_KEY     = 'vitacare_sport_profile';
const NIVEAUX       = ['Débutant', 'Intermédiaire', 'Confirmé', 'Expert'];
const FREQUENCES    = ['1x/semaine', '2-3x/semaine', '4-5x/semaine', 'Tous les jours'];
const OBJECTIFS     = ['Récupération', 'Performance', 'Prévention blessures', 'Bien-être général', 'Rééducation'];
const DISPOS_PATIENT = ['Matin', 'Après-midi', 'Soir', 'Week-end'];

const DEFAULT_SPORT = {
  taille: '', poids: '', age: '', sports: '',
  niveau: '', frequence: '', objectif: '',
  description: '', antecedents: '', blessures: '',
  dispos: [],
};

// ─── Praticien constants ──────────────────────────────────────────────────────

const JOURS_SEMAINE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const CRENEAUX      = ['Matin', 'Apres-midi', 'Soir'];

const DEFAULT_PRAT = {
  specialite: '', annees_experience: '', diplome: '', etablissement: '',
  numero_rpps: '', tarif_moyen: '', langues: '', site_web: '',
  bio: '', adresse_cabinet: '', ville: '',
  disponibilites: { jours: [], creneaux: [] },
};

// ─── Component principal ──────────────────────────────────────────────────────

export default function MonProfil() {
  const { user: ctxUser } = useAuth();
  const [profile, setProfile]     = useState(null);
  const [reservations, setRdvs]   = useState([]);
  const [nbServices, setNbServices] = useState(0);
  const [editing, setEditing]     = useState(false);
  const [form, setForm]           = useState({ prenom: '', nom: '', email: '' });
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);

  const [sportForm, setSportForm] = useState(() => {
    try {
      const s = localStorage.getItem(SPORT_KEY);
      return s ? { ...DEFAULT_SPORT, ...JSON.parse(s) } : DEFAULT_SPORT;
    } catch { return DEFAULT_SPORT; }
  });
  const [sportSaving, setSportSaving] = useState(false);

  const [pratForm, setPratForm]   = useState(DEFAULT_PRAT);
  const [pratSaving, setPratSaving] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    authAPI.me()
      .then(r => {
        const u = r.data.user;
        setProfile(u);
        setForm({ prenom: u.prenom, nom: u.nom, email: u.email });
        if (u.role === 'praticien') {
          let dispos = { jours: [], creneaux: [] };
          if (u.disponibilites) {
            try { dispos = JSON.parse(u.disponibilites); } catch {}
          }
          setPratForm({
            specialite:        u.specialite        || '',
            annees_experience: u.annees_experience || '',
            diplome:           u.diplome           || '',
            etablissement:     u.etablissement     || '',
            numero_rpps:       u.numero_rpps       || '',
            tarif_moyen:       u.tarif_moyen       || '',
            langues:           u.langues           || '',
            site_web:          u.site_web          || '',
            bio:               u.bio               || '',
            adresse_cabinet:   u.adresse_cabinet   || '',
            ville:             u.ville             || '',
            disponibilites:    dispos,
          });
        } else {
          // Pour les patients : seeder taille/poids/antécédents depuis la DB
          // si le localStorage ne les a pas encore
          setSportForm(prev => ({
            ...prev,
            taille:     prev.taille     || String(u.taille  || ''),
            poids:      prev.poids      || String(u.poids   || ''),
            antecedents: prev.antecedents || (u.historique_sportif || ''),
          }));
        }
      })
      .catch(() => {
        if (ctxUser) {
          setProfile(ctxUser);
          setForm({ prenom: ctxUser.prenom, nom: ctxUser.nom, email: ctxUser.email });
        }
      });

    reservationsAPI.getAll()
      .then(r => setRdvs(r.data.data || []))
      .catch(() => {});
  }, []); // eslint-disable-line

  useEffect(() => {
    if (profile?.role === 'praticien') {
      praticienAPI.getMesServices()
        .then(r => setNbServices((r.data.data || []).length))
        .catch(() => {});
    }
  }, [profile?.role]);

  const intervenants = useMemo(() => {
    const map = {};
    reservations.forEach(r => {
      const key = r.nom_praticien || 'Inconnu';
      if (!map[key]) map[key] = {
        name: key, specialite: r.service_specialite || '', count: 0,
        initials: key.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      };
      map[key].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [reservations]);

  const handleSave = async () => {
    if (!form.prenom.trim() || !form.nom.trim() || !form.email.trim()) {
      showToast('Tous les champs sont requis', 'error'); return;
    }
    setSaving(true);
    try {
      await api.post('/auth.php?action=update_profile', form);
      setProfile(p => ({ ...p, ...form }));
      const stored = localStorage.getItem('vitacare_user');
      if (stored) localStorage.setItem('vitacare_user', JSON.stringify({ ...JSON.parse(stored), ...form }));
      setEditing(false);
      showToast('Profil mis à jour avec succès');
    } catch (e) {
      showToast(e.response?.data?.error || 'Erreur lors de la mise à jour', 'error');
    } finally { setSaving(false); }
  };

  const handleSportSave = () => {
    setSportSaving(true);
    setTimeout(() => {
      localStorage.setItem(SPORT_KEY, JSON.stringify(sportForm));
      setSportSaving(false);
      showToast('Profil sauvegardé');
    }, 500);
  };

  const handlePratSave = async () => {
    setPratSaving(true);
    try {
      await api.post('/auth.php?action=update_profile', { ...form, ...pratForm });
      setProfile(p => ({ ...p, ...form, ...pratForm }));
      showToast('Profil mis à jour');
    } catch (e) {
      showToast(e.response?.data?.error || 'Erreur lors de la sauvegarde', 'error');
    } finally { setPratSaving(false); }
  };

  const cancelEdit = () => {
    if (profile) setForm({ prenom: profile.prenom, nom: profile.nom, email: profile.email });
    setEditing(false);
  };

  const setSport = (k, v) => setSportForm(f => ({ ...f, [k]: v }));
  const toggleDispoPatient = (d) => setSportForm(f => ({
    ...f, dispos: f.dispos.includes(d) ? f.dispos.filter(x => x !== d) : [...f.dispos, d],
  }));

  const upd = (k, v) => setPratForm(f => ({ ...f, [k]: v }));
  const toggleJour = (j) => setPratForm(f => ({
    ...f,
    disponibilites: {
      ...f.disponibilites,
      jours: f.disponibilites.jours.includes(j)
        ? f.disponibilites.jours.filter(x => x !== j)
        : [...f.disponibilites.jours, j],
    },
  }));
  const toggleCreneau = (c) => setPratForm(f => ({
    ...f,
    disponibilites: {
      ...f.disponibilites,
      creneaux: f.disponibilites.creneaux.includes(c)
        ? f.disponibilites.creneaux.filter(x => x !== c)
        : [...f.disponibilites.creneaux, c],
    },
  }));

  const user = profile || ctxUser;
  if (!user) return <div className="loading-screen"><div className="spinner" /></div>;

  const memberSince = user.date_inscription
    ? new Date(user.date_inscription).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
    : null;

  const isPraticien = user.role === 'praticien';

  const pratChips = [
    { label: 'Specialite',  value: pratForm.specialite || '—' },
    { label: 'Experience',  value: pratForm.annees_experience ? `${pratForm.annees_experience} ans` : '—' },
    { label: 'Services',    value: nbServices },
  ];

  const patientChips = [
    { label: 'Taille', value: sportForm.taille ? `${sportForm.taille} cm` : '— cm' },
    { label: 'Poids',  value: sportForm.poids  ? `${sportForm.poids} kg`  : '— kg' },
    { label: 'Age',    value: sportForm.age    ? `${sportForm.age} ans`   : '—'    },
    { label: 'Niveau', value: sportForm.niveau || '—' },
  ];

  // ── Section 1 : Identité (shared, chips différent selon rôle) ──
  const identitySection = (
    <div style={CARD}>
      <SectionLabel>Identite</SectionLabel>
      <div className="profil-identity-row">

        <div className="profil-identity-left">
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #A8E063, #7BC441)',
            color: '#0D2B1E', fontWeight: 800, fontSize: '1.6rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 4px rgba(168,224,99,0.18)', flexShrink: 0,
          }}>
            {user.prenom?.[0]}{user.nom?.[0]}
          </div>

          {!editing ? (
            <>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>
                {user.prenom} {user.nom}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{user.email}</div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', padding: '3px 12px',
                borderRadius: 50, background: 'rgba(168,224,99,0.12)',
                border: '1px solid rgba(168,224,99,0.28)',
                color: 'var(--primary)', fontSize: '0.68rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                {isPraticien ? 'Praticien' : (user.role || 'Sportif')}
              </div>
              {memberSince && (
                <div style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>Membre depuis {memberSince}</div>
              )}
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={() => setEditing(true)}>
                <Edit2 size={13} /> Modifier
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              <FormField label="Prénom" value={form.prenom} onChange={v => setForm(f => ({ ...f, prenom: v }))} />
              <FormField label="Nom" value={form.nom} onChange={v => setForm(f => ({ ...f, nom: v }))} />
              <FormField label="Email" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
                  <Check size={13} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={cancelEdit}><X size={13} /></button>
              </div>
            </div>
          )}
        </div>

        <div className="profil-identity-right">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {(isPraticien ? pratChips : patientChips).map(({ label, value }) => (
              <div key={label} style={{
                background: 'var(--bg-main)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '14px 18px', minWidth: 100,
              }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1, marginBottom: 5 }}>
                  {value}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ paddingBottom: 64 }}>

      <div className="page-hero">
        <div className="page-kicker">Mon compte</div>
        <h1 className="section-title">Mon <span className="gradient-text">Profil</span></h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {identitySection}

        {isPraticien ? (
          <>
            {/* ── Section 2 : Informations professionnelles ── */}
            <div style={CARD}>
              <SectionLabel>Informations professionnelles</SectionLabel>
              <div className="profil-sport-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <FormField label="Specialite" value={pratForm.specialite} onChange={v => upd('specialite', v)} placeholder="ex : Kinesitherapie du sport" />
                  <FormField label="Diplome principal" value={pratForm.diplome} onChange={v => upd('diplome', v)} placeholder="ex : Master STAPS" />
                  <FormField label="Etablissement / Cabinet" value={pratForm.etablissement} onChange={v => upd('etablissement', v)} />
                  <FormField label="Annees d'experience" type="number" value={String(pratForm.annees_experience)} onChange={v => upd('annees_experience', v)} placeholder="ex : 8" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <FormField label="Numero RPPS ou Adeli" value={pratForm.numero_rpps} onChange={v => upd('numero_rpps', v)} placeholder="Identifiant professionnel" />
                  <FormField label="Tarif moyen a la seance (EUR)" type="number" value={String(pratForm.tarif_moyen)} onChange={v => upd('tarif_moyen', v)} placeholder="ex : 65" />
                  <FormField label="Langues parlees" value={pratForm.langues} onChange={v => upd('langues', v)} placeholder="ex : Francais, Anglais" />
                  <FormField label="Site web ou LinkedIn" value={pratForm.site_web} onChange={v => upd('site_web', v)} placeholder="https://..." />
                </div>
              </div>
            </div>

            {/* ── Section 3 : Présentation ── */}
            <div style={CARD}>
              <SectionLabel>Presentation</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <TextareaField
                  label="Bio / Presentation"
                  value={pratForm.bio}
                  onChange={v => upd('bio', v)}
                  rows={4}
                  placeholder="Specialiste en reeducation sportive..."
                />
                <div className="profil-sport-grid">
                  <FormField label="Adresse du cabinet" value={pratForm.adresse_cabinet} onChange={v => upd('adresse_cabinet', v)} />
                  <FormField label="Ville" value={pratForm.ville} onChange={v => upd('ville', v)} />
                </div>
              </div>
            </div>

            {/* ── Section 4 : Disponibilités ── */}
            <div style={CARD}>
              <SectionLabel>Disponibilites</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={LABEL_STYLE}>Jours</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {JOURS_SEMAINE.map(j => (
                      <ToggleBtn key={j} label={j} active={pratForm.disponibilites.jours.includes(j)} onClick={() => toggleJour(j)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Creneaux</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {CRENEAUX.map(c => (
                      <ToggleBtn key={c} label={c} active={pratForm.disponibilites.creneaux.includes(c)} onClick={() => toggleCreneau(c)} />
                    ))}
                  </div>
                </div>
              </div>

              <SaveBtn onClick={handlePratSave} loading={pratSaving} label="Sauvegarder mon profil" />
            </div>
          </>
        ) : (
          <>
            {/* ── Section 2 : Profil sportif (patient) ── */}
            <div style={CARD}>
              <SectionLabel>Mon profil sportif</SectionLabel>
              <div className="profil-sport-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <FormField label="Taille (cm)" type="number" value={sportForm.taille} onChange={v => setSport('taille', v)} />
                  <FormField label="Poids (kg)"  type="number" value={sportForm.poids}  onChange={v => setSport('poids', v)} />
                  <FormField label="Âge"         type="number" value={sportForm.age}    onChange={v => setSport('age', v)} />
                  <FormField label="Sport(s) pratiqué(s)" value={sportForm.sports} onChange={v => setSport('sports', v)} placeholder="Ex : Football, Natation…" />
                  <CustomSelect label="Niveau sportif" value={sportForm.niveau} onChange={v => setSport('niveau', v)} options={NIVEAUX} />
                  <CustomSelect label="Fréquence d'entraînement" value={sportForm.frequence} onChange={v => setSport('frequence', v)} options={FREQUENCES} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <CustomSelect label="Objectif principal" value={sportForm.objectif} onChange={v => setSport('objectif', v)} options={OBJECTIFS} />
                  <TextareaField label="Ce que je cherche sur VitaCare" value={sportForm.description} onChange={v => setSport('description', v)} rows={4} placeholder="Décrivez vos besoins, vos attentes…" />
                  <TextareaField label="Antécédents médicaux / sportifs" value={sportForm.antecedents} onChange={v => setSport('antecedents', v)} rows={3} />
                  <TextareaField label="Blessures passées" value={sportForm.blessures} onChange={v => setSport('blessures', v)} rows={3} />
                  <div>
                    <label style={LABEL_STYLE}>Disponibilités</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {DISPOS_PATIENT.map(d => (
                        <ToggleBtn key={d} label={d} active={sportForm.dispos.includes(d)} onClick={() => toggleDispoPatient(d)} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <SaveBtn onClick={handleSportSave} loading={sportSaving} label="Sauvegarder mon profil" />
            </div>

            {/* ── Section 3 : Intervenants consultés (patient) ── */}
            {intervenants.length > 0 && (
              <div style={CARD}>
                <SectionLabel>Mes intervenants consultés</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {intervenants.map(iv => (
                    <div key={iv.name} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'var(--bg-main)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '10px 14px',
                    }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(168,224,99,0.12)', border: '1px solid rgba(168,224,99,0.25)',
                        color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {iv.initials}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>{iv.name}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                          {iv.specialite ? `${iv.specialite} · ` : ''}{iv.count} RDV
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Toast toast={toast} />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: 'var(--primary)',
      marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border)',
    }}>
      {children}
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      <input
        className="input-field"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ height: 44 }}
      />
    </div>
  );
}

function TextareaField({ label, value, onChange, rows = 3, placeholder }) {
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      <textarea
        className="input-field"
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        style={{ resize: 'vertical', height: 'auto', paddingTop: 10, paddingBottom: 10 }}
      />
    </div>
  );
}

function ToggleBtn({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '7px 14px', borderRadius: 6,
        fontSize: '0.82rem', fontWeight: 600,
        border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
        background: active ? 'rgba(168,224,99,0.12)' : 'var(--input-bg)',
        color: active ? 'var(--primary)' : 'var(--text-muted)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

function SaveBtn({ onClick, loading, label }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        marginTop: 24, width: '100%', padding: '13px',
        background: 'var(--primary)', color: 'var(--on-primary)',
        border: 'none', borderRadius: 8,
        fontSize: '0.95rem', fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'opacity 0.2s',
      }}
    >
      <Save size={16} /> {loading ? 'Sauvegarde…' : label}
    </button>
  );
}

function CustomSelect({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref}>
      <label style={LABEL_STYLE}>{label}</label>
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            width: '100%', height: 44, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 8,
            background: 'var(--input-bg)',
            border: `1px solid ${open ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: 8, padding: '0 12px',
            color: value ? 'var(--text)' : 'var(--text-muted)',
            fontSize: '0.95rem', cursor: 'pointer', transition: 'border-color 0.15s',
          }}
        >
          <span>{value || '— Sélectionner —'}</span>
          <ChevronDown
            size={14}
            color="var(--primary)"
            style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          />
        </button>

        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 8, zIndex: 50, overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}>
            {options.map(o => (
              <button
                key={o}
                type="button"
                onClick={() => { onChange(o); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 8,
                  padding: '10px 14px', background: 'none', border: 'none',
                  color: o === value ? 'var(--primary)' : 'var(--text)',
                  fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left',
                  borderBottom: '1px solid var(--border)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
              >
                <span>{o}</span>
                {o === value && <Check size={13} color="var(--primary)" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const LABEL_STYLE = {
  display: 'block', fontSize: '0.875rem', color: 'var(--text)',
  marginBottom: 6, fontWeight: 500,
};

const CARD = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 24,
};
