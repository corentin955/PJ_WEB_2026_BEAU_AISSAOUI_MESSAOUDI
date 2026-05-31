import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_OPTS = [
  { value: 'patient',   label: 'Patient',    Icon: User },
  { value: 'praticien', label: 'Praticien',  Icon: Stethoscope },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', mot_de_passe: '', role: 'patient' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm({ ...form, [key]: value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await register(form);
      if (res.success) {
        navigate(form.role === 'praticien' ? '/espace-praticien' : '/tableau-de-bord');
      } else {
        setError(res.error || 'Inscription impossible');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Inscription impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card auth-card" style={{ maxWidth: 640 }}>
        <div className="page-kicker">Nouveau compte</div>
        <h1 className="section-title">Inscription</h1>
        <p className="page-subtitle">Créez un compte patient ou praticien pour utiliser la plateforme.</p>

        <div className="role-toggle">
          {ROLE_OPTS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              className={`role-toggle-btn${form.role === value ? ' active' : ''}`}
              onClick={() => update('role', value)}
            >
              <Icon size={15} />{label}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit} style={{ marginTop: 20 }}>
          <div className="form-grid">
            <div>
              <label className="label">Prénom</label>
              <input className="input-field" value={form.prenom} onChange={e => update('prenom', e.target.value)} required />
            </div>
            <div>
              <label className="label">Nom</label>
              <input className="input-field" value={form.nom} onChange={e => update('nom', e.target.value)} required />
            </div>
            <div className="full">
              <label className="label">Email</label>
              <input className="input-field" type="email" value={form.email} onChange={e => update('email', e.target.value)} required />
            </div>
            <div className="full">
              <label className="label">Téléphone</label>
              <input className="input-field" value={form.telephone} onChange={e => update('telephone', e.target.value)} />
            </div>
            <div className="full">
              <label className="label">Mot de passe</label>
              <input className="input-field" type="password" minLength="6" value={form.mot_de_passe} onChange={e => update('mot_de_passe', e.target.value)} required />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 22 }} disabled={loading}>
            <UserPlus size={18} />{loading ? 'Création...' : `Créer mon compte ${form.role === 'praticien' ? 'praticien' : 'patient'}`}
          </button>
        </form>

        <p className="muted" style={{ marginTop: 18, textAlign: 'center' }}>
          Déjà inscrit ?{' '}
          <Link to="/connexion" style={{ color: 'var(--primary)' }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
