// ============================================================================
// Serviço de modelo de linguagem (LLM) do Vinculum IA
//
// Provedores suportados (escolhidos pelas variáveis do backend/.env):
//   - Claude (Anthropic) → ANTHROPIC_API_KEY  [opcional: ANTHROPIC_MODEL]
//   - Gemini (Google)    → GEMINI_API_KEY     [opcional: GEMINI_MODEL]
// Se as duas existirem, usa IA_PROVEDOR ("anthropic" | "gemini") ou, sem ele,
// o Claude. Sem nenhuma chave válida, retorna null e o controller cai no
// motor de regras (modo básico).
//
// Usa o fetch nativo do Node 18+ — nenhuma dependência nova.
// ============================================================================

const TIMEOUT_MS = 30000;
const MAX_TOKENS_RESPOSTA = 1500;

const MODELO_PADRAO = {
  anthropic: 'claude-haiku-5-5',
  // Gemini: o modelo é escolhido automaticamente (ver chamarGemini)
};

/** Chave preenchida de verdade (não o texto de exemplo do .env.example). */
function chaveValida(valor) {
  const v = (valor || '').trim();
  return v.length >= 20 && !/sua_|seu_|_aqui|exemplo|xxxx/i.test(v);
}

/** Qual provedor usar agora, ou null se nenhum estiver configurado. */
function provedorAtivo() {
  const temClaude = chaveValida(process.env.ANTHROPIC_API_KEY);
  const temGemini = chaveValida(process.env.GEMINI_API_KEY);
  const preferido = (process.env.IA_PROVEDOR || '').toLowerCase().trim();

  if (preferido === 'gemini' && temGemini) return 'gemini';
  if (preferido === 'anthropic' && temClaude) return 'anthropic';
  if (temClaude) return 'anthropic';
  if (temGemini) return 'gemini';
  return null;
}

/**
 * Normaliza o histórico para o formato que as APIs exigem:
 * começa com "user", papéis alternados, sem mensagens vazias.
 * @param {{ role: 'user'|'assistant', content: string }[]} mensagens
 */
function normalizarMensagens(mensagens) {
  const saida = [];
  for (const m of mensagens) {
    const content = (m.content || '').trim();
    if (!content) continue;
    const role = m.role === 'assistant' ? 'assistant' : 'user';
    if (saida.length === 0 && role === 'assistant') continue; // precisa começar com o usuário
    const ultima = saida[saida.length - 1];
    if (ultima && ultima.role === role) {
      ultima.content += `\n\n${content}`; // junta mensagens seguidas do mesmo papel
    } else {
      saida.push({ role, content });
    }
  }
  return saida;
}

