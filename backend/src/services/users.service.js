const bcrypt = require('bcrypt');
const AppError = require('../utils/AppError');
const usersRepo = require('../repositories/users.repository');
const { RONDAS_SAL } = require('./auth.service');

const listar = (filtros) => usersRepo.listar(filtros);

async function crear({ nombre, email, password, rol }) {
  if (await usersRepo.buscarPorEmail(email)) throw new AppError(409, 'El correo ya está registrado');
  const passwordHash = await bcrypt.hash(password, RONDAS_SAL);
  return usersRepo.crear({ nombre, email, passwordHash, rol });
}

async function perfil(id) {
  const user = await usersRepo.buscarPorId(id);
  if (!user) throw new AppError(404, 'Usuario no encontrado');
  return user;
}

module.exports = { listar, crear, perfil };
