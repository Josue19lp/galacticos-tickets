const authService = require('../services/auth.service');
const { isProd } = require('../config/env');

const COOKIE = 'refreshToken';

// path '/' para que bull-board (/admin/queues) también reciba la cookie en el navegador
const opcionesCookie = (expires) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  path: '/',
  expires,
});

async function register(req, res) {
  const user = await authService.registrar(req.body);
  res.status(201).json({ user });
}

async function login(req, res) {
  const { user, accessToken, refreshToken, refreshExpiresAt } = await authService.login(req.body);
  res.cookie(COOKIE, refreshToken, opcionesCookie(refreshExpiresAt));
  res.json({ user, accessToken });
}

async function refresh(req, res) {
  const { user, accessToken, refreshToken, refreshExpiresAt } =
    await authService.refrescar(req.cookies[COOKIE]);
  res.cookie(COOKIE, refreshToken, opcionesCookie(refreshExpiresAt));
  res.json({ user, accessToken });
}

async function logout(req, res) {
  await authService.logout(req.cookies[COOKIE]);
  res.clearCookie(COOKIE, { path: '/' });
  res.status(204).end();
}

module.exports = { register, login, refresh, logout, COOKIE };
