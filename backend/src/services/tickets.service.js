const AppError = require('../utils/AppError');
const ticketsRepo = require('../repositories/tickets.repository');
const usersRepo = require('../repositories/users.repository');
const jobLogsRepo = require('../repositories/jobLogs.repository');
const { encolarAsignacion } = require('../queues/asignacion.queue');
const { encolarNotificacion } = require('../queues/notificacion.queue');

// ---- Reglas de permisos (sección 6 del documento) ----
function puedeVer(user, t) {
  if (user.rol === 'admin') return true;
  if (user.rol === 'cliente') return t.cliente_id === user.id;
  return t.tecnico_id === user.id || t.tecnico_id === null; // técnico
}

function puedeEditar(user, t) {
  if (user.rol === 'admin') return true;
  if (user.rol === 'cliente') return t.cliente_id === user.id;
  return t.tecnico_id === user.id;
}

async function obtenerVisible(user, id) {
  const ticket = await ticketsRepo.buscarPorId(id);
  // 404 también cuando no tiene permiso, para no revelar que el ticket existe
  if (!ticket || !puedeVer(user, ticket)) throw new AppError(404, 'Ticket no encontrado');
  return ticket;
}

// Deja constancia en la bitácora de que el trabajo fue encolado
async function registrarEncolado(job, cola, ticketId) {
  await jobLogsRepo.registrar({ jobId: job.id, cola, ticketId, estado: 'encolado', intentos: 0 });
}

// ---- Casos de uso ----
const listar = (user, filtros) => ticketsRepo.listar(user, filtros);

async function obtener(user, id) {
  const ticket = await obtenerVisible(user, id);
  const historial = await jobLogsRepo.porTicket(id);
  return { ...ticket, historial };
}

async function crear(user, datos) {
  const ticket = await ticketsRepo.crear({ ...datos, clienteId: user.id });
  const job = await encolarAsignacion(ticket);
  await registrarEncolado(job, 'asignacion', ticket.id);
  return { ticket: await ticketsRepo.buscarPorId(ticket.id), jobId: job.id };
}

async function editar(user, id, cambios) {
  const ticket = await obtenerVisible(user, id);
  if (!puedeEditar(user, ticket)) throw new AppError(403, 'No puedes editar este ticket');

  if (cambios.tecnico_id !== undefined) {
    if (user.rol !== 'admin') throw new AppError(403, 'Solo el admin puede reasignar técnicos');
    if (cambios.tecnico_id !== null) {
      const tecnico = await usersRepo.buscarPorId(cambios.tecnico_id);
      if (!tecnico || tecnico.rol !== 'tecnico') throw new AppError(400, 'El técnico no existe');
    }
  }
  if (user.rol === 'cliente' && ticket.estado === 'resuelto') {
    throw new AppError(409, 'No se puede editar un ticket resuelto');
  }

  const actualizado = await ticketsRepo.actualizar(id, cambios);

  // Reasignación manual del admin → avisar al nuevo técnico
  if (cambios.tecnico_id && cambios.tecnico_id !== ticket.tecnico_id) {
    const job = await encolarNotificacion({
      ticketId: id, tipo: 'asignacion', prioridad: actualizado.prioridad,
    });
    await registrarEncolado(job, 'notificacion', id);
  }
  return actualizado;
}

async function cambiarEstado(user, id, estado) {
  const ticket = await obtenerVisible(user, id);
  if (user.rol === 'tecnico' && ticket.tecnico_id !== user.id) {
    throw new AppError(403, 'Solo puedes cambiar el estado de tus tickets asignados');
  }
  if (ticket.estado === estado) throw new AppError(409, `El ticket ya está en estado "${estado}"`);

  const actualizado = await ticketsRepo.actualizar(id, { estado });
  const job = await encolarNotificacion({
    ticketId: id, tipo: 'estado', prioridad: actualizado.prioridad,
    estadoAnterior: ticket.estado, estadoNuevo: estado,
  });
  await registrarEncolado(job, 'notificacion', id);
  return { ticket: actualizado, jobId: job.id };
}

async function eliminar(user, id) {
  const ticket = await obtenerVisible(user, id);
  if (user.rol === 'cliente') {
    if (ticket.cliente_id !== user.id) throw new AppError(403, 'No puedes eliminar este ticket');
    if (ticket.estado !== 'pendiente') {
      throw new AppError(409, 'Solo puedes eliminar tickets en estado pendiente');
    }
  } else if (user.rol !== 'admin') {
    throw new AppError(403, 'No tienes permiso para eliminar tickets');
  }
  await ticketsRepo.eliminar(id);
}

module.exports = { listar, obtener, crear, editar, cambiarEstado, eliminar };
