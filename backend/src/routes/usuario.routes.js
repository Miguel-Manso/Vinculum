const router = require('express').Router();
const auth   = require('../middleware/auth.middleware');
const ctrl   = require('../controllers/usuario.controller');

router.get('/',     auth, ctrl.listar);
router.post('/',    auth, ctrl.criar);
router.put('/:id',  auth, ctrl.editar);
router.delete('/:id', auth, ctrl.excluir);

module.exports = router;
