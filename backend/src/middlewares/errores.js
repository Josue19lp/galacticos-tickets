const AppError = require('../utils/AppError');

function noEncontrado(req, res, next) {
  next(new AppError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

// Middleware central: nunca expone detalles internos al cliente
// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, req, res, next) {
  if (err instanceof AppError) {
    const body = { error: err.message };
    if (err.detalles) body.detalles = err.detalles;
    return res.status(err.status).json(body);
  }
  if (err.code === '23505') return res.status(409).json({ error: 'El registro ya existe' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON mal formado' });

  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { noEncontrado, manejadorErrores };
