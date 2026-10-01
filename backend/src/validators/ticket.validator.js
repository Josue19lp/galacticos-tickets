const Joi = require('joi');

const PRIORIDADES = ['alta', 'media', 'baja'];
const ESTADOS = ['pendiente', 'progreso', 'resuelto'];

const crear = Joi.object({
  titulo: Joi.string().trim().min(5).max(150).required(),
  descripcion: Joi.string().trim().min(10).max(5000).required(),
  prioridad: Joi.string().valid(...PRIORIDADES).required(),
});

const editar = Joi.object({
  titulo: Joi.string().trim().min(5).max(150),
  descripcion: Joi.string().trim().min(10).max(5000),
  prioridad: Joi.string().valid(...PRIORIDADES),
  tecnico_id: Joi.number().integer().positive().allow(null), // solo admin (se valida en el service)
}).min(1);

const cambiarEstado = Joi.object({
  estado: Joi.string().valid(...ESTADOS).required(),
});

const filtros = Joi.object({
  estado: Joi.string().valid(...ESTADOS),
  prioridad: Joi.string().valid(...PRIORIDADES),
});

const idParam = Joi.object({ id: Joi.number().integer().positive().required() });

module.exports = { crear, editar, cambiarEstado, filtros, idParam, PRIORIDADES, ESTADOS };
