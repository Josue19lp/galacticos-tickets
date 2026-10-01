const ticketsService = require('../services/tickets.service');

const listar = async (req, res) => res.json(await ticketsService.listar(req.user, req.query));

const obtener = async (req, res) => res.json(await ticketsService.obtener(req.user, req.params.id));

async function crear(req, res) {
  const resultado = await ticketsService.crear(req.user, req.body);
  res.status(201).json(resultado);
}

const editar = async (req, res) =>
  res.json(await ticketsService.editar(req.user, req.params.id, req.body));

const cambiarEstado = async (req, res) =>
  res.json(await ticketsService.cambiarEstado(req.user, req.params.id, req.body.estado));

async function eliminar(req, res) {
  await ticketsService.eliminar(req.user, req.params.id);
  res.status(204).end();
}

module.exports = { listar, obtener, crear, editar, cambiarEstado, eliminar };
