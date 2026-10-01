const { Queue } = require('bullmq');
const { connection } = require('../config/redis');
const { defaultJobOptions, PRIORIDAD } = require('./opciones');

const NOMBRE = 'asignacion';
const asignacionQueue = new Queue(NOMBRE, { connection, defaultJobOptions });

function encolarAsignacion(ticket) {
  return asignacionQueue.add(
    'asignar-tecnico',
    { ticketId: ticket.id },
    { priority: PRIORIDAD[ticket.prioridad], jobId: `asignacion-${ticket.id}-${Date.now()}` }
  );
}

module.exports = { NOMBRE, asignacionQueue, encolarAsignacion };
