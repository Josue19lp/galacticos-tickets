const AppError = require('../utils/AppError');
const { asignacionQueue } = require('../queues/asignacion.queue');
const { notificacionQueue } = require('../queues/notificacion.queue');
const jobLogsRepo = require('../repositories/jobLogs.repository');

const COLAS = { asignacion: asignacionQueue, notificacion: notificacionQueue };
const ESTADOS = ['waiting', 'prioritized', 'active', 'delayed', 'completed', 'failed'];

// Formato uniforme para el frontend
async function formatear(job, cola) {
  return {
    id: job.id,
    cola,
    nombre: job.name,
    estado: await job.getState(),
    datos: job.data,
    prioridad: job.opts.priority,
    intentos: job.attemptsMade,
    maxIntentos: job.opts.attempts,
    resultado: job.returnvalue ?? null,
    error: job.failedReason ?? null,
    creado: new Date(job.timestamp),
    procesado: job.processedOn ? new Date(job.processedOn) : null,
    finalizado: job.finishedOn ? new Date(job.finishedOn) : null,
  };
}

async function listar({ cola, estado, limite = 50 }) {
  const nombres = cola ? [cola] : Object.keys(COLAS);
  const estados = estado ? [estado] : ESTADOS;
  const resultado = [];

  for (const nombre of nombres) {
    const jobs = await COLAS[nombre].getJobs(estados, 0, limite - 1, false);
    for (const job of jobs.filter(Boolean)) resultado.push(await formatear(job, nombre));
  }
  resultado.sort((a, b) => b.creado - a.creado);
  return resultado.slice(0, limite);
}

async function resumen() {
  const out = {};
  for (const [nombre, q] of Object.entries(COLAS)) out[nombre] = await q.getJobCounts(...ESTADOS);
  return out;
}

// Los ids tienen el prefijo de la cola (asignacion-12-..., notificacion-12-...)
async function obtener(id) {
  for (const [nombre, q] of Object.entries(COLAS)) {
    const job = await q.getJob(id);
    if (job) return { ...(await formatear(job, nombre)), bitacora: await jobLogsRepo.porJob(id) };
  }
  throw new AppError(404, 'Trabajo no encontrado');
}

// Reintento manual de un job fallido (además de hacerlo desde bull-board)
async function reintentar(id) {
  for (const q of Object.values(COLAS)) {
    const job = await q.getJob(id);
    if (!job) continue;
    if ((await job.getState()) !== 'failed') throw new AppError(409, 'Solo se reintentan trabajos fallidos');
    await job.retry();
    return obtener(id);
  }
  throw new AppError(404, 'Trabajo no encontrado');
}

module.exports = { listar, resumen, obtener, reintentar, COLAS };
