import React, { useEffect, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { miscAPI } from '../utils/api';

const fallback = [
  { question: 'Comment réserver un service ?', reponse: 'Choisissez un service, ajoutez-le au panier puis validez votre réservation.' },
  { question: 'Le paiement est-il réel ?', reponse: 'Non, le paiement est simulé dans le cadre du projet pédagogique.' },
  { question: 'Qui peut proposer un service ?', reponse: 'Les comptes praticiens peuvent proposer des consultations ou programmes.' }
];

export default function FAQ() {
  const [items, setItems] = useState(fallback);
  useEffect(() => {
    miscAPI.getFaq().then(r => {
      if (r.data.data?.length) setItems(r.data.data);
    }).catch(() => {});
  }, []);

  return (
    <div className="container">
      <div className="page-hero">
        <div className="page-kicker">Questions fréquentes</div>
        <h1 className="section-title">FAQ VitaCare</h1>
        <p className="page-subtitle">Les réponses essentielles pour comprendre le fonctionnement de la plateforme.</p>
      </div>
      {items.map((item, index) => (
        <div className="faq-item" key={item.id || index}>
          <h3><HelpCircle size={20} style={{ color: 'var(--primary)', verticalAlign: 'middle', marginRight: 8 }} />{item.question}</h3>
          <p className="muted">{item.reponse}</p>
        </div>
      ))}
    </div>
  );
}
