// ============================================================================
// Configurações de segurança do backend
//
// JWT_SECRET  → "assinatura" dos logins. Quem souber esse texto consegue
//               fabricar um login de qualquer pessoa (inclusive administrador).
//               Por isso: nunca use um texto que esteja no GitHub e, em
//               produção, o servidor NÃO liga sem uma chave forte.
//               Gere uma com:  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
//
// CORS_ORIGINS → endereços (separados por vírgula) que podem chamar a API,
//               além dos padrões abaixo. Ex.: https://vinculum.com.br,https://www.vinculum.com.br
// ============================================================================

// Textos que já apareceram no código/exemplos públicos — nunca servem como chave
const SEGREDOS_PUBLICOS = new Set([
  'vinculum_default_secret_key',
  'vinculum_super_secret_jwt_key_2026',
  'shrek',
  'segredo',
  'secret',
]);

const TAMANHO_MINIMO_SEGREDO = 32;

/** Rodando publicado? (o Render define RENDER=true automaticamente) */
function emProducao() {
  return process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
}

function problemaNoSegredo(segredo) {
  if (!segredo) return 'JWT_SECRET não está definido';
  if (SEGREDOS_PUBLICOS.has(segredo.trim())) return 'JWT_SECRET usa um texto público (que está no GitHub)';
  if (segredo.trim().length < TAMANHO_MINIMO_SEGREDO) return `JWT_SECRET é curto demais (mínimo ${TAMANHO_MINIMO_SEGREDO} caracteres)`;
  return null;
}

let avisoMostrado = false;

/**
 * Valida o JWT_SECRET na inicialização.
 * Produção: encerra o processo se a chave for fraca/ausente (melhor fora do ar
 * do que aceitando logins forjados). Desenvolvimento: só avisa.
 */
function validarSegredoNaInicializacao() {
  const problema = problemaNoSegredo(process.env.JWT_SECRET);
  if (!problema) return;

  const comoGerar = 'Gere uma chave com: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"';
  if (emProducao()) {
    console.error(`\n❌ ${problema}. O servidor não vai iniciar em produção sem uma chave forte.\n   ${comoGerar}\n   e cadastre-a como JWT_SECRET nas variáveis de ambiente da hospedagem.\n`);
    process.exit(1);
  }
  if (!avisoMostrado) {
    avisoMostrado = true;
    console.warn(`⚠️  ${problema}. Tudo bem para testar localmente, mas troque antes de publicar.\n   ${comoGerar}`);
  }
}

/** Chave usada para assinar e verificar os logins. */
function obterJwtSecret() {
  const segredo = (process.env.JWT_SECRET || '').trim();
  if (segredo) return segredo;
  // Só chega aqui em desenvolvimento (em produção o servidor nem inicia sem a chave)
  return 'chave-apenas-para-desenvolvimento-local-nao-use-em-producao';
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
const ORIGENS_PADRAO = [
  'https://vinculum-one.vercel.app',
  'http://localhost:5173',  // vite dev
  'http://localhost:4173',  // vite preview
];
// Pré-visualizações automáticas da Vercel deste projeto (ex.: vinculum-one-git-xyz-....vercel.app)
const PREVIEW_VERCEL = /^https:\/\/vinculum-one(-[a-z0-9-]+)?\.vercel\.app$/i;

function origensPermitidas() {
  const extras = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(o => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return new Set([...ORIGENS_PADRAO, ...extras]);
}

/** Opções para o pacote `cors`: libera só o site do Vinculum. */
function opcoesCors() {
  const permitidas = origensPermitidas();
  return {
    origin(origem, callback) {
      // Sem Origin = chamada que não vem de navegador (monitoramento, curl, servidor) → ok
      if (!origem || permitidas.has(origem) || PREVIEW_VERCEL.test(origem)) return callback(null, true);
      return callback(null, false); // navegador bloqueia a resposta para sites desconhecidos
    },
  };
}

module.exports = { obterJwtSecret, validarSegredoNaInicializacao, opcoesCors, origensPermitidas, emProducao };
