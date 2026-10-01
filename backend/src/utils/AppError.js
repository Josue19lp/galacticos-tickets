// Error controlado: su mensaje sí se muestra al cliente
class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
module.exports = AppError;
