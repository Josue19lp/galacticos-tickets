const { Router } = require('express');
const ctrl = require('../controllers/users.controller');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/roles');
const validar = require('../middlewares/validar');
const s = require('../validators/user.validator');

const router = Router();
router.use(auth);

router.get('/me', ctrl.perfil);
router.get('/', authorize('admin'), validar(s.filtros, 'query'), ctrl.listar);
router.post('/', authorize('admin'), validar(s.crear), ctrl.crear);

module.exports = router;
