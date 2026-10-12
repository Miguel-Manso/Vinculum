import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import styles from './Chatbot.module.css';

const MENSAGEM_BOAS_VINDAS = {
  id: 'intro',
  remetente: 'ia',
  texto: 'Olá! Sou o assistente de processos do Vinculum com IA. Como posso ajudar você hoje? Posso tirar dúvidas sobre seus fluxos, tarefas, prazos ou regras de negócio.',
  horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
};

const PROMPTS_SUGERIDOS = [
  'Quais processos temos?',
  'Como criar uma nova tarefa?',
  'Como exportar tarefas em CSV?',
  'Como mover tarefas no Kanban?',
];

// Formatador inline para destacar termos em negrito, italico ou tags de codigo
function formatarTextoInline(texto) {
  if (!texto) return '';
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const partes = texto.split(regex);

  return partes.map((parte, index) => {
    if (parte.startsWith('**') && parte.endsWith('**') && parte.length >= 4) {
      return (
        <strong key={index} className={styles.inlineStrong}>
          {parte.slice(2, -2)}
        </strong>
      );
    }
    if (parte.startsWith('*') && parte.endsWith('*') && parte.length >= 2) {
      return (
        <em key={index} className={styles.inlineEm}>
          {parte.slice(1, -1)}
        </em>
      );
    }
    if (parte.startsWith('`') && parte.endsWith('`') && parte.length >= 2) {
      return (
        <code key={index} className={styles.inlineCode}>
          {parte.slice(1, -1)}
        </code>
      );
    }
    return parte;
  });
}

