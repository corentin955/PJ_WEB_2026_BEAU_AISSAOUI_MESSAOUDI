import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, User, Stethoscope, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_OPTS = [
  { value: 'patient',   label: 'Patient',        Icon: User        },
  { value: 'praticien', label: 'Praticien',       Icon: Stethoscope },
  { value: 'admin',     label: 'Administrateur',  Icon: ShieldCheck },
];

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [roleHint, setRoleHint] = useState('patient');
  const [form, setForm] = useState({ email: '', mot_de_passe: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form.email, form.mot_de_passe);
      if (res.success) {
        const role = res.user?.role;
        if (role !== roleHint) {
          await logout();
          setError('Ces identifiants ne correspondent pas au role selectionne.');
          return;
        }
        if (role === 'admin') navigate('/admin');
        else if (role === 'praticien') navigate('/espace-praticien');
        else navigate('/profil');
      } else {
        setError(res.error || 'Connexion impossible');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card auth-card">
        <div className="page-kicker">Espace utilisateur</div>
        <h1 className="section-title">Connexion</h1>
        <p className="page-subtitle">Accédez à vos réservations, votre panier et votre tableau de bord VitaCare.</p>

        <div className="role-toggle" style={{ marginTop: 20 }}>
          {ROLE_OPTS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              className={`role-toggle-btn${roleHint === value ? ' active' : ''}`}
              onClick={() => setRoleHint(value)}
            >
              <Icon size={15} />{label}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit} style={{ marginTop: 20 }}>
          <label className="label">Email</label>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Mail size={17} style={{ position: 'absolute', left: 13, top: 14, color: 'var(--text-muted)' }} />
            <input
              className="input-field"
              style={{ paddingLeft: 42 }}
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder={roleHint === 'admin' ? 'admin@vitacare.fr' : roleHint === 'praticien' ? 'dr.sarah@vitacare.fr' : 'marie.dupont@vitacare.fr'}
              required
            />
          </div>
          <label className="label">Mot de passe</label>
          <div style={{ position: 'relative', marginBottom: 22 }}>
            <Lock size={17} style={{ position: 'absolute', left: 13, top: 14, color: 'var(--text-muted)' }} />
            <input
              className="input-field"
              style={{ paddingLeft: 42 }}
              type="password"
              value={form.mot_de_passe}
              onChange={e => setForm({ ...form, mot_de_passe: e.target.value })}
              placeholder="mot de passe"
              required
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            <LogIn size={18} />{loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="muted" style={{ marginTop: 18, textAlign: 'center' }}>
          Pas encore de compte ?{' '}
          <Link to="/inscription" style={{ color: 'var(--primary)' }}>Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
