const { Router } = require('express');
const ctrl = require('../controllers/auth.controller');
const validar = require('../middlewares/validar');
const auth = require('../middlewares/auth');
const schemas = require('../validators/auth.validator');

const router = Router();

router.post('/register', validar(schemas.registro), ctrl.register);
router.post('/login', validar(schemas.login), ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', auth, ctrl.logout);

module.exports = router;
