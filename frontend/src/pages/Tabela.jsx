import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import styles from './Tabela.module.css';

export default function Tabela() {
  const navigate = useNavigate();

  const [tarefas,           setTarefas]           = useState([]);
  const [campos,            setCampos]            = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [busca,             setBusca]             = useState('');
  const [filtroProcesso,    setFiltroProcesso]    = useState('');
  const [filtroEtapa,       setFiltroEtapa]       = useState('');
  const [filtroStatus,      setFiltroStatus]      = useState('');
  const [filtroPrazo,       setFiltroPrazo]       = useState('');
  const [filtroComCampos,   setFiltroComCampos]   = useState('');
  const [ordenacao,         setOrdenacao]         = useState({ campo: 'processo_nome', dir: 'asc' });

  useEffect(() => {
    Promise.all([
      api.get('/tarefas'),
      api.get('/campos'),
    ])
      .then(([resTarefas, resCampos]) => {
        setTarefas(resTarefas.data || []);
        setCampos(resCampos.data || []);
      })
      .catch(err => console.error('Erro ao carregar tabela:', err))
      .finally(() => setLoading(false));
  }, []);

  function isConcluida(t) {
    if (t.concluida === 1 || t.concluida === true) return true;
    const nome = t.etapa_nome?.toLowerCase() || '';
    return nome.includes('finaliz') || nome.includes('concluíd') || nome.includes('concluid');
  }

  function isAtrasada(t) {
    if (isConcluida(t) || !t.prazo) return false;
    const hojeStr = new Date().toISOString().split('T')[0];
    const prazoStr = new Date(t.prazo).toISOString().split('T')[0];
    return prazoStr < hojeStr;
  }

  function isHoje(t) {
    if (!t.prazo) return false;
    const hojeStr = new Date().toISOString().split('T')[0];
    const prazoStr = new Date(t.prazo).toISOString().split('T')[0];
    return prazoStr === hojeStr;
  }

  // Listas únicas para os filtros
  const processos    = useMemo(() => [...new Set(tarefas.map(t => t.processo_nome))].filter(Boolean).sort(), [tarefas]);
  const etapas       = useMemo(() => [...new Set(tarefas.map(t => t.etapa_nome))].filter(Boolean).sort(), [tarefas]);

  // Campos específicos do processo selecionado
  const camposProcessoAtual = useMemo(() => {
    if (!filtroProcesso) return [];
    return campos.filter(c => c.processo_nome === filtroProcesso);
  }, [campos, filtroProcesso]);

  // Mapa rápido de campos por ID
  const mapaCampos = useMemo(() => {
    const mapa = {};
    campos.forEach(c => {
      mapa[c.id] = c;
    });
    return mapa;
  }, [campos]);

  // Filtra + ordena
  const tarefasFiltradas = useMemo(() => {
    let resultado = tarefas.filter(t => {
      // Busca ampla (título, processo, etapa e qualquer valor de campo personalizado)
      let matchBuscaCampos = false;
      if (t.campos_personalizados && busca) {
        matchBuscaCampos = String(t.campos_personalizados).toLowerCase().includes(busca.toLowerCase());
      }

      const matchBusca =
        !busca ||
        t.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        t.processo_nome.toLowerCase().includes(busca.toLowerCase()) ||
        (t.etapa_nome && t.etapa_nome.toLowerCase().includes(busca.toLowerCase())) ||
        matchBuscaCampos;

      const matchProcesso = !filtroProcesso || t.processo_nome === filtroProcesso;
      const matchEtapa    = !filtroEtapa    || t.etapa_nome    === filtroEtapa;

      // Filtro por situação / status
      let matchStatus = true;
      if (filtroStatus === 'concluida') {
        matchStatus = isConcluida(t);
      } else if (filtroStatus === 'pendente') {
        matchStatus = !isConcluida(t);
      } else if (filtroStatus === 'atrasada') {
        matchStatus = isAtrasada(t);
      }

      // Filtro por prazo
      let matchPrazo = true;
      if (filtroPrazo === 'hoje') {
        matchPrazo = isHoje(t);
      } else if (filtroPrazo === 'com_prazo') {
        matchPrazo = Boolean(t.prazo);
      } else if (filtroPrazo === 'sem_prazo') {
        matchPrazo = !t.prazo;
      }

      // Filtro avançado: se possui campos customizados preenchidos
      let matchCamposAvancado = true;
      if (filtroComCampos === 'com_campos') {
        let temValor = false;
        if (t.campos_personalizados) {
          try {
            const parsed = typeof t.campos_personalizados === 'string' ? JSON.parse(t.campos_personalizados) : t.campos_personalizados;
            temValor = Object.values(parsed).some(v => v !== undefined && v !== null && String(v).trim() !== '');
          } catch {}
        }
        matchCamposAvancado = temValor;
      } else if (filtroComCampos === 'sem_campos') {
        let temValor = false;
        if (t.campos_personalizados) {
          try {
            const parsed = typeof t.campos_personalizados === 'string' ? JSON.parse(t.campos_personalizados) : t.campos_personalizados;
            temValor = Object.values(parsed).some(v => v !== undefined && v !== null && String(v).trim() !== '');
          } catch {}
        }
        matchCamposAvancado = !temValor;
      }

      return matchBusca && matchProcesso && matchEtapa && matchStatus && matchPrazo && matchCamposAvancado;
    });

    resultado.sort((a, b) => {
      let va = '';
      let vb = '';

      if (ordenacao.campo.startsWith('custom_')) {
        const campoId = ordenacao.campo.replace('custom_', '');
        try {
          const pa = typeof a.campos_personalizados === 'string' ? JSON.parse(a.campos_personalizados) : (a.campos_personalizados || {});
          const pb = typeof b.campos_personalizados === 'string' ? JSON.parse(b.campos_personalizados) : (b.campos_personalizados || {});
          va = pa[campoId] ?? '';
          vb = pb[campoId] ?? '';
        } catch {}
      } else {
        va = a[ordenacao.campo] ?? '';
        vb = b[ordenacao.campo] ?? '';
      }

      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();

      if (va < vb) return ordenacao.dir === 'asc' ? -1 : 1;
      if (va > vb) return ordenacao.dir === 'asc' ? 1 : -1;
      return 0;
    });

    return resultado;
  }, [tarefas, busca, filtroProcesso, filtroEtapa, filtroStatus, filtroPrazo, filtroComCampos, ordenacao]);

  function toggleOrdenacao(campo) {
    setOrdenacao(prev =>
      prev.campo === campo
        ? { campo, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { campo, dir: 'asc' }
    );
  }

  function setaOrdenacao(campo) {
    if (ordenacao.campo !== campo) return null;
    return ordenacao.dir === 'asc' ? ' ↑' : ' ↓';
  }

  function limparTodosFiltros() {
    setBusca('');
    setFiltroProcesso('');
    setFiltroEtapa('');
    setFiltroStatus('');
    setFiltroPrazo('');
    setFiltroComCampos('');
  }

  const temFiltroAtivo = Boolean(
    busca || filtroProcesso || filtroEtapa || filtroStatus || filtroPrazo || filtroComCampos
  );

  function exportarCSV() {
    api.get('/export/csv', { responseType: 'blob' }).then(res => {
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', 'vinculum.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    }).catch(() => alert('Erro ao exportar CSV.'));
  }

  function formatarData(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('pt-BR');
  }

  // Renderiza resumo de campos para visão de todos os processos
  function renderResumoCampos(t) {
    if (!t.campos_personalizados) return '—';
    let valores = {};
    try {
      valores = typeof t.campos_personalizados === 'string' ? JSON.parse(t.campos_personalizados) : t.campos_personalizados;
    } catch {
      return '—';
    }

    const preenchidos = Object.entries(valores).filter(([, val]) => val !== undefined && val !== null && String(val).trim() !== '');
    if (preenchidos.length === 0) return '—';

    return (
      <div className={styles.customChipsCell}>
        {preenchidos.slice(0, 3).map(([campoId, val]) => {
          const c = mapaCampos[campoId];
          const nomeCampo = c?.nome || `Campo #${campoId}`;
          let exibicao = String(val);
          if (c?.tipo === 'moeda') {
            const num = Number(String(val).replace(/[^\d.,]/g, '').replace(',', '.'));
            if (!isNaN(num)) exibicao = num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          } else if (c?.tipo === 'data') {
            try { exibicao = new Date(val).toLocaleDateString('pt-BR'); } catch {}
          } else if (c?.tipo === 'checkbox') {
            exibicao = val ? 'Sim' : 'Não';
          }

          return (
            <span key={campoId} className={styles.customChip} title={`${nomeCampo}: ${exibicao}`}>
              <span className={styles.customChipStrong}>{nomeCampo}:</span> {exibicao}
            </span>
          );
        })}
        {preenchidos.length > 3 && (
          <span style={{ fontSize: '11px', color: 'var(--gray-text-muted)' }}>
            +{preenchidos.length - 3} mais
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderText}>
            <h1 className={styles.pageTitle}>Tabela de Processos</h1>
            <p className={styles.pageSubtitle}>
              Visualização tabular completa com colunas dinâmicas, pesquisa em campos customizados e exportação
            </p>
          </div>
          <button className={styles.btnExportar} onClick={exportarCSV}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar CSV
          </button>
        </div>

        {/* Painel de Filtros e Busca */}
        <div className={styles.filtrosCard}>
          <div className={styles.filtrosTopRow}>
            <div className={styles.buscaWrap}>
              <svg className={styles.buscaIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className={styles.buscaInput}
                type="text"
                placeholder="Buscar por tarefa, processo, etapa, nº de NF, requisição..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>

            <select className={styles.filtroSelect} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todas as situações</option>
              <option value="pendente">Apenas Pendentes</option>
              <option value="concluida">Apenas Concluídas (Finalizado)</option>
              <option value="atrasada">Atrasadas / Prazo Vencido</option>
            </select>

            {temFiltroAtivo && (
              <button className={styles.btnLimpar} onClick={limparTodosFiltros} title="Limpar todos os filtros">
                Limpar filtros
              </button>
            )}
          </div>

          <div className={styles.filtrosBottomRow}>
            <div className={styles.filtroGroup}>
              <label className={styles.filtroLabel}>Processo:</label>
              <select className={styles.filtroSelect} value={filtroProcesso} onChange={e => setFiltroProcesso(e.target.value)}>
                <option value="">Todos os processos</option>
                {processos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className={styles.filtroGroup}>
              <label className={styles.filtroLabel}>Etapa:</label>
              <select className={styles.filtroSelect} value={filtroEtapa} onChange={e => setFiltroEtapa(e.target.value)}>
                <option value="">Todas as etapas</option>
                {etapas.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div className={styles.filtroGroup}>
              <label className={styles.filtroLabel}>Prazo:</label>
              <select className={styles.filtroSelect} value={filtroPrazo} onChange={e => setFiltroPrazo(e.target.value)}>
                <option value="">Qualquer prazo</option>
                <option value="hoje">Vencendo hoje</option>
                <option value="com_prazo">Com prazo definido</option>
                <option value="sem_prazo">Sem prazo definido</option>
              </select>
            </div>

            <div className={styles.filtroGroup}>
              <label className={styles.filtroLabel}>Campos Extras:</label>
              <select className={styles.filtroSelect} value={filtroComCampos} onChange={e => setFiltroComCampos(e.target.value)}>
                <option value="">Todos os campos</option>
                <option value="com_campos">Com campos preenchidos</option>
                <option value="sem_campos">Sem campos preenchidos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Tarefas com Colunas Dinâmicas */}
        <div className={styles.tableWrap}>
          {loading ? (
            <div className={styles.empty}>Carregando tarefas...</div>
          ) : tarefasFiltradas.length === 0 ? (
            <div className={styles.empty}>Nenhuma tarefa encontrada para os filtros selecionados.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} onClick={() => toggleOrdenacao('titulo')}>
                    Tarefa{setaOrdenacao('titulo')}
                  </th>
                  <th className={styles.th} onClick={() => toggleOrdenacao('processo_nome')}>
                    Processo{setaOrdenacao('processo_nome')}
                  </th>
                  <th className={styles.th} onClick={() => toggleOrdenacao('etapa_nome')}>
                    Etapa{setaOrdenacao('etapa_nome')}
                  </th>
                  <th className={styles.th} onClick={() => toggleOrdenacao('situacao')}>
                    Situação{setaOrdenacao('situacao')}
                  </th>

                  {/* Colunas Dinâmicas quando um processo específico estiver selecionado */}
                  {filtroProcesso && camposProcessoAtual.length > 0 ? (
                    camposProcessoAtual.map(c => (
                      <th
                        key={`th_custom_${c.id}`}
                        className={`${styles.th} ${styles.thCustom}`}
                        onClick={() => toggleOrdenacao(`custom_${c.id}`)}
                      >
                        {c.nome}{setaOrdenacao(`custom_${c.id}`)}
                      </th>
                    ))
                  ) : (
                    /* Coluna resumo quando nenhum processo individual estiver filtrado */
                    <th className={styles.th}>Campos Personalizados</th>
                  )}

                  <th className={styles.th} onClick={() => toggleOrdenacao('prazo')}>
                    Prazo{setaOrdenacao('prazo')}
                  </th>
                  <th className={styles.th} onClick={() => toggleOrdenacao('criado_em')}>
                    Criado em{setaOrdenacao('criado_em')}
                  </th>
                  <th className={styles.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {tarefasFiltradas.map((t, i) => {
                  const concluida = isConcluida(t);
                  const atrasada = isAtrasada(t);

                  return (
                    <tr key={t.id} className={i % 2 === 0 ? styles.trPar : styles.trImpar}>
                      <td className={styles.td} style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{t.titulo}</span>
                          {(t.urgente === 1 || t.urgente === true) && (
                            <span style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              borderRadius: '4px',
                              padding: '1px 6px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              ⚑ Urgente
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.tagProcesso}>{t.processo_nome}</span>
                      </td>
                      <td className={styles.td}>{t.etapa_nome}</td>
                      <td className={styles.td}>
                        {concluida ? (
                          <span className={styles.badgeConcluida}>Concluída</span>
                        ) : atrasada ? (
                          <span className={styles.badgeAtrasada}>Atrasada</span>
                        ) : (
                          <span className={styles.badgeEmAndamento}>Em Andamento</span>
                        )}
                      </td>

                      {/* Dados das colunas dinâmicas */}
                      {filtroProcesso && camposProcessoAtual.length > 0 ? (
                        camposProcessoAtual.map(c => {
                          let val = '';
                          if (t.campos_personalizados) {
                            try {
                              const parsed = typeof t.campos_personalizados === 'string'
                                ? JSON.parse(t.campos_personalizados)
                                : t.campos_personalizados;
                              val = parsed[c.id] ?? '';
                            } catch {}
                          }

                          let formatado = val;
                          if (c.tipo === 'moeda' && val) {
                            const num = Number(String(val).replace(/[^\d.,]/g, '').replace(',', '.'));
                            if (!isNaN(num)) formatado = num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                          } else if (c.tipo === 'data' && val) {
                            try { formatado = new Date(val).toLocaleDateString('pt-BR'); } catch {}
                          } else if (c.tipo === 'checkbox') {
                            formatado = val ? 'Sim' : 'Não';
                          }

                          return (
                            <td key={`td_custom_${c.id}`} className={styles.td}>
                              {formatado !== '' ? formatado : '—'}
                            </td>
                          );
                        })
                      ) : (
                        <td className={styles.td}>
                          {renderResumoCampos(t)}
                        </td>
                      )}

                      <td className={styles.td}>
                        {t.prazo ? (
                          <span style={{ color: atrasada ? '#DC2626' : 'inherit', fontWeight: atrasada ? 600 : 400 }}>
                            {formatarData(t.prazo)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className={styles.td}>{formatarData(t.criado_em)}</td>
                      <td className={styles.td}>
                        <button className={styles.btnVer} onClick={() => navigate(`/tarefas/${t.id}`)}>
                          Ver / Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.rodape}>
          Exibindo {tarefasFiltradas.length} de {tarefas.length} tarefa{tarefas.length !== 1 ? 's' : ''}
        </div>
      </main>
    </div>
  );
}
