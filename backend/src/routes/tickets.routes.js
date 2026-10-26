const { Router } = require('express');
const ctrl = require('../controllers/tickets.controller');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/roles');
const validar = require('../middlewares/validar');
const s = require('../validators/ticket.validator');

const router = Router();
router.use(auth);

router.get('/', validar(s.filtros, 'query'), ctrl.listar);
router.get('/:id', validar(s.idParam, 'params'), ctrl.obtener);
// Solo el cliente reporta incidencias: el ticket queda a su nombre (cliente_id)
router.post('/', authorize('cliente'), validar(s.crear), ctrl.crear);
router.put('/:id', validar(s.idParam, 'params'), validar(s.editar), ctrl.editar);
router.patch(
  '/:id/estado',
  authorize('tecnico', 'admin'),
  validar(s.idParam, 'params'),
  validar(s.cambiarEstado),
  ctrl.cambiarEstado
);
router.delete('/:id', authorize('cliente', 'admin'), validar(s.idParam, 'params'), ctrl.eliminar);

module.exports = router;
