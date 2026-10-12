const router = require('express').Router();
const auth   = require('../middleware/auth.middleware');
const ctrl   = require('../controllers/etapa.controller');

router.get('/processo/:processo_id', auth, ctrl.listarPorProcesso);
router.post('/',                     auth, ctrl.criar);
router.put('/reordenar',             auth, ctrl.reordenar);
router.put('/:id',                   auth, ctrl.editar);
router.delete('/:id',                auth, ctrl.excluir);

module.exports = router;
