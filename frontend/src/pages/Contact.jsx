import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { miscAPI } from '../utils/api';

export default function Contact() {
  const [form, setForm] = useState({ nom: '', email: '', sujet: '', message: '' });
  const [status, setStatus] = useState(null);
  const update = (k, v) => setForm({ ...form, [k]: v });

  const submit = async (e) => {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await miscAPI.sendContact(form);
      setStatus({ type: 'success', text: res.data.message || 'Message envoyé.' });
      setForm({ nom: '', email: '', sujet: '', message: '' });
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.error || 'Erreur lors de l’envoi.' });
    }
  };

  return (
    <div className="container">
      <div className="page-hero">
        <div className="page-kicker">Besoin d’aide ?</div>
        <h1 className="section-title">Contact</h1>
        <p className="page-subtitle">Notre équipe répond aux questions sur les réservations, les services et l’utilisation de VitaCare.</p>
      </div>
      <div className="grid-2">
        <div className="card">
          <h2>Écrire à VitaCare</h2>
          {status && <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'}`}>{status.text}</div>}
          <form onSubmit={submit} style={{ marginTop: 18 }}>
            <div className="form-grid">
              <div><label className="label">Nom</label><input className="input-field" value={form.nom} onChange={e => update('nom', e.target.value)} required /></div>
              <div><label className="label">Email</label><input className="input-field" type="email" value={form.email} onChange={e => update('email', e.target.value)} required /></div>
              <div className="full"><label className="label">Sujet</label><input className="input-field" value={form.sujet} onChange={e => update('sujet', e.target.value)} /></div>
              <div className="full"><label className="label">Message</label><textarea className="input-field" rows="6" value={form.message} onChange={e => update('message', e.target.value)} required /></div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 18 }}><Send size={18} /> Envoyer</button>
          </form>
        </div>
        <div className="card">
          <h2>Coordonnées</h2>
          <p className="muted" style={{ margin: '12px 0 24px' }}>Plateforme pédagogique dédiée aux services de santé et de bien-être pour sportifs.</p>
          <p style={{ marginBottom: 16 }}><Mail size={18} /> contact@vitacare.fr</p>
          <p style={{ marginBottom: 16 }}><Phone size={18} /> 01 84 00 00 00</p>
          <p><MapPin size={18} /> Paris, Lyon, Bordeaux, Marseille</p>
        </div>
      </div>
    </div>
  );
}
