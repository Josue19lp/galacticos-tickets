// Catálogos y utilidades de presentación compartidas por las páginas

export const ESTADOS = [
  { valor: 'pendiente', etiqueta: 'Pendiente', color: 'secondary' },
  { valor: 'progreso', etiqueta: 'En progreso', color: 'primary' },
  { valor: 'resuelto', etiqueta: 'Resuelto', color: 'success' },
];

export const PRIORIDADES = [
  { valor: 'alta', etiqueta: 'Alta', color: 'danger' },
  { valor: 'media', etiqueta: 'Media', color: 'warning' },
  { valor: 'baja', etiqueta: 'Baja', color: 'info' },
];

export const ROLES = {
  admin: { etiqueta: 'Administrador', color: 'dark' },
  tecnico: { etiqueta: 'Técnico', color: 'primary' },
  cliente: { etiqueta: 'Cliente', color: 'secondary' },
};

// Estados de BullMQ y estados de la bitácora (job_logs)
export const ESTADOS_JOB = {
  waiting: { etiqueta: 'En espera', color: 'secondary' },
  prioritized: { etiqueta: 'Priorizado', color: 'info' },
  active: { etiqueta: 'Procesando', color: 'primary' },
  delayed: { etiqueta: 'Esperando reintento', color: 'warning' },
  completed: { etiqueta: 'Completado', color: 'success' },
  failed: { etiqueta: 'Fallido', color: 'danger' },
  encolado: { etiqueta: 'Encolado', color: 'secondary' },
  reintentando: { etiqueta: 'Reintentando', color: 'warning' },
  completado: { etiqueta: 'Completado', color: 'success' },
  fallido: { etiqueta: 'Fallido', color: 'danger' },
};

// BullMQ: 1 = alta, 2 = media, 3 = baja
export const PRIORIDAD_JOB = { 1: 'alta', 2: 'media', 3: 'baja' };

export const estadoInfo = (v) => ESTADOS.find((e) => e.valor === v) || { etiqueta: v, color: 'light' };
export const prioridadInfo = (v) =>
  PRIORIDADES.find((p) => p.valor === v) || { etiqueta: v, color: 'light' };

const fmtFecha = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' });
export const fecha = (valor) => (valor ? fmtFecha.format(new Date(valor)) : '—');

const fmtRelativo = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
export function haceCuanto(valor) {
  if (!valor) return '—';
  const seg = Math.round((new Date(valor) - Date.now()) / 1000);
  const abs = Math.abs(seg);
  if (abs < 60) return fmtRelativo.format(seg, 'second');
  if (abs < 3600) return fmtRelativo.format(Math.round(seg / 60), 'minute');
  if (abs < 86400) return fmtRelativo.format(Math.round(seg / 3600), 'hour');
  return fmtRelativo.format(Math.round(seg / 86400), 'day');
}

// Transiciones que se ofrecen como botones en las tarjetas y el detalle
export const TRANSICIONES = {
  pendiente: [{ a: 'progreso', texto: 'Iniciar' }],
  progreso: [
    { a: 'pendiente', texto: 'Regresar a pendiente' },
    { a: 'resuelto', texto: 'Marcar resuelto' },
  ],
  resuelto: [{ a: 'progreso', texto: 'Reabrir' }],
};

// ---- Permisos (espejo de las reglas del backend, solo para mostrar u ocultar botones) ----
export const puedeCambiarEstado = (user, t) =>
  user.rol === 'admin' || (user.rol === 'tecnico' && t.tecnico_id === user.id);

export function puedeEditar(user, t) {
  if (user.rol === 'admin') return true;
  if (user.rol === 'cliente') return t.cliente_id === user.id && t.estado !== 'resuelto';
  return t.tecnico_id === user.id;
}

export const puedeEliminar = (user, t) =>
  user.rol === 'admin' || (user.rol === 'cliente' && t.cliente_id === user.id && t.estado === 'pendiente');

// Color estable por persona: el mismo nombre siempre produce el mismo tono
export function colorPersona(nombre = '') {
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) % 360;
  return { background: `hsl(${h} 75% 92%)`, color: `hsl(${h} 55% 30%)` };
}

export const iniciales = (nombre = '') =>
  nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

