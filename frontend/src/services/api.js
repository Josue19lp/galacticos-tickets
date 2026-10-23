import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
// Origen del backend (sin /api), usado para abrir bull-board en /admin/queues
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

// El access token vive solo en memoria (no en localStorage) para reducir el riesgo de XSS.
// Al recargar la página se recupera llamando a /auth/refresh con la cookie httpOnly.
let accessToken = null;
let alExpirarSesion = null;

export const setAccessToken = (token) => {
  accessToken = token;
};
export const onSesionExpirada = (fn) => {
  alExpirarSesion = fn;
};

// withCredentials: true para que el navegador envíe y reciba la cookie del refresh token
const api = axios.create({ baseURL: API_URL, withCredentials: true });

// ---- Interceptor de petición: adjunta "Authorization: Bearer <access>" ----
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// ---- Renovación del access token ----
// El backend rota el refresh token en cada uso, así que si varias peticiones reciben 401
// al mismo tiempo deben compartir UNA sola llamada a /auth/refresh.
let refrescoEnCurso = null;

export function refrescarToken() {
  if (!refrescoEnCurso) {
    refrescoEnCurso = axios
      .post(`${API_URL}/auth/refresh`, null, { withCredentials: true })
      .then(({ data }) => {
        accessToken = data.accessToken;
        return data; // { user, accessToken }
      })
      .finally(() => {
        refrescoEnCurso = null;
      });
  }
  return refrescoEnCurso;
}

// Rutas donde un 401 NO significa "token expirado" (credenciales malas, refresh inválido, etc.)
const SIN_REINTENTO = ['/auth/login', '/auth/register', '/auth/refresh'];

// ---- Interceptor de respuesta: ante un 401, renueva el token y repite la petición ----
api.interceptors.response.use(
  (respuesta) => respuesta,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const excluida = SIN_REINTENTO.some((ruta) => original?.url?.includes(ruta));

    if (status === 401 && original && !original._reintentado && !excluida) {
      original._reintentado = true;
      try {
        await refrescarToken();
        return api(original); // el interceptor de petición pone el token nuevo
      } catch {
        accessToken = null;
        alExpirarSesion?.(); // el refresh también expiró → volver al login
      }
    }
    return Promise.reject(error);
  }
);

export default api;
