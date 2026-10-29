// Configuración común de reintentos (sección 7 del documento de arquitectura)
module.exports = {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }, // 3 intentos: el 2.º a los 2 s y el 3.º a los 4 s
    removeOnComplete: false,
    removeOnFail: false,
  },
  PRIORIDAD: { alta: 1, media: 2, baja: 3 }, // en BullMQ, menor número = más urgente
};
