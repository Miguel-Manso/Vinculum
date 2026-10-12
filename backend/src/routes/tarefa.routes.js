const router = require('express').Router();
const auth   = require('../middleware/auth.middleware');
const ctrl   = require('../controllers/tarefa.controller');

router.get('/',                auth, ctrl.listarTodas);
router.get('/etapa/:etapa_id', auth, ctrl.listarPorEtapa);
router.get('/:id',             auth, ctrl.buscarPorId);
router.post('/',               auth, ctrl.criar);
router.put('/:id',             auth, ctrl.editar);
router.patch('/:id/mover',     auth, ctrl.moverEtapa);
router.delete('/:id',          auth, ctrl.excluir);

module.exports = router;
