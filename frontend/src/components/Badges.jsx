import { ESTADOS_JOB, ROLES, estadoInfo, prioridadInfo } from '../utils/formato';

export function BadgePrioridad({ valor }) {
  const p = prioridadInfo(valor);
  return <span className={`badge prioridad prioridad-${valor}`}>{p.etiqueta}</span>;
}

export function BadgeEstado({ valor }) {
  const e = estadoInfo(valor);
  return <span className={`badge text-bg-${e.color}`}>{e.etiqueta}</span>;
}

export function BadgeRol({ valor }) {
  const r = ROLES[valor] || { etiqueta: valor, color: 'light' };
  return <span className={`badge text-bg-${r.color}`}>{r.etiqueta}</span>;
}

export function BadgeJob({ valor }) {
  const j = ESTADOS_JOB[valor] || { etiqueta: valor, color: 'light' };
  return <span className={`badge text-bg-${j.color}`}>{j.etiqueta}</span>;
}
