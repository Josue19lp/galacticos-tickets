// Configuración común de reintentos (sección 7 del documento de arquitectura)
module.exports = {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }, // 2s, 4s, 8s
    removeOnComplete: false,
    removeOnFail: false,
  },
  PRIORIDAD: { alta: 1, media: 2, baja: 3 }, // en BullMQ, menor número = más urgente
};
