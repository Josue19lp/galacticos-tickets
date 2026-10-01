const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { asignacionQueue } = require('../queues/asignacion.queue');
const { notificacionQueue } = require('../queues/notificacion.queue');

const BASE = '/admin/queues';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath(BASE);

createBullBoard({
  queues: [new BullMQAdapter(asignacionQueue), new BullMQAdapter(notificacionQueue)],
  serverAdapter,
});

module.exports = { BASE, router: serverAdapter.getRouter() };
