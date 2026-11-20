const router = require('express').Router();
const { login } = require('../controllers/auth.controller');

// O Vinculum é um sistema fechado: não existe cadastro público.
// Novas contas são criadas por um administrador logado em "Equipe e Acessos"
// (POST /api/usuarios), que também define o perfil e os setores da pessoa.
router.post('/login', login);

module.exports = router;
