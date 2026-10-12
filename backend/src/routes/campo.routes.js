const router = require('express').Router();
const auth   = require('../middleware/auth.middleware');
const ctrl   = require('../controllers/campo.controller');

// Listar campos de um processo ou todos
router.get('/',                      auth, ctrl.listarTodos);
router.get('/processo/:processo_id', auth, ctrl.listarPorProcesso);

// Criar campo para um processo
router.post('/processo/:processo_id', auth, ctrl.criar);
router.post('/',                      auth, ctrl.criar);

// Editar e excluir campo específico
router.put('/:id',    auth, ctrl.editar);
router.delete('/:id', auth, ctrl.excluir);

module.exports = router;
