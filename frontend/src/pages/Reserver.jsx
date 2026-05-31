import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { servicesAPI, reservationsAPI, api } from '../utils/api';
import {
  Clock, MapPin, Star, ChevronLeft, ChevronRight,
  Calendar, User, CheckCircle, ArrowLeft,
} from 'lucide-react';
import Toast from '../components/Toast';
import '../styles/Reserver.css';

const DRAFT_KEY = 'vitacare_reservation_draft';

function getDraft(serviceId) {
  try {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    if (!saved) return null;
    const d = JSON.parse(saved);
    return String(d.serviceId) === String(serviceId) ? d : null;
  } catch { return null; }
}

const STEPS = [
  { n: 1, label: 'Choix du service' },
  { n: 2, label: 'Date & heure' },
  { n: 3, label: 'Informations' },
  { n: 4, label: 'Confirmation' },
];

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function generateSlots() {
  const slots = [];
  for (let h = 8; h < 18; h++) slots.push(`${String(h).padStart(2, '0')}:00`);
  return slots;
}

function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function formatDateLong(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return `${dayNames[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

export default function Reserver() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(() => getDraft(serviceId)?.currentStep ?? 1);
  const [service, setService] = useState(null);
  const [loadingService, setLoadingService] = useState(true);

  const now = new Date();
  const [calYear, setCalYear] = useState(() => {
    const d = getDraft(serviceId);
    if (d?.selectedDate) return new Date(d.selectedDate + 'T00:00:00').getFullYear();
    return now.getFullYear();
  });
  const [calMonth, setCalMonth] = useState(() => {
    const d = getDraft(serviceId);
    if (d?.selectedDate) return new Date(d.selectedDate + 'T00:00:00').getMonth();
    return now.getMonth();
  });
  const [selectedDate, setSelectedDate] = useState(() => getDraft(serviceId)?.selectedDate ?? null);
  const [creneaux, setCreneaux] = useState([]);
  const [creneauxLoading, setCreneauxLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(() => getDraft(serviceId)?.selectedHeure ?? null);

  const [notes, setNotes] = useState(() => getDraft(serviceId)?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const load = async () => {
      setLoadingService(true);
      try {
        const r = await servicesAPI.getOne(serviceId);
        setService(r.data.data || r.data);
      } catch (err) {
        if (err.response?.status === 401) navigate('/connexion');
        else navigate('/services');
      } finally {
        setLoadingService(false);
      }
    };
    load();
  }, [serviceId]);

  // Persist draft on every relevant state change
  useEffect(() => {
    if (!service) return;
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      serviceId,
      nomPraticien: service.nom_praticien,
      titre: service.titre,
      currentStep: step,
      selectedDate,
      selectedHeure: selectedSlot,
      notes,
    }));
  }, [serviceId, step, selectedDate, selectedSlot, notes, service]);

  const fetchCreneaux = async (dateStr) => {
    setCreneauxLoading(true);
    setCreneaux([]);
    try {
      const r = await api.get(`/reservations.php?action=creneaux&service_id=${serviceId}&date=${dateStr}`);
      const slots = r.data.data || r.data.slots || [];
      setCreneaux(slots.length > 0 ? slots : generateSlots());
    } catch {
      setCreneaux(generateSlots());
    } finally {
      setCreneauxLoading(false);
    }
  };

  // If restoring step 2 with a date, fetch its slots
  useEffect(() => {
    if (step === 2 && selectedDate && creneaux.length === 0) {
      fetchCreneaux(selectedDate);
    }
  }, []); // intentional: mount only

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    fetchCreneaux(dateStr);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await reservationsAPI.create({
        service_id: parseInt(serviceId),
        date_reservation: selectedDate,
        heure_reservation: selectedSlot,
        notes,
      });
      sessionStorage.removeItem(DRAFT_KEY);
      showToast('Réservation confirmée ✓');
      setTimeout(() => navigate('/mes-reservations'), 1500);
    } catch (err) {
      if (err.response?.status === 401) navigate('/connexion');
      else showToast(err.response?.data?.error || 'Erreur lors de la réservation', 'error');
      setSubmitting(false);
    }
  };

  const calDays = () => {
    const firstDay = new Date(calYear, calMonth, 1);
    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const isPastDay = (day) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(calYear, calMonth, day) < today;
  };

  if (loadingService) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="reserver-page">
      {/* Back link — does NOT clear the draft */}
      <div style={{ paddingTop: 20 }}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '4px 0' }}
          onClick={() => navigate('/services')}
        >
          <ArrowLeft size={13} /> Retour aux services
        </button>
      </div>

      {/* Stepper */}
      <div className="reserver-stepper">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`step-item ${step === s.n ? 'active' : step > s.n ? 'done' : ''}`}>
              <div className="step-circle">
                {step > s.n ? <CheckCircle size={16} /> : s.n}
              </div>
              <span className="step-label">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-line ${step > s.n ? 'done' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="reserver-body">
        {/* ── STEP 1 ── */}
        {step === 1 && service && (
          <div className="reserver-card">
            <h2 className="reserver-step-title">Votre service</h2>
            <div className="rsv-service-row">
              <img
                className="rsv-service-img"
                src={service.image_url || 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400'}
                alt={service.nom_praticien}
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400'; }}
              />
              <div className="rsv-service-info">
                {service.categorie_nom && (
                  <span
                    className="rsv-badge"
                    style={{ background: (service.categorie_couleur || '#A8E063') + '33', color: service.categorie_couleur || '#A8E063' }}
                  >
                    {service.categorie_nom}
                  </span>
                )}
                <h3 className="rsv-praticien">{service.nom_praticien}</h3>
                <p className="rsv-titre">{service.titre}</p>
                {parseFloat(service.note_moyenne) > 0 && (
                  <div className="rsv-rating">
                    <Star size={13} fill="#FFD700" color="#FFD700" />
                    <span>{parseFloat(service.note_moyenne).toFixed(1)}</span>
                    <span style={{ color: 'var(--text-dim)' }}>({service.nombre_avis} avis)</span>
                  </div>
                )}
                <div className="rsv-meta-row">
                  <span><Clock size={14} /> {service.duree} min</span>
                  <span><MapPin size={14} /> {service.lieu?.split(',')[0]}</span>
                </div>
                {service.description && (
                  <p className="rsv-desc">{service.description}</p>
                )}
                <div className="rsv-price-big">{parseFloat(service.prix || 0).toFixed(0)} €</div>
              </div>
            </div>
            <div className="reserver-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/services')}>
                <ChevronLeft size={15} /> Retour
              </button>
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Continuer <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="reserver-step2-layout">
            <div className="reserver-card reserver-cal-card">
              <h2 className="reserver-step-title">Choisissez une date</h2>

              <div className="cal-header">
                <button className="cal-nav" onClick={prevMonth}><ChevronLeft size={18} /></button>
                <span className="cal-month-label">{MONTHS_FR[calMonth]} {calYear}</span>
                <button className="cal-nav" onClick={nextMonth}><ChevronRight size={18} /></button>
              </div>

              <div className="cal-grid">
                {DAYS_FR.map(d => (
                  <div key={d} className="cal-day-label">{d}</div>
                ))}
                {calDays().map((day, i) => {
                  if (!day) return <div key={`e-${i}`} />;
                  const dateStr = toDateStr(calYear, calMonth, day);
                  const past = isPastDay(day);
                  const selected = selectedDate === dateStr;
                  return (
                    <button
                      key={day}
                      className={`cal-day${selected ? ' selected' : ''}${past ? ' past' : ''}`}
                      disabled={past}
                      onClick={() => handleDateClick(dateStr)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <div className="slots-section">
                  <h3 className="slots-title">
                    <Clock size={15} /> Créneaux — {formatDateLong(selectedDate)}
                  </h3>
                  {creneauxLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                      <div className="spinner" />
                    </div>
                  ) : (
                    <div className="slots-grid">
                      {creneaux.map(slot => (
                        <button
                          key={slot}
                          className={`slot-btn${selectedSlot === slot ? ' selected' : ''}`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="reserver-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>
                  <ChevronLeft size={15} /> Retour
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!selectedDate || !selectedSlot}
                  onClick={() => setStep(3)}
                >
                  Continuer <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Floating recap */}
            <aside className="reserver-recap">
              <h3 className="recap-title">Récapitulatif</h3>
              <div className="recap-row"><User size={14} /><span>{service?.nom_praticien}</span></div>
              <div className="recap-row"><Star size={14} /><span>{service?.titre}</span></div>
              <div className="recap-row"><Clock size={14} /><span>{service?.duree} min</span></div>
              {selectedDate && (
                <div className="recap-row">
                  <Calendar size={14} />
                  <span>{formatDateLong(selectedDate)}</span>
                </div>
              )}
              {selectedSlot && (
                <div className="recap-row recap-row-accent">
                  <Clock size={14} /><span>{selectedSlot}</span>
                </div>
              )}
              <div className="recap-price">
                {service ? parseFloat(service.prix || 0).toFixed(0) : 0} €
              </div>
            </aside>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="reserver-card">
            <h2 className="reserver-step-title">Informations supplémentaires</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: '0.9rem' }}>
              Partagez toute information utile pour votre praticien (optionnel).
            </p>
            <label className="label">Notes / informations particulières</label>
            <textarea
              className="input-field"
              style={{ minHeight: 140, resize: 'vertical', width: '100%', marginTop: 8 }}
              placeholder="Ex : allergie, blessure, objectifs particuliers..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <div className="reserver-actions" style={{ marginTop: 24 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setStep(2)}>
                <ChevronLeft size={15} /> Retour
              </button>
              <button className="btn btn-primary" onClick={() => setStep(4)}>
                Continuer <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4 ── */}
        {step === 4 && service && (
          <div className="reserver-card">
            <h2 className="reserver-step-title">Confirmez votre réservation</h2>

            <div className="confirm-recap">
              <ConfirmRow label="Praticien" value={service.nom_praticien} />
              <ConfirmRow label="Service" value={service.titre} />
              <ConfirmRow label="Date" value={formatDateLong(selectedDate)} />
              <ConfirmRow label="Heure" value={selectedSlot} />
              <ConfirmRow label="Durée" value={`${service.duree} min`} />
              <ConfirmRow label="Lieu" value={service.lieu} />
              {notes && <ConfirmRow label="Notes" value={notes} />}
              <div className="confirm-row confirm-price-row">
                <span className="confirm-label">Tarif</span>
                <span className="confirm-price">{parseFloat(service.prix || 0).toFixed(2)} €</span>
              </div>
            </div>

            <div className="reserver-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setStep(3)} disabled={submitting}>
                <ChevronLeft size={15} /> Retour
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  : <CheckCircle size={16} />}
                {submitting ? 'Confirmation...' : 'Confirmer la réservation'}
              </button>
            </div>
          </div>
        )}
      </div>

      <Toast toast={toast} />
    </div>
  );
}

function ConfirmRow({ label, value }) {
  return (
    <div className="confirm-row">
      <span className="confirm-label">{label}</span>
      <span className="confirm-value">{value}</span>
    </div>
  );
}
