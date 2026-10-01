const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { jwt: cfg } = require('../config/env');

const firmarAccess = (user) =>
  jwt.sign({ sub: user.id, rol: user.rol, nombre: user.nombre }, cfg.accessSecret, {
    expiresIn: cfg.accessExpires,
  });

// jti aleatorio para que cada refresh token sea único aunque se generen en el mismo segundo
const firmarRefresh = (user) =>
  jwt.sign({ sub: user.id, rol: user.rol, jti: crypto.randomUUID() }, cfg.refreshSecret, {
    expiresIn: cfg.refreshExpires,
  });

const verificarAccess = (token) => jwt.verify(token, cfg.accessSecret);
const verificarRefresh = (token) => jwt.verify(token, cfg.refreshSecret);

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = { firmarAccess, firmarRefresh, verificarAccess, verificarRefresh, hashToken };
