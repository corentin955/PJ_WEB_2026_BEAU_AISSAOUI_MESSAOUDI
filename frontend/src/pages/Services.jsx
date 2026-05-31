import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { servicesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  Search, Star, Clock, MapPin, CalendarCheck,
  ChevronDown, X, SlidersHorizontal, Loader
} from 'lucide-react';
import Toast from '../components/Toast';
import '../styles/Services.css';

const SORT_OPTIONS = [
  { value: 'note', label: 'Mieux notés' },
  { value: 'prix_asc', label: 'Prix croissant' },
  { value: 'prix_desc', label: 'Prix décroissant' },
  { value: 'duree', label: 'Durée' },
];

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCat, setSelectedCat] = useState(searchParams.get('categorie') || '');
  const [prixMin, setPrixMin] = useState('');
  const [prixMax, setPrixMax] = useState('');
  const [sort, setSort] = useState('note');
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState(null);
  const [draft, setDraft] = useState(() => {
    try {
      const saved = sessionStorage.getItem('vitacare_reservation_draft');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchServices = useCallback(() => {
    setLoading(true);
    const params = { sort };
    if (search) params.search = search;
    if (selectedCat) params.categorie_id = selectedCat;
    if (prixMin) params.prix_min = prixMin;
    if (prixMax) params.prix_max = prixMax;
    servicesAPI.getAll(params)
      .then(r => setServices(r.data.data || []))
      .finally(() => setLoading(false));
  }, [search, selectedCat, prixMin, prixMax, sort]);

  useEffect(() => {
    servicesAPI.getCategories().then(r => setCategories(r.data.data || []));
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchServices, 300);
    return () => clearTimeout(timer);
  }, [fetchServices]);

  const handleReserver = (service) => {
    if (!user) { showToast('Connectez-vous pour réserver', 'error'); return; }
    navigate(`/reserver/${service.id}`);
  };

  const clearFilters = () => {
    setSearch(''); setSelectedCat(''); setPrixMin(''); setPrixMax(''); setSort('note');
  };

  const hasFilters = search || selectedCat || prixMin || prixMax;

  return (
    <div className="page-wrapper">
      <div className="services-page">
        {/* Header */}
        <div className="services-header">
          <div className="container">
            <div style={{ maxWidth: 600 }}>
              <h1 className="section-title">Tous les <span className="gradient-text">Services</span></h1>
              <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                {services.length} service{services.length > 1 ? 's' : ''} disponible{services.length > 1 ? 's' : ''}
              </p>
            </div>
            {/* Search bar */}
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input
                className="search-input"
                placeholder="Rechercher un service, praticien, ville..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && <button className="search-clear" onClick={() => setSearch('')}><X size={16} /></button>}
            </div>
          </div>
        </div>

        {draft && (
          <div style={{
            background: 'var(--primary)',
            color: 'var(--on-primary)',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: '0.88rem',
            fontWeight: 600,
            position: 'sticky',
            top: 62,
            zIndex: 50,
          }}>
            <span>Réservation en cours — {draft.nomPraticien || draft.titre || 'Service'}</span>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => navigate(`/reserver/${draft.serviceId}`)}
              style={{
                background: 'rgba(0,0,0,0.15)',
                border: 'none',
                borderRadius: 6,
                padding: '6px 14px',
                color: 'inherit',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              Reprendre →
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem('vitacare_reservation_draft');
                setDraft(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 4,
              }}
              aria-label="Annuler la réservation en cours"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="container services-body">
          {/* Categories tabs */}
          <div className="cat-tabs">
            <button
              className={`tag ${!selectedCat ? 'tag-active' : 'tag-inactive'}`}
              onClick={() => setSelectedCat('')}
            >
              Toutes
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`tag ${selectedCat == cat.id ? 'tag-active' : 'tag-inactive'}`}
                style={selectedCat == cat.id ? { borderColor: cat.couleur, color: cat.couleur, background: cat.couleur + '18' } : {}}
                onClick={() => setSelectedCat(selectedCat == cat.id ? '' : cat.id)}
              >
                {cat.nom}
              </button>
            ))}
          </div>

          {/* Filters + Sort bar */}
          <div className="filters-bar">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={15} />
              Filtres
              {hasFilters && <span className="filter-dot" />}
              <ChevronDown size={13} style={{ transform: showFilters ? 'rotate(180deg)' : '', transition: '0.2s' }} />
            </button>
            {hasFilters && (
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={clearFilters}>
                <X size={14} /> Effacer
              </button>
            )}
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Trier par :</span>
              <select className="select-field" style={{ width: 'auto', padding: '8px 14px' }} value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="filter-panel">
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <label className="label">Prix minimum (€)</label>
                  <input className="input-field" style={{ width: 140 }} type="number" placeholder="0" value={prixMin} onChange={e => setPrixMin(e.target.value)} />
                </div>
                <div>
                  <label className="label">Prix maximum (€)</label>
                  <input className="input-field" style={{ width: 140 }} type="number" placeholder="200" value={prixMax} onChange={e => setPrixMax(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Services grid */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
              <div className="spinner" />
            </div>
          ) : services.length === 0 ? (
            <div className="empty-state">
              <Search size={48} />
              <h3>Aucun service trouvé</h3>
              <p>Essayez de modifier vos filtres</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={clearFilters}>Voir tous les services</button>
            </div>
          ) : (
            <div className="services-grid">
              {services.map((service, i) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  delay={i * 0.04}
                  onReserver={handleReserver}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}

function ServiceCard({ service, delay, onReserver }) {
  return (
    <div className="service-card" style={{ animationDelay: `${delay}s` }}>
      <div className="sc-image">
        <img
          src={service.image_url || 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400'}
          alt={service.nom_praticien}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400'; }}
        />
        <div className="sc-image-overlay" />
        <span className="sc-badge" style={{ background: service.categorie_couleur + '33', color: service.categorie_couleur }}>
          {service.categorie_nom}
        </span>
      </div>

      <div className="sc-content">
        <div className="sc-header">
          <div>
            <h3 className="sc-praticien">{service.nom_praticien}</h3>
            <p className="sc-titre">{service.titre}</p>
          </div>
          {parseFloat(service.note_moyenne) > 0 && (
            <div className="sc-rating">
              <Star size={13} fill="#FFD700" color="#FFD700" />
              <span>{parseFloat(service.note_moyenne).toFixed(1)}</span>
              <span style={{ color: 'var(--text-dim)' }}>({service.nombre_avis})</span>
            </div>
          )}
        </div>

        {service.description && (
          <p className="sc-desc">{service.description.slice(0, 100)}…</p>
        )}

        <div className="sc-meta">
          <span className="sc-meta-item">
            <Clock size={13} /> {service.duree} min
          </span>
          <span className="sc-meta-item">
            <MapPin size={13} /> {service.lieu.split(',')[0]}
          </span>
        </div>

        <div className="sc-footer">
          <div className="sc-price">
            <span className="sc-price-main">{parseFloat(service.prix).toFixed(0)} €</span>
            <span className="sc-price-label">/ séance</span>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onReserver(service)}
          >
            <CalendarCheck size={14} />
            Réserver
          </button>
        </div>
      </div>
    </div>
  );
}
