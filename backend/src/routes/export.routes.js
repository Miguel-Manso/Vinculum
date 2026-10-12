const router = require('express').Router();
const auth   = require('../middleware/auth.middleware');
const { exportarCSV } = require('../controllers/export.controller');

router.get('/csv', auth, exportarCSV);

module.exports = router;
