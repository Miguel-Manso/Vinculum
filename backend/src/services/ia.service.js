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
  // O plano gratuito do Gemini só libera modelos "Flash". O apelido "-latest"
  // sempre aponta para o Flash atual; os seguintes são reserva caso ele não exista.
  gemini: ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'],
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

async function chamarGemini({ system, mensagens }) {
  const modelos = process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : MODELO_PADRAO.gemini;
  let ultimoErro;
  for (const modelo of modelos) {
    try {
      return await chamarGeminiModelo({ system, mensagens, modelo });
    } catch (err) {
      ultimoErro = err;
      // só tenta o próximo modelo se este não existir; cota/chave inválida não adianta trocar
      if (err.status !== 404) throw err;
    }
  }
  throw ultimoErro;
}

async function chamarGeminiModelo({ system, mensagens, modelo }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`;
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
    signal: AbortSignal.timeout(TIMEOUT_MS),
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

module.exports = { gerarResposta, provedorAtivo, normalizarMensagens, chaveValida };
