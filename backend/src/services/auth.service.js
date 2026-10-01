const bcrypt = require('bcrypt');
const AppError = require('../utils/AppError');
const usersRepo = require('../repositories/users.repository');
const tokensRepo = require('../repositories/refreshTokens.repository');
const tokens = require('../utils/tokens');

const RONDAS_SAL = 10;

async function registrar({ nombre, email, password }) {
  if (await usersRepo.buscarPorEmail(email)) throw new AppError(409, 'El correo ya está registrado');
  const passwordHash = await bcrypt.hash(password, RONDAS_SAL);
  return usersRepo.crear({ nombre, email, passwordHash, rol: 'cliente' });
}

// Genera el par de tokens y guarda el hash del refresh en la base de datos
async function emitirTokens(user) {
  const accessToken = tokens.firmarAccess(user);
  const refreshToken = tokens.firmarRefresh(user);
  const { exp } = tokens.verificarRefresh(refreshToken);
  const expiresAt = new Date(exp * 1000);
  await tokensRepo.guardar(user.id, tokens.hashToken(refreshToken), expiresAt);
  return { accessToken, refreshToken, refreshExpiresAt: expiresAt };
}

async function login({ email, password }) {
  const user = await usersRepo.buscarPorEmail(email);
  // Mismo mensaje en ambos casos para no revelar qué correos existen
  const valido = user && (await bcrypt.compare(password, user.password_hash));
  if (!valido) throw new AppError(401, 'Credenciales incorrectas');

  const { password_hash, ...publico } = user;
  return { user: publico, ...(await emitirTokens(publico)) };
}

// Rotación: el refresh usado se revoca y se entrega uno nuevo
async function refrescar(refreshToken) {
  if (!refreshToken) throw new AppError(401, 'Refresh token no proporcionado');

  let payload;
  try {
    payload = tokens.verificarRefresh(refreshToken);
  } catch {
    throw new AppError(401, 'Refresh token inválido o expirado');
  }

  const hash = tokens.hashToken(refreshToken);
  if (!(await tokensRepo.buscarVigente(hash))) throw new AppError(401, 'Refresh token revocado');

  const user = await usersRepo.buscarPorId(payload.sub);
  if (!user) throw new AppError(401, 'Usuario no existe');

  await tokensRepo.revocar(hash);
  return { user, ...(await emitirTokens(user)) };
}

async function logout(refreshToken) {
  if (refreshToken) await tokensRepo.revocar(tokens.hashToken(refreshToken));
}

module.exports = { registrar, login, refrescar, logout, RONDAS_SAL };
