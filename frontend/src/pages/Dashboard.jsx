import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Euro, Activity, Star, Clock, MapPin,
  ArrowRight, ShoppingCart, Bell,
} from 'lucide-react';
import { reservationsAPI, notificationsAPI, servicesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUS_MAP = {
  confirmee:  { label: 'Confirmée',  bg: '#166534', color: '#A8E063' },
  en_attente: { label: 'En attente', bg: '#78350f', color: '#fcd34d' },
  annulee:    { label: 'Annulée',    bg: '#7f1d1d', color: '#fca5a5' },
  terminee:   { label: 'Terminée',   bg: '#1e3a2e', color: '#7A9E82' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [panier, setPanier]             = useState([]);
  const [unread, setUnread]             = useState(0);
  const [topServices, setTopServices]   = useState([]);

  useEffect(() => {
    reservationsAPI.getAll()
      .then(r => setReservations(r.data.data || []))
      .catch(() => {});
    reservationsAPI.getPanier()
      .then(r => setPanier(r.data.data || []))
      .catch(() => {});
    notificationsAPI.getAll()
      .then(r => setUnread(r.data.unread || 0))
      .catch(() => {});
    servicesAPI.getAll({ sort: 'note' })
      .then(r => setTopServices((r.data.data || []).slice(0, 3)))
      .catch(() => {});
  }, []);

  const confirmed = reservations.filter(r => r.statut === 'confirmee').length;
  const totalSpent = reservations.reduce(
    (s, r) => s + Number(r.prix_paye || r.service_prix || 0), 0
  );
  const uniqueServices = new Set(reservations.map(r => r.service_id).filter(Boolean)).size;
  const notedRdvs = reservations.filter(r => Number(r.note_praticien) > 0);
  const avgNote = notedRdvs.length
    ? (notedRdvs.reduce((s, r) => s + Number(r.note_praticien), 0) / notedRdvs.length).toFixed(1)
    : null;
  const tauxConfirmation = reservations.length
    ? Math.round((confirmed / reservations.length) * 100)
    : 0;

  return (
    <div className="container" style={{ paddingBottom: 64 }}>

      {/* ── Greeting ── */}
      <div className="page-hero">
        <div className="page-kicker">Tableau de bord</div>
        <h1 className="section-title">
          Bonjour, <span className="gradient-text">{user?.prenom}</span>
        </h1>
        <p className="page-subtitle">Vue d'ensemble de votre activité VitaCare.</p>
      </div>

      {/* ── 4 Stat cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 14,
        marginBottom: 24,
      }}>
        <StatCard
          icon={Calendar}
          value={confirmed}
          label="RDV confirmés"
        />
        <StatCard
          icon={Euro}
          value={`${totalSpent.toFixed(0)} €`}
          label="Total dépensé"
        />
        <StatCard
          icon={Activity}
          value={uniqueServices || reservations.length}
          label="Services consultés"
        />
        <StatCard
          icon={Star}
          value={avgNote ? `${avgNote}/5` : '—'}
          label="Note moyenne"
          accent="#FFD700"
          accentBg="rgba(255,215,0,0.1)"
          accentBorder="rgba(255,215,0,0.22)"
        />
      </div>

      {/* ── Main 2-column grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 300px',
        gap: 20,
        alignItems: 'start',
      }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Historique des réservations */}
          <div style={CARD}>
            <SectionLabel>Historique des réservations</SectionLabel>
            {reservations.length === 0 ? (
              <p style={{ color: '#3D6B4A', fontSize: '0.88rem', padding: '6px 0' }}>
                Aucune réservation pour le moment.
              </p>
            ) : (
              <>
                {reservations.slice(0, 6).map(r => (
                  <HistoryRow key={r.id} r={r} />
                ))}
                {reservations.length > 6 && (
                  <Link
                    to="/mes-reservations"
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}
                  >
                    Voir tout <ArrowRight size={14} />
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Services recommandés */}
          {topServices.length > 0 && (
            <div style={CARD}>
              <SectionLabel>Services recommandés</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topServices.map(s => (
                  <ServiceRow key={s.id} service={s} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 16,
          position: 'sticky', top: 82,
        }}>

          {/* Profil résumé */}
          <div style={CARD}>
            <SectionLabel>Mon profil</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{
                width: 50, height: 50, borderRadius: '50%',
                background: 'linear-gradient(135deg, #A8E063, #7BC441)',
                color: '#0D2B1E', fontWeight: 800, fontSize: '0.95rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: '#FAFAF7', fontSize: '0.93rem' }}>
                  {user?.prenom} {user?.nom}
                </div>
                <div style={{
                  color: '#7A9E82', fontSize: '0.76rem', marginTop: 2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user?.email}
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center',
                  marginTop: 6, padding: '2px 10px', borderRadius: 50,
                  background: 'rgba(168,224,99,0.12)',
                  border: '1px solid rgba(168,224,99,0.25)',
                  color: '#A8E063', fontSize: '0.68rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  {user?.role || 'Sportif'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <ProfileStat label="Réservations total" value={reservations.length} />
              <ProfileStat label="Montant total"      value={`${totalSpent.toFixed(2)} €`} />
              <ProfileStat
                label="Taux de confirmation"
                value={reservations.length ? `${tauxConfirmation}%` : '—'}
                last
              />
            </div>
            <Link
              to="/profil"
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}
            >
              Voir mon profil <ArrowRight size={14} />
            </Link>
          </div>

          {/* Accès rapides */}
          <div style={CARD}>
            <SectionLabel>Accès rapides</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <QuickLink to="/services"          icon={Activity}     label="Trouver un service" />
              <QuickLink to="/mes-reservations"  icon={Calendar}     label="Mes réservations" />
              <QuickLink to="/panier"            icon={ShoppingCart} label="Mon panier"    badge={panier.length} />
              <QuickLink to="/notifications"     icon={Bell}         label="Notifications" badge={unread} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ───────────────────────────── */

function StatCard({ icon: Icon, value, label,
  accent = '#A8E063',
  accentBg = 'rgba(168,224,99,0.12)',
  accentBorder = 'rgba(168,224,99,0.22)',
}) {
  return (
    <div style={{
      background: '#1a2e20', border: '1px solid #2a4030', borderRadius: 12, padding: 20,
      display: 'flex', alignItems: 'flex-start', gap: 14,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: accentBg, border: `1px solid ${accentBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent, flexShrink: 0,
      }}>
        <Icon size={20} />
      </div>
      <div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FAFAF7', lineHeight: 1, marginBottom: 5 }}>
          {value}
        </div>
        <div style={{
          fontSize: '0.72rem', fontWeight: 700, color: '#7A9E82',
          textTransform: 'uppercase', letterSpacing: '0.07em',
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: '#A8E063',
      marginBottom: 14, paddingBottom: 10,
      borderBottom: '1px solid #2a4030',
    }}>
      {children}
    </div>
  );
}

function HistoryRow({ r }) {
  const s = STATUS_MAP[r.statut] || STATUS_MAP.en_attente;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 0', borderBottom: '1px solid #1d3d28',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 600, color: '#FAFAF7', fontSize: '0.88rem', marginBottom: 3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {r.titre || r.nom_praticien}
        </div>
        <div style={{
          color: '#7A9E82', fontSize: '0.76rem',
          display: 'flex', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} />
            {r.date_reservation} · {String(r.heure_reservation).slice(0, 5)} · {r.duree} min
          </span>
          {r.lieu && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={11} /> {r.lieu.split(',')[0]}
            </span>
          )}
        </div>
      </div>
      <span style={{
        fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 50,
        background: s.bg, color: s.color,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {s.label}
      </span>
    </div>
  );
}

function ServiceRow({ service }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: 12,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid #2a4030',
      borderRadius: 10,
    }}>
      <div style={{ width: 64, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={service.image_url || 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=120'}
          alt={service.nom_praticien}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=120'; }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: '#FAFAF7', fontSize: '0.88rem', marginBottom: 2 }}>
          {service.nom_praticien}
        </div>
        <div style={{ color: '#7A9E82', fontSize: '0.76rem', marginBottom: 5 }}>
          {service.titre}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {parseFloat(service.note_moyenne) > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#FFD700', fontSize: '0.78rem', fontWeight: 600 }}>
              <Star size={11} fill="#FFD700" color="#FFD700" />
              {parseFloat(service.note_moyenne).toFixed(1)}
            </span>
          )}
          <span style={{ color: '#A8E063', fontWeight: 800, fontSize: '0.88rem', fontFamily: 'var(--font-display)' }}>
            {parseFloat(service.prix).toFixed(0)} €
          </span>
        </div>
      </div>
      <Link to="/services" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
        Réserver
      </Link>
    </div>
  );
}

function ProfileStat({ label, value, last }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '9px 0',
      borderBottom: last ? 'none' : '1px solid #1d3d28',
    }}>
      <span style={{ color: '#7A9E82', fontSize: '0.81rem' }}>{label}</span>
      <span style={{ color: '#FAFAF7', fontWeight: 700, fontSize: '0.88rem' }}>{value}</span>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label, badge }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid #2a4030',
        borderRadius: 9,
        color: '#FAFAF7',
        fontSize: '0.87rem',
        fontWeight: 500,
        textDecoration: 'none',
        transition: 'all 0.18s',
      }}
      onMouseOver={e => {
        e.currentTarget.style.borderColor = 'rgba(168,224,99,0.35)';
        e.currentTarget.style.background  = 'rgba(168,224,99,0.06)';
      }}
      onMouseOut={e => {
        e.currentTarget.style.borderColor = '#2a4030';
        e.currentTarget.style.background  = 'rgba(255,255,255,0.02)';
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 7,
        background: 'rgba(168,224,99,0.1)', border: '1px solid rgba(168,224,99,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#A8E063', flexShrink: 0,
      }}>
        <Icon size={15} />
      </div>
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && (
        <span style={{
          background: '#A8E063', color: '#0D2B1E',
          fontSize: '0.68rem', fontWeight: 800,
          padding: '1px 7px', borderRadius: 50,
        }}>
          {badge}
        </span>
      )}
      <ArrowRight size={14} style={{ color: '#3D6B4A' }} />
    </Link>
  );
}

/* ── Shared tokens ────────────────────────────── */
const CARD = {
  background: '#1a2e20',
  border: '1px solid #2a4030',
  borderRadius: 12,
  padding: 20,
};