async function chamarClaude({ system, mensagens }) {
  const modelo = process.env.ANTHROPIC_MODEL || MODELO_PADRAO.anthropic;
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY.trim(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelo,
      max_tokens: MAX_TOKENS_RESPOSTA,
      temperature: 0.4,
      system,
      messages: mensagens,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(`Claude HTTP ${resp.status}: ${data?.error?.message || 'erro desconhecido'}`);
  }
  const texto = (data.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim();
  if (!texto) throw new Error('Claude retornou resposta vazia');
  return { texto, provedor: 'anthropic', modelo };
}

// ----------------------------------------------------------------------------
// Gemini: escolha automática de modelo
//
// O Google troca e desliga modelos com frequência (ex.: gemini-2.5-flash não
// existe mais para chaves novas) e, no plano gratuito, modelos ficam
// sobrecarregados (503) ou sem cota (429) de minuto a minuto. Por isso:
//  1. a lista de modelos "Flash" disponíveis para a chave é descoberta na
//     API (cache de 6 h), do mais novo para o mais antigo;
//  2. se um modelo falha por sobrecarga, cota, demora ou inexistência, tenta o
//     próximo e deixa aquele "de castigo" por um tempo;
//  3. o último modelo que funcionou é tentado primeiro.
// GEMINI_MODEL no .env força um modelo (vira o primeiro da fila).
// ----------------------------------------------------------------------------
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const CACHE_LISTA_MS = 6 * 60 * 60 * 1000;
const PRAZO_TOTAL_MS = 45000;   // tempo máximo somando todas as tentativas
const PRAZO_TENTATIVA_MS = 20000;
const MAX_TENTATIVAS = 4;

const estadoGemini = {
  lista: null,          // modelos descobertos
  listaEm: 0,
  ultimoOk: null,       // último modelo que respondeu
  castigo: new Map(),   // modelo → timestamp até quando evitar
};

/** Versão numérica do nome (gemini-3.6-flash → 3.6); aliases "-latest" ficam no topo. */
// Ordem resultante: flash-latest → Flash estáveis (mais novo primeiro) → Flash preview
//                  → flash-lite-latest → Flash Lite estáveis.
function pesoModelo(nome) {
  if (nome === 'gemini-flash-latest') return 10000;
  if (nome === 'gemini-flash-lite-latest') return 100;
  const v = parseFloat((nome.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1]) || 0;
  let peso = v * 100;
  if (/lite/.test(nome)) peso -= 300;     // lite: mais rápido, porém mais fraco → reserva
  if (/preview|exp/.test(nome)) peso -= 150; // preview: pode sumir a qualquer momento
  return peso;
}

async function listarModelosGemini() {
  const agora = Date.now();
  if (estadoGemini.lista && agora - estadoGemini.listaEm < CACHE_LISTA_MS) return estadoGemini.lista;
  try {
    const resp = await fetch(`${GEMINI_BASE}/models?pageSize=200`, {
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY.trim() },
      signal: AbortSignal.timeout(10000),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const lista = (data.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => String(m.name || '').replace(/^models\//, ''))
      .filter(n => /^gemini-/.test(n) && /flash/.test(n) && !/image|tts|audio|live|omni|embedding|vision|thinking-exp|customtools/.test(n))
      .sort((a, b) => pesoModelo(b) - pesoModelo(a));
    if (lista.length) {
      estadoGemini.lista = lista;
      estadoGemini.listaEm = agora;
      return lista;
    }
  } catch (err) {
    console.error('[ia] Não foi possível listar os modelos do Gemini:', err.message);
  }
  // sem lista: os apelidos estáveis do Google
  return ['gemini-flash-latest', 'gemini-flash-lite-latest'];
}

function emCastigo(modelo) {
  const ate = estadoGemini.castigo.get(modelo);
  return ate && ate > Date.now();
}

async function chamarGemini({ system, mensagens }) {
  const descobertos = await listarModelosGemini();
  const fila = [...new Set([process.env.GEMINI_MODEL, estadoGemini.ultimoOk, ...descobertos].filter(Boolean))];
  const disponiveis = fila.filter(m => !emCastigo(m));
  const ordem = (disponiveis.length ? disponiveis : fila).slice(0, MAX_TENTATIVAS);

  const inicio = Date.now();
  let ultimoErro;
  for (const modelo of ordem) {
    const restante = PRAZO_TOTAL_MS - (Date.now() - inicio);
    if (restante < 3000) break;
    try {
      const r = await chamarGeminiModelo({ system, mensagens, modelo, timeout: Math.min(PRAZO_TENTATIVA_MS, restante) });
      estadoGemini.ultimoOk = modelo;
      estadoGemini.castigo.delete(modelo);
      return r;
    } catch (err) {
      ultimoErro = err;
      const s = err.status;
      // chave inválida/sem permissão: trocar de modelo não resolve
      if (s === 401 || s === 403 || (s === 400 && /api key/i.test(err.message))) throw err;
      // 404: modelo não existe mais → longe por 6 h; sobrecarga/cota/demora → 1 a 5 min
      const pausa = s === 404 ? CACHE_LISTA_MS : s === 429 ? 5 * 60000 : 60000;
      estadoGemini.castigo.set(modelo, Date.now() + pausa);
      if (estadoGemini.ultimoOk === modelo) estadoGemini.ultimoOk = null;
      console.error(`[ia] ${modelo} indisponível (${s || err.name || 'erro'}); tentando outro modelo.`);
    }
  }
  throw ultimoErro || new Error('Nenhum modelo do Gemini disponível no momento');
}

async function chamarGeminiModelo({ system, mensagens, modelo, timeout = TIMEOUT_MS }) {
  const url = `${GEMINI_BASE}/models/${encodeURIComponent(modelo)}:generateContent`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY.trim(),
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: mensagens.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      // folga extra: nos modelos 2.5 o "raciocínio" interno também consome tokens
      generationConfig: { temperature: 0.4, maxOutputTokens: MAX_TOKENS_RESPOSTA * 3 },
    }),
    signal: AbortSignal.timeout(timeout),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const erro = new Error(`Gemini (${modelo}) HTTP ${resp.status}: ${data?.error?.message || 'erro desconhecido'}`);
    erro.status = resp.status;
    throw erro;
  }
  const texto = (data.candidates?.[0]?.content?.parts || [])
    .filter(p => typeof p.text === 'string' && !p.thought)
    .map(p => p.text)
    .join('')
    .trim();
  if (!texto) {
    const motivo = data.candidates?.[0]?.finishReason || data.promptFeedback?.blockReason || 'sem texto';
    throw new Error(`Gemini retornou resposta vazia (${motivo})`);
  }
  return { texto, provedor: 'gemini', modelo };
}

/**
 * Gera uma resposta com o provedor configurado.
 * @returns {Promise<{texto: string, provedor: string, modelo: string} | null>}
 *          null quando nenhum provedor está configurado.
 * @throws  quando o provedor está configurado mas a chamada falha.
 */
async function gerarResposta({ system, mensagens }) {
  const provedor = provedorAtivo();
  if (!provedor) return null;

  const msgs = normalizarMensagens(mensagens);
  if (msgs.length === 0) return null;

  return provedor === 'anthropic'
    ? chamarClaude({ system, mensagens: msgs })
    : chamarGemini({ system, mensagens: msgs });
}

module.exports = { gerarResposta, provedorAtivo, normalizarMensagens, chaveValida, _estadoGemini: estadoGemini };
