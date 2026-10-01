const AppError = require('../utils/AppError');

// Valida req[origen] con un esquema Joi y reemplaza los datos por los ya limpios
const validar = (schema, origen = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[origen], { abortEarly: false, stripUnknown: true });
  if (error) {
    const err = new AppError(400, 'Datos inválidos');
    err.detalles = error.details.map((d) => ({ campo: d.path.join('.'), mensaje: d.message }));
    return next(err);
  }
  if (origen === 'query') Object.defineProperty(req, 'query', { value, writable: true });
  else req[origen] = value;
  next();
};

module.exports = validar;
