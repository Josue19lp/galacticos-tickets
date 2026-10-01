const { verificarRefresh } = require('../utils/tokens');

// bull-board se abre en el navegador, que no envía el header Authorization.
// Por eso aquí se valida la cookie httpOnly del refresh token y que el rol sea admin.
function soloAdminPorCookie(req, res, next) {
  try {
    const payload = verificarRefresh(req.cookies.refreshToken);
    if (payload.rol === 'admin') return next();
  } catch {
    /* sin cookie o inválida */
  }
  res.status(403).send('Acceso restringido: inicia sesión como admin en el sistema.');
}

module.exports = soloAdminPorCookie;
