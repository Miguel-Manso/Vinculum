const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const ctrl   = require('../controllers/chatbot.controller');

// Middleware de autenticação opcional:
// Se houver token JWT válido, extrai o usuário para personalizar a conversa.
// Se não houver token ou o token estiver expirado, NÃO bloqueia o chat com erro 403,
// permitindo que o chatbot seja 100% gratuito e acessível sem interrupções.
function authOpcional(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) {
    try {
      req.usuario = jwt.verify(token, process.env.JWT_SECRET || 'shrek');
    } catch {
      // Token JWT do login expirou ou é inválido: continua como usuário padrão
      req.usuario = null;
    }
  }
  next();
}

// POST /api/chatbot - 100% gratuito, sem travas de token
router.post('/', authOpcional, ctrl.conversar);

module.exports = router;
