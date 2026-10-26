import { ESTADOS_JOB, ROLES, estadoInfo, prioridadInfo } from '../utils/formato';

// Todas las etiquetas comparten la misma forma (píldora suave) y cambian solo de color.
// Los colores se definen en index.css con las clases insignia-<tipo>-<valor>.
const Insignia = ({ clase, children }) => <span className={`badge insignia ${clase}`}>{children}</span>;

export const BadgePrioridad = ({ valor }) => (
  <Insignia clase={`insignia-prioridad-${valor}`}>{prioridadInfo(valor).etiqueta}</Insignia>
);

export const BadgeEstado = ({ valor }) => (
  <Insignia clase={`insignia-estado-${valor}`}>{estadoInfo(valor).etiqueta}</Insignia>
);

export const BadgeRol = ({ valor }) => (
  <Insignia clase={`insignia-rol-${valor}`}>{ROLES[valor]?.etiqueta || valor}</Insignia>
);

export const BadgeJob = ({ valor }) => (
  <Insignia clase={`insignia-job-${ESTADOS_JOB[valor]?.color || 'secondary'}`}>
    {ESTADOS_JOB[valor]?.etiqueta || valor}
  </Insignia>
);
