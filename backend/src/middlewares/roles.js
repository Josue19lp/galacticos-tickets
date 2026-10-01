const AppError = require('../utils/AppError');

// Uso: authorize('admin', 'tecnico')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError(401, 'No autenticado'));
  if (!roles.includes(req.user.rol)) return next(new AppError(403, 'No tienes permiso para esta acción'));
  next();
};

module.exports = authorize;
