const router = require('express').Router();
const auth   = require('../middleware/auth.middleware');
const ctrl   = require('../controllers/historico.controller');

router.get('/tarefa/:tarefa_id', auth, ctrl.listarPorTarefa);
router.post('/',                 auth, ctrl.registrar);

module.exports = router;
