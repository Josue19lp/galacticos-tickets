// Proceso independiente: npm run worker
const { Worker } = require('bullmq');
const { connection } = require('../config/redis');
const ticketsRepo = require('../repositories/tickets.repository');
const usersRepo = require('../repositories/users.repository');
const jobLogsRepo = require('../repositories/jobLogs.repository');
const { encolarNotificacion } = require('../queues/notificacion.queue');
const mail = require('../services/mail.service');
const db = require('../config/db');

const ETIQUETA_ESTADO = { pendiente: 'Pendiente', progreso: 'En progreso', resuelto: 'Resuelto' };

// ---------- Cola 1: asignación automática ----------
async function procesarAsignacion(job) {
  const { ticketId } = job.data;
  const ticket = await ticketsRepo.buscarPorId(ticketId);
  if (!ticket) return { omitido: 'El ticket ya no existe' };
  if (ticket.tecnico_id) return { omitido: `Ya estaba asignado al técnico ${ticket.tecnico_id}` };

  const tecnico = await usersRepo.tecnicoConMenosCarga();
  if (!tecnico) throw new Error('No hay técnicos registrados para asignar'); // → reintento

  const asignado = await ticketsRepo.asignarSiLibre(ticketId, tecnico.id);
  if (!asignado) return { omitido: 'Otro proceso asignó el ticket primero' };

  const notif = await encolarNotificacion({
    ticketId, tipo: 'asignacion', prioridad: ticket.prioridad,
  });
  await jobLogsRepo.registrar({
    jobId: notif.id, cola: 'notificacion', ticketId, estado: 'encolado', intentos: 0,
  });

  return { tecnicoId: tecnico.id, tecnico: tecnico.nombre, cargaPrevia: tecnico.abiertos };
}

// ---------- Cola 2: notificaciones por correo ----------
function plantilla(ticket, { tipo, estadoAnterior, estadoNuevo }) {
  const cabecera = `<h2>Ticket #${ticket.id}: ${ticket.titulo}</h2>
    <p><b>Prioridad:</b> ${ticket.prioridad} · <b>Estado:</b> ${ETIQUETA_ESTADO[ticket.estado]}</p>`;
  if (tipo === 'asignacion') {
    return {
      asunto: `[Ticket #${ticket.id}] Asignado a ${ticket.tecnico_nombre}`,
      html: `${cabecera}<p>El ticket fue asignado al técnico <b>${ticket.tecnico_nombre}</b>.</p>`,
    };
  }
  return {
    asunto: `[Ticket #${ticket.id}] Cambió a "${ETIQUETA_ESTADO[estadoNuevo]}"`,
    html: `${cabecera}<p>El estado cambió de <b>${ETIQUETA_ESTADO[estadoAnterior]}</b>
      a <b>${ETIQUETA_ESTADO[estadoNuevo]}</b>.</p>`,
  };
}

async function procesarNotificacion(job) {
  const ticket = await ticketsRepo.buscarPorId(job.data.ticketId);
  if (!ticket) return { omitido: 'El ticket ya no existe' };

  const para = [ticket.cliente_email, ticket.tecnico_email].filter(Boolean);
  const { asunto, html } = plantilla(ticket, job.data);
  const info = await mail.enviar({ para, asunto, html }); // si falla, BullMQ reintenta
  if (info.preview) console.log(`   ✉ Vista previa: ${info.preview}`);
  return { para, asunto, ...info };
}

// ---------- Arranque de workers y bitácora ----------
function crearWorker(nombre, procesador) {
  const worker = new Worker(nombre, procesador, { connection, concurrency: 5 });

  worker.on('completed', async (job, resultado) => {
    console.log(`✔ [${nombre}] ${job.id} completado`);
    await jobLogsRepo.registrar({
      jobId: job.id, cola: nombre, ticketId: job.data.ticketId,
      estado: 'completado', intentos: job.attemptsMade, detalle: JSON.stringify(resultado),
    }).catch((e) => console.error('No se pudo registrar en job_logs:', e.message));
  });

  worker.on('failed', async (job, err) => {
    if (!job) return;
    const definitivo = job.attemptsMade >= (job.opts.attempts || 1);
    console.warn(`✖ [${nombre}] ${job.id} intento ${job.attemptsMade} falló: ${err.message}`);
    await jobLogsRepo.registrar({
      jobId: job.id, cola: nombre, ticketId: job.data.ticketId,
      estado: definitivo ? 'fallido' : 'reintentando', intentos: job.attemptsMade, detalle: err.message,
    }).catch((e) => console.error('No se pudo registrar en job_logs:', e.message));
  });

  worker.on('error', (err) => console.error(`Error en worker ${nombre}:`, err.message));
  return worker;
}

const workers = [
  crearWorker('asignacion', procesarAsignacion),
  crearWorker('notificacion', procesarNotificacion),
];
console.log('👷 Worker escuchando las colas: asignacion, notificacion');

async function apagar() {
  console.log('Cerrando worker...');
  await Promise.all(workers.map((w) => w.close()));
  await db.pool.end();
  process.exit(0);
}
process.on('SIGINT', apagar);
process.on('SIGTERM', apagar);
