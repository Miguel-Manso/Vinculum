const router = require('express').Router();
const auth   = require('../middleware/auth.middleware');
const ctrl   = require('../controllers/chatbot.controller');

// ============================================================================
// Limite de uso do assistente por usuário
//
// Todas as perguntas usam a mesma chave de IA do servidor, que tem cota
// compartilhada. O limite evita que uma pessoa (ou um script) esgote a cota
// de todos. Valores ajustáveis no backend/.env:
//   CHAT_LIMITE_MINUTO (padrão 10)  e  CHAT_LIMITE_DIA (padrão 150)
//
// Fica em memória: zera se o servidor reiniciar e vale por instância — o
// suficiente para um único servidor.
// ============================================================================
const LIMITE_MINUTO = parseInt(process.env.CHAT_LIMITE_MINUTO, 10) || 10;
const LIMITE_DIA    = parseInt(process.env.CHAT_LIMITE_DIA, 10) || 150;
const MINUTO_MS = 60 * 1000;

const usoPorUsuario = new Map(); // id → { recentes: number[], dia: 'YYYY-MM-DD', totalDia: number }

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function limitarUso(req, res, next) {
  const chave = String(req.usuario?.id ?? req.ip);
  const agora = Date.now();
  const uso = usoPorUsuario.get(chave) || { recentes: [], dia: hoje(), totalDia: 0 };

  if (uso.dia !== hoje()) { uso.dia = hoje(); uso.totalDia = 0; }
  uso.recentes = uso.recentes.filter(t => agora - t < MINUTO_MS);

  if (uso.totalDia >= LIMITE_DIA) {
    usoPorUsuario.set(chave, uso);
    return res.status(429).json({
      error: `Você atingiu o limite de ${LIMITE_DIA} perguntas por dia ao assistente. Ele volta a responder amanhã.`,
    });
  }

  if (uso.recentes.length >= LIMITE_MINUTO) {
    const espera = Math.max(1, Math.ceil((MINUTO_MS - (agora - uso.recentes[0])) / 1000));
    usoPorUsuario.set(chave, uso);
    res.set('Retry-After', String(espera));
    return res.status(429).json({
      error: `Muitas perguntas em pouco tempo. Aguarde ${espera} segundo${espera === 1 ? '' : 's'} e tente de novo.`,
    });
  }

  uso.recentes.push(agora);
  uso.totalDia += 1;
  usoPorUsuario.set(chave, uso);
  next();
}

// Limpeza periódica para o mapa não crescer indefinidamente
setInterval(() => {
  const agora = Date.now();
  const dia = hoje();
  for (const [chave, uso] of usoPorUsuario) {
    const ativo = uso.recentes.some(t => agora - t < MINUTO_MS);
    if (!ativo && uso.dia !== dia) usoPorUsuario.delete(chave);
  }
}, 10 * MINUTO_MS).unref();

// POST /api/chatbot — exige login (o chat só aparece para quem está logado)
router.post('/', auth, limitarUso, ctrl.conversar);

module.exports = router;
module.exports._interno = { limitarUso, usoPorUsuario, LIMITE_MINUTO, LIMITE_DIA };
