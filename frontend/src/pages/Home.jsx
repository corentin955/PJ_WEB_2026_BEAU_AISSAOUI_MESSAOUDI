import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { servicesAPI } from '../utils/api';
import {
  ArrowRight, Zap, Shield, Star, Users,
  Play, CheckCircle, TrendingUp, Award,
} from 'lucide-react';
import '../styles/Home.css';

const HERO_SPORTS = ['Runners', 'Cyclistes', 'Nageurs', 'Footballeurs', 'Crossfitters'];

export default function Home() {
  const [services, setServices] = useState([]);
  const [sportIndex, setSportIndex] = useState(0);

  useEffect(() => {
    servicesAPI.getAll({ sort: 'note' }).then(r => setServices(r.data.data?.slice(0, 6) || []));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setSportIndex(i => (i + 1) % HERO_SPORTS.length), 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="page-wrapper">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-gradient" />
          <div className="hero-grid" />
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
        </div>
        <div className="container hero-content">
          <div className="hero-badge">
            <Zap size={14} />
            <span>Plateforme #1 pour les sportifs</span>
          </div>
          <h1 className="hero-title">
            La santé sportive<br />
            réinventée pour<br />
            <span className="hero-sport-word">{HERO_SPORTS[sportIndex]}</span>
          </h1>
          <p className="hero-subtitle">
            Trouvez en quelques secondes les meilleurs spécialistes de santé et de bien-être adaptés à vos besoins sportifs. Kiné, osthéo, cryothérapie, nutrition…
          </p>
          <div className="hero-actions">
            <Link to="/services" className="btn btn-primary btn-lg">
              Explorer les services <ArrowRight size={18} />
            </Link>
            <Link to="/inscription" className="btn btn-secondary btn-lg">
              <Play size={16} /> Créer un compte
            </Link>
          </div>
          <div className="hero-stats">
            {[
              { value: '150+', label: 'Praticiens certifiés' },
              { value: '2 400+', label: 'Sportifs accompagnés' },
              { value: '4.8/5', label: 'Note moyenne' },
            ].map(({ value, label }) => (
              <div key={label} className="hero-stat">
                <span className="hero-stat-value">{value}</span>
                <span className="hero-stat-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Hero image side */}
        <div className="hero-image-side">
          <img
            src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80"
            alt="Sportif en rééducation"
            className="hero-image"
          />
          <div className="hero-card-float">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={18} color="#0D2B1E" />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Réservation confirmée</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Séance kiné · 14h00</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured services */}
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Services <span className="gradient-text">En Vedette</span></h2>
              <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Les prestations les mieux notées par notre communauté</p>
            </div>
            <Link to="/services" className="btn btn-ghost">
              Tout voir <ArrowRight size={16} />
            </Link>
          </div>
          <div className="services-preview-grid">
            {services.map((s, i) => (
              <ServiceCard key={s.id} service={s} delay={i * 0.07} />
            ))}
          </div>
        </div>
      </section>

      {/* Why VitaCare */}
      <section className="section why-section">
        <div className="why-bg" />
        <div className="container">
          <div className="section-header centered">
            <h2 className="section-title">Pourquoi <span className="gradient-text">VitaCare</span> ?</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 8, maxWidth: 500, margin: '8px auto 0' }}>
              Une plateforme pensée pour les sportifs, par des sportifs
            </p>
          </div>
          <div className="why-grid">
            {[
              { icon: Shield,    title: 'Praticiens vérifiés',      desc: 'Tous nos spécialistes sont certifiés et spécialisés dans la médecine et le bien-être sportif.' },
              { icon: Zap,       title: 'Réservation instantanée',  desc: 'Trouvez et réservez un créneau en moins de 2 minutes, 24h/24 et 7j/7.' },
              { icon: TrendingUp,title: 'Suivi de performance',     desc: 'Gardez un historique complet de vos consultations et suivez votre progression.' },
              { icon: Award,     title: 'Spécialistes du sport',    desc: 'Des professionnels qui comprennent les contraintes et objectifs des sportifs.' },
              { icon: Users,     title: 'Communauté active',        desc: 'Rejoignez plus de 2 400 sportifs qui font confiance à VitaCare.' },
              { icon: Star,      title: 'Évaluations vérifiées',    desc: 'Des avis authentiques de sportifs pour vous aider à choisir le bon spécialiste.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="why-card">
                <div className="why-icon">
                  <Icon size={22} />
                </div>
                <h3 className="why-title">{title}</h3>
                <p className="why-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-box">
            <div className="cta-content">
              <h2 className="section-title">Prêt à Optimiser<br /><span className="gradient-text">Votre Récupération ?</span></h2>
              <p style={{ color: 'var(--text-muted)', marginTop: 16, fontSize: '1.05rem' }}>
                Rejoignez VitaCare et accédez aux meilleurs spécialistes du sport.
              </p>
              <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap' }}>
                <Link to="/inscription" className="btn btn-primary btn-lg">
                  Démarrer gratuitement <ArrowRight size={18} />
                </Link>
                <Link to="/services" className="btn btn-ghost btn-lg">
                  Explorer les services
                </Link>
              </div>
            </div>
            <div className="cta-image">
              <img src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80" alt="Massage sportif" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ service, delay }) {
  return (
    <div className="service-preview-card" style={{ animationDelay: `${delay}s` }}>
      <div className="spc-image">
        <img src={service.image_url || `https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300`} alt={service.nom_praticien} />
        <div className="spc-overlay">
          <span className="badge" style={{ background: service.categorie_couleur + '33', color: service.categorie_couleur, border: `1px solid ${service.categorie_couleur}55` }}>
            {service.categorie_nom}
          </span>
        </div>
      </div>
      <div className="spc-body">
        <div className="spc-top">
          <div>
            <div className="spc-praticien">{service.nom_praticien}</div>
            <div className="spc-titre">{service.titre}</div>
          </div>
          {service.note_moyenne > 0 && (
            <div className="spc-note">
              <Star size={12} fill="gold" color="gold" />
              <span>{parseFloat(service.note_moyenne).toFixed(1)}</span>
            </div>
          )}
        </div>
        <div className="spc-meta">
          <span>⏱ {service.duree} min</span>
          <span>📍 {service.lieu.split(',')[0]}</span>
        </div>
        <div className="spc-footer">
          <span className="spc-prix">{parseFloat(service.prix).toFixed(0)} €</span>
          <Link to="/services" className="btn btn-primary btn-sm">Réserver</Link>
        </div>
      </div>
    </div>
  );
}
