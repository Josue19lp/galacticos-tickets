const Joi = require('joi');

const filtros = Joi.object({
  cola: Joi.string().valid('asignacion', 'notificacion'),
  estado: Joi.string().valid('waiting', 'active', 'completed', 'failed', 'delayed', 'prioritized'),
  limite: Joi.number().integer().min(1).max(200).default(50),
});

module.exports = { filtros };
