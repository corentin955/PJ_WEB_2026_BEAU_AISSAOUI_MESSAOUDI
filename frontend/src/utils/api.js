import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost/vitacare/backend',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

export const servicesAPI = {
  getAll: (params = {}) => api.get('/services.php?action=list', { params }),
  getOne: (id) => api.get(`/services.php?action=get&id=${id}`),
  create: (data) => api.post('/services.php?action=create', data),
  getCategories: () => api.get('/services.php?action=categories'),
};

export const reservationsAPI = {
  getAll: () => api.get('/reservations.php?action=list'),
  create: (data) => api.post('/reservations.php?action=create', data),
  annuler: (id) => api.post(`/reservations.php?action=annuler&id=${id}`),
  getPanier: () => api.get('/reservations.php?action=panier_list'),
  addToPanier: (data) => api.post('/reservations.php?action=panier_add', data),
  removeFromPanier: (id) => api.post(`/reservations.php?action=panier_remove&id=${id}`),
  validerPanier: () => api.post('/reservations.php?action=panier_valider'),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications.php?action=list'),
  markRead: (id) => api.post(`/notifications.php?action=mark_read&id=${id}`),
  markAllRead: () => api.post('/notifications.php?action=mark_all_read'),
};

export const miscAPI = {
  getFaq: () => api.get('/misc.php?endpoint=faq'),
  sendContact: (data) => api.post('/misc.php?endpoint=contact', data),
};

export const authAPI = {
  login: (data) => api.post('/auth.php?action=login', data),
  register: (data) => api.post('/auth.php?action=register', data),
  logout: () => api.post('/auth.php?action=logout'),
  me: () => api.get('/auth.php?action=me'),
};

export const adminAPI = {
  getStats:       ()             => api.get('/admin.php?action=stats'),
  getUtilisateurs:(role = '')    => api.get('/admin.php?action=utilisateurs', { params: role ? { role } : {} }),
  updateUser:     (data)         => api.post('/admin.php?action=update_user', data),
  getServices:    ()             => api.get('/admin.php?action=services'),
  updateService:  (data)         => api.post('/admin.php?action=update_service', data),
};

export const praticienAPI = {
  getAgenda:       (params = {}) => api.get('/praticien.php?action=agenda', { params }),
  updateStatut:    (data)        => api.post('/praticien.php?action=update_statut', data),
  getMesServices:  ()            => api.get('/praticien.php?action=mes_services'),
  proposerCreneau: (data)        => api.post('/praticien.php?action=proposer_creneau', data),
  profilPatient:   (patientId)   => api.get('/praticien.php?action=profil_patient', { params: { patient_id: patientId } }),
  deleteService:   (id)          => api.post(`/services.php?action=delete&id=${id}`),
};
