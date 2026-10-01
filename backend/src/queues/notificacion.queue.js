const { Queue } = require('bullmq');
const { connection } = require('../config/redis');
const { defaultJobOptions, PRIORIDAD } = require('./opciones');

const NOMBRE = 'notificacion';
const notificacionQueue = new Queue(NOMBRE, { connection, defaultJobOptions });

// tipo: 'asignacion' | 'estado'
function encolarNotificacion({ ticketId, tipo, prioridad, estadoAnterior, estadoNuevo }) {
  return notificacionQueue.add(
    `notificar-${tipo}`,
    { ticketId, tipo, estadoAnterior, estadoNuevo },
    {
      priority: PRIORIDAD[prioridad] || 2,
      jobId: `notificacion-${ticketId}-${tipo}-${Date.now()}`,
    }
  );
}

module.exports = { NOMBRE, notificacionQueue, encolarNotificacion };
