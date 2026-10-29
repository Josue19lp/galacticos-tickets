// Funciones para cada endpoint de la API. Las páginas usan esto en lugar de llamar a axios directamente.
import api from './api';

export const authApi = {
  login: (datos) => api.post('/auth/login', datos).then((r) => r.data),
  registro: (datos) => api.post('/auth/register', datos).then((r) => r.data),
  logout: () => api.post('/auth/logout'),
};

export const ticketsApi = {
  listar: (filtros = {}) => api.get('/tickets', { params: limpiar(filtros) }).then((r) => r.data),
  obtener: (id) => api.get(`/tickets/${id}`).then((r) => r.data),
  crear: (datos) => api.post('/tickets', datos).then((r) => r.data), // { ticket, jobId }
  editar: (id, cambios) => api.put(`/tickets/${id}`, cambios).then((r) => r.data),
  cambiarEstado: (id, estado) => api.patch(`/tickets/${id}/estado`, { estado }).then((r) => r.data),
  eliminar: (id) => api.delete(`/tickets/${id}`),
};

export const usersApi = {
  listar: (filtros = {}) => api.get('/users', { params: limpiar(filtros) }).then((r) => r.data),
  crear: (datos) => api.post('/users', datos).then((r) => r.data),
  perfil: () => api.get('/users/me').then((r) => r.data),
};

export const jobsApi = {
  listar: (filtros = {}) => api.get('/jobs', { params: limpiar(filtros) }).then((r) => r.data),
  resumen: () => api.get('/jobs/resumen').then((r) => r.data),
  obtener: (id) => api.get(`/jobs/${encodeURIComponent(id)}`).then((r) => r.data),
  reintentar: (id) => api.post(`/jobs/${encodeURIComponent(id)}/reintentar`).then((r) => r.data),
  simularFallo: (activo) => api.post('/jobs/simular-fallo', { activo }).then((r) => r.data),
};

// Quita filtros vacíos: Joi rechaza estado="" porque no es un valor válido
function limpiar(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v != null));
}
