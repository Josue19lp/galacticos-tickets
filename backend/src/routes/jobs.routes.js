const { Router } = require('express');
const ctrl = require('../controllers/jobs.controller');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/roles');
const validar = require('../middlewares/validar');
const s = require('../validators/job.validator');

const router = Router();
router.use(auth, authorize('tecnico', 'admin'));

router.get('/', validar(s.filtros, 'query'), ctrl.listar);
router.get('/resumen', ctrl.resumen);
router.get('/:id', ctrl.obtener);
router.post('/:id/reintentar', authorize('admin'), ctrl.reintentar);

module.exports = router;
