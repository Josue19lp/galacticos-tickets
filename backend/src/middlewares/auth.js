const AppError = require('../utils/AppError');
const { verificarAccess } = require('../utils/tokens');

// Verifica el access token enviado como "Authorization: Bearer <token>"
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');
  if (tipo !== 'Bearer' || !token) return next(new AppError(401, 'Token no proporcionado'));

  try {
    const payload = verificarAccess(token);
    req.user = { id: payload.sub, rol: payload.rol, nombre: payload.nombre };
    next();
  } catch (err) {
    // El frontend usa este código para saber que debe llamar a /api/auth/refresh
    const mensaje = err.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido';
    next(new AppError(401, mensaje));
  }
}

module.exports = auth;
