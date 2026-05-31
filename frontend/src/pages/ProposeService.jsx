import React, { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { servicesAPI } from '../utils/api';

export default function ProposeService() {
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({
    categorie_id: '', nom_praticien: '', titre: '', description: '',
    prix: '', duree: '', lieu: '', adresse: '', image_url: ''
  });

  useEffect(() => { servicesAPI.getCategories().then(r => setCategories(r.data.data || [])).catch(() => {}); }, []);
  const update = (k, v) => setForm({ ...form, [k]: v });

  const submit = async (e) => {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await servicesAPI.create(form);
      setStatus({ type: 'success', text: res.data.message || 'Service proposé avec succès.' });
      setForm({ categorie_id: '', nom_praticien: '', titre: '', description: '', prix: '', duree: '', lieu: '', adresse: '', image_url: '' });
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.error || 'Impossible de créer le service.' });
    }
  };

  return (
    <div className="container">
      <div className="page-hero">
        <div className="page-kicker">Espace praticien</div>
        <h1 className="section-title">Proposer un service</h1>
        <p className="page-subtitle">Ajoutez une consultation, une activité ou un programme dans le catalogue VitaCare.</p>
      </div>
      <div className="card">
        {status && <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'}`}>{status.text}</div>}
        <form onSubmit={submit}>
          <div className="form-grid">
            <div>
              <label className="label">Catégorie</label>
              <select className="select-field" value={form.categorie_id} onChange={e => update('categorie_id', e.target.value)} required>
                <option value="">Choisir une catégorie</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div><label className="label">Nom praticien</label><input className="input-field" value={form.nom_praticien} onChange={e => update('nom_praticien', e.target.value)} required /></div>
            <div><label className="label">Titre</label><input className="input-field" value={form.titre} onChange={e => update('titre', e.target.value)} placeholder="Kinésithérapeute du sport" /></div>
            <div><label className="label">Lieu</label><input className="input-field" value={form.lieu} onChange={e => update('lieu', e.target.value)} required /></div>
            <div><label className="label">Prix (€)</label><input className="input-field" type="number" min="0" step="0.01" value={form.prix} onChange={e => update('prix', e.target.value)} required /></div>
            <div><label className="label">Durée (minutes)</label><input className="input-field" type="number" min="10" value={form.duree} onChange={e => update('duree', e.target.value)} required /></div>
            <div className="full"><label className="label">Adresse</label><input className="input-field" value={form.adresse} onChange={e => update('adresse', e.target.value)} /></div>
            <div className="full"><label className="label">Image URL</label><input className="input-field" value={form.image_url} onChange={e => update('image_url', e.target.value)} /></div>
            <div className="full"><label className="label">Description</label><textarea className="input-field" rows="5" value={form.description} onChange={e => update('description', e.target.value)} required /></div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 20 }}><PlusCircle size={18} /> Publier le service</button>
        </form>
      </div>
    </div>
  );
}
