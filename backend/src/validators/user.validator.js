const Joi = require('joi');

// El admin crea técnicos y otros admins (el registro público solo crea clientes)
const crear = Joi.object({
  nombre: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(150).required(),
  password: Joi.string().min(8).max(72).required(),
  rol: Joi.string().valid('admin', 'tecnico', 'cliente').required(),
});

const filtros = Joi.object({ rol: Joi.string().valid('admin', 'tecnico', 'cliente') });

module.exports = { crear, filtros };