// Renderizador visual elegante e palatavel das respostas da IA
function RenderizadorMensagem({ texto, isUser }) {
  if (isUser) {
    return <span className={styles.userText}>{texto}</span>;
  }

  if (!texto) return null;

  // Divide o texto em blocos estruturados
  const blocos = texto.split(/\n\s*\n/).filter(Boolean);

  return (
    <div className={styles.iaFormattedContent}>
      {blocos.map((bloco, bIdx) => {
        const trimmed = bloco.trim();

        // 1. Dicas e Callouts destacados
        if (trimmed.startsWith('💡') || trimmed.startsWith('Dica:')) {
          const conteudoDica = trimmed.replace(/^💡\s*/, '');
          return (
            <div key={bIdx} className={styles.tipCard}>
              <div className={styles.tipIconWrap}>💡</div>
              <div className={styles.tipContent}>{formatarTextoInline(conteudoDica)}</div>
            </div>
          );
        }

        // 2. Titulos de seção
        if (trimmed.startsWith('#')) {
          const limpo = trimmed.replace(/^#+\s*/, '');
          return (
            <div key={bIdx} className={styles.sectionHeader}>
              {formatarTextoInline(limpo)}
            </div>
          );
        }

        const linhas = trimmed.split('\n').map(l => l.trim()).filter(Boolean);

        // 3. Passos numerados (1. ..., 2. ...)
        const todasNumeradas = linhas.length > 0 && linhas.every(l => /^\d+[\.\)]\s/.test(l));
        if (todasNumeradas) {
          return (
            <div key={bIdx} className={styles.stepList}>
              {linhas.map((linha, lIdx) => {
                const match = linha.match(/^(\d+)[\.\)]\s*(.*)$/);
                const num = match ? match[1] : `${lIdx + 1}`;
                const conteudo = match ? match[2] : linha;
                return (
                  <div key={lIdx} className={styles.stepItem}>
                    <div className={styles.stepBadge}>{num}</div>
                    <div className={styles.stepText}>{formatarTextoInline(conteudo)}</div>
                  </div>
                );
              })}
            </div>
          );
        }

        // 4. Itens com marcadores (•, -, *)
        const temMarcadores = linhas.some(l => /^[•\-\*]\s/.test(l));
        if (temMarcadores) {
          return (
            <div key={bIdx} className={styles.bulletList}>
              {linhas.map((linha, lIdx) => {
                if (/^[•\-\*]\s/.test(linha)) {
                  const conteudo = linha.replace(/^[•\-\*]\s*/, '');
                  return (
                    <div key={lIdx} className={styles.bulletItem}>
                      <span className={styles.bulletDot}>•</span>
                      <div className={styles.bulletText}>{formatarTextoInline(conteudo)}</div>
                    </div>
                  );
                }
                return (
                  <p key={lIdx} className={styles.introParagraph}>
                    {formatarTextoInline(linha)}
                  </p>
                );
              })}
            </div>
          );
        }

        // 5. Paragrafo comum
        return (
          <p key={bIdx} className={styles.standardParagraph}>
            {linhas.map((l, lIdx) => (
              <span key={lIdx}>
                {formatarTextoInline(l)}
                {lIdx < linhas.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export default function Chatbot() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState(() => {
    try {
      const salvo = sessionStorage.getItem('vinculum_chat_historico');
      return salvo ? JSON.parse(salvo) : [MENSAGEM_BOAS_VINDAS];
    } catch {
      return [MENSAGEM_BOAS_VINDAS];
    }
  });
  const [inputTexto, setInputTexto] = useState('');
  const [carregando, setCarregando] = useState(false);
  const messagesEndRef = useRef(null);

  // Persiste o histórico na sessão atual
  useEffect(() => {
    try {
      sessionStorage.setItem('vinculum_chat_historico', JSON.stringify(mensagens));
    } catch (e) {
      console.warn('Erro ao salvar histórico do chat na sessão:', e);
    }
  }, [mensagens]);

  // Rola até a última mensagem
  useEffect(() => {
    if (aberto) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensagens, aberto]);

  async function enviarMensagem(textoParaEnviar) {
    const texto = (textoParaEnviar || inputTexto).trim();
    if (!texto || carregando) return;

    const novaMsgUsuario = {
      id: Date.now(),
      remetente: 'usuario',
      texto,
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    const novoHistorico = [...mensagens, novaMsgUsuario];
    setMensagens(novoHistorico);
    setInputTexto('');
    setCarregando(true);

    try {
      // POST /api/chatbot com a mensagem e o histórico da conversa
      const res = await api.post('/chatbot', {
        mensagem: texto,
        historico: novoHistorico.map(m => ({
          remetente: m.remetente,
          texto: m.texto,
        })),
      });

      const respostaIA = res.data?.resposta || 'Desculpe, não consegui obter uma resposta no momento.';
      setMensagens(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          remetente: 'ia',
          texto: respostaIA,
          horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('Erro ao enviar mensagem para o chatbot:', err);
      const msgErro = err.response?.data?.error || 'Erro ao comunicar com o assistente. Verifique se o servidor está ativo.';
      setMensagens(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          remetente: 'ia',
          texto: `⚠️ ${msgErro}`,
          horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setCarregando(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  }

  function limparHistorico() {
    if (window.confirm('Deseja limpar o histórico da conversa nesta sessão?')) {
      const reset = [MENSAGEM_BOAS_VINDAS];
      setMensagens(reset);
      sessionStorage.removeItem('vinculum_chat_historico');
    }
  }

  return (
    <>
      {/* Botão flutuante no canto inferior direito */}
      <button
        type="button"
        className={styles.floatingBtn}
        onClick={() => setAberto(prev => !prev)}
        title={aberto ? 'Fechar assistente' : 'Abrir assistente com IA'}
        aria-label="Abrir assistente com IA"
      >
        <span className={styles.floatingBadge} />
        {aberto ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <circle cx="9" cy="10" r="1" fill="currentColor" />
            <circle cx="15" cy="10" r="1" fill="currentColor" />
          </svg>
        )}
      </button>

      {/* Janela Flutuante do Chat */}
      {aberto && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderLeft}>
              <div className={styles.avatarIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a2 2 0 0 1 2 2v2h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4V4a2 2 0 0 1 2-2z" />
                  <circle cx="9" cy="13" r="1" />
                  <circle cx="15" cy="13" r="1" />
                </svg>
              </div>
              <div className={styles.chatHeaderText}>
                <span className={styles.chatTitle}>Vinculum IA</span>
                <span className={styles.chatSubtitle}>
                  <span className={styles.onlineDot} /> Online • Llama & Mistral
                </span>
              </div>
            </div>

            <div className={styles.chatHeaderActions}>
              <button
                type="button"
                className={styles.btnHeaderAction}
                onClick={limparHistorico}
                title="Limpar histórico"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                </svg>
              </button>
              <button
                type="button"
                className={styles.btnHeaderAction}
                onClick={() => setAberto(false)}
                title="Minimizar chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Lista de Mensagens */}
          <div className={styles.messagesContainer}>
            {mensagens.map(msg => {
              const isUser = msg.remetente === 'usuario';
              return (
                <div
                  key={msg.id}
                  className={`${styles.messageRow} ${isUser ? styles.messageRowUser : styles.messageRowIA}`}
                >
                  <div className={`${styles.messageBubble} ${isUser ? styles.bubbleUser : styles.bubbleIA}`}>
                    <RenderizadorMensagem texto={msg.texto} isUser={isUser} />
                  </div>
                  <span className={styles.messageTime}>{msg.horario}</span>
                </div>
              );
            })}

            {carregando && (
              <div className={styles.typingIndicator}>
                <span>Consultando IA</span>
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sugestões Rápidas */}
          <div className={styles.quickPrompts}>
            {PROMPTS_SUGERIDOS.map((sugestao, idx) => (
              <button
                key={idx}
                type="button"
                className={styles.quickChip}
                onClick={() => enviarMensagem(sugestao)}
              >
                {sugestao}
              </button>
            ))}
          </div>

          {/* Input de Envio */}
          <div className={styles.chatInputArea}>
            <textarea
              className={styles.chatTextarea}
              placeholder="Digite sua dúvida sobre os processos..."
              value={inputTexto}
              onChange={e => setInputTexto(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              type="button"
              className={styles.btnEnviar}
              onClick={() => enviarMensagem()}
              disabled={!inputTexto.trim() || carregando}
              title="Enviar mensagem"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
