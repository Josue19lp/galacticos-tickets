const usersService = require('../services/users.service');

const listar = async (req, res) => res.json(await usersService.listar(req.query));
const perfil = async (req, res) => res.json(await usersService.perfil(req.user.id));

async function crear(req, res) {
  res.status(201).json(await usersService.crear(req.body));
}

module.exports = { listar, perfil, crear };
