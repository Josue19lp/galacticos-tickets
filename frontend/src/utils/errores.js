import { API_URL } from '../services/api';

// Convierte un error de Axios en { mensaje, campos } para mostrarlo en pantalla.
// El backend responde: 400 { error, detalles: [{ campo, mensaje }] } o { error }.
export function extraerError(err) {
  if (!err.response) {
    return {
      mensaje: `No se pudo conectar con el servidor (${API_URL}). Verifica que la API esté corriendo.`,
      campos: {},
    };
  }
  const { error, detalles } = err.response.data || {};
  const campos = {};
  for (const d of detalles || []) campos[d.campo] = traducirJoi(d.mensaje);
  return { mensaje: error || 'Ocurrió un error inesperado', campos };
}

// Los mensajes de Joi vienen en inglés; se traducen los más comunes
function traducirJoi(msg) {
  return msg
    .replace(/^"[^"]+" /, '')
    .replace(/length must be at least (\d+) characters long/, 'debe tener al menos $1 caracteres')
    .replace(/length must be less than or equal to (\d+) characters long/, 'debe tener como máximo $1 caracteres')
    .replace('is not allowed to be empty', 'es obligatorio')
    .replace('is required', 'es obligatorio')
    .replace('must be a valid email', 'debe ser un correo válido')
    .replace(/must be one of .*/, 'tiene un valor no permitido');
}
