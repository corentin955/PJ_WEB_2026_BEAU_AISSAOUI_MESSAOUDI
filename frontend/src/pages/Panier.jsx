import React, { useEffect, useState } from 'react';
import { ShoppingCart, Trash2, CheckCircle } from 'lucide-react';
import { reservationsAPI } from '../utils/api';

export default function Panier() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState(null);

  const load = () => {
    reservationsAPI.getPanier().then(r => {
      setItems(r.data.data || []);
      setTotal(Number(r.data.total || 0));
    }).catch(() => {});
  };
  useEffect(load, []);

  const remove = async (id) => { await reservationsAPI.removeFromPanier(id); load(); };

  const valider = async () => {
    setStatus(null);
    try {
      const res = await reservationsAPI.validerPanier();
      setStatus({ type: 'success', text: res.data.message || 'Réservations confirmées.' });
      load();
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.error || 'Validation impossible.' });
    }
  };

  return (
    <div className="container">
      <div className="page-hero">
        <div className="page-kicker">Validation simulée</div>
        <h1 className="section-title">Panier de réservations</h1>
        <p className="page-subtitle">Préparez vos réservations puis validez l’opération. Le paiement reste simulé.</p>
      </div>
      {status && <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'}`}>{status.text}</div>}
      <div className="grid-2">
        <div>
          {items.length === 0 ? <div className="card"><p className="muted">Votre panier est vide.</p></div> : items.map(item => (
            <div className="row-card" key={item.id}>
              <div>
                <h3>{item.titre}</h3>
                <p className="muted">{item.nom_praticien} · {item.lieu}</p>
                <p className="muted">{item.duree} min · {Number(item.prix).toFixed(2)} €</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => remove(item.id)}><Trash2 size={16} /> Retirer</button>
            </div>
          ))}
        </div>
        <div className="card" style={{ height: 'fit-content' }}>
          <h2><ShoppingCart size={22} /> Résumé</h2>
          <p className="muted" style={{ marginTop: 10 }}>{items.length} élément(s) dans le panier</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '24px 0', fontSize: '1.4rem', fontWeight: 800 }}>
            <span>Total</span><span>{total.toFixed(2)} €</span>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={!items.length} onClick={valider}>
            <CheckCircle size={18} /> Valider le paiement simulé
          </button>
        </div>
      </div>
    </div>
  );
}
