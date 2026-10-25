import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProcessIcon, { OPCOES_ICONES, getProcessIconKey } from '../components/ProcessIcon';
import { useSetor } from '../context/SetorContext';
import api from '../services/api';
import styles from './Processos.module.css';

export default function Processos() {
  const navigate = useNavigate();
  const { setoresDisponiveis, setorAtivo, selecionarSetor, recarregarSetores } = useSetor();

  const [processos, setProcessos] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  // Aba de setor selecionada no topo (sincronizada com setorAtivo se houver)
  const [setorFiltroId, setSetorFiltroId] = useState(() => setorAtivo ? String(setorAtivo.id) : 'todos');

  // Mantém a aba sincronizada quando o usuário altera o setor na Sidebar
  useEffect(() => {
    if (setorAtivo) {
      setSetorFiltroId(String(setorAtivo.id));
    } else {
      setSetorFiltroId('todos');
    }
  }, [setorAtivo]);

  // Estados de Modal (Criação / Edição)
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoProcesso, setEditandoProcesso] = useState(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [setorIdForm, setSetorIdForm] = useState('');
  const [iconeForm, setIconeForm] = useState('kanban');
  const [salvando, setSalvando] = useState(false);

  async function carregarProcessos() {
    try {
      const res = await api.get('/processos');
      setProcessos(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar processos:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProcessos();
  }, []);

  // Filtra processos por busca e por setor selecionado
  const processosFiltrados = useMemo(() => {
    return processos.filter(p => {
      // Filtro por setor
      if (setorFiltroId !== 'todos') {
        if (String(p.setor_id) !== String(setorFiltroId)) return false;
      }

      // Filtro por termo de busca
      const termo = busca.toLowerCase().trim();
      if (!termo) return true;

      return (
        p.nome?.toLowerCase().includes(termo) ||
        (p.descricao && p.descricao.toLowerCase().includes(termo)) ||
        (p.setor_nome && p.setor_nome.toLowerCase().includes(termo))
      );
    });
  }, [processos, setorFiltroId, busca]);

  function abrirModalCriar() {
    setEditandoProcesso(null);
    setNome('');
    setDescricao('');
    // Pré-seleciona o setor ativo ou o primeiro disponível
    const defaultSetor = setorAtivo?.id || (setoresDisponiveis.length > 0 ? setoresDisponiveis[0].id : '');
    setSetorIdForm(defaultSetor ? String(defaultSetor) : '');
    setIconeForm('kanban');
    setModalAberto(true);
  }

  function abrirModalEditar(p) {
    setEditandoProcesso(p);
    setNome(p.nome);
    setDescricao(p.descricao || '');
    setSetorIdForm(p.setor_id ? String(p.setor_id) : (setoresDisponiveis[0]?.id ? String(setoresDisponiveis[0].id) : ''));
    setIconeForm(p.icone || getProcessIconKey(p));
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditandoProcesso(null);
    setNome('');
    setDescricao('');
    setSetorIdForm('');
    setIconeForm('kanban');
  }

  async function handleSubmitProcesso(e) {
    e.preventDefault();
    if (!nome.trim()) return;
    if (!setorIdForm) {
      alert('Por favor, selecione um setor para vincular o processo.');
      return;
    }

    setSalvando(true);
    try {
      if (editandoProcesso) {
        await api.put(`/processos/${editandoProcesso.id}`, {
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          setor_id: parseInt(setorIdForm, 10),
          icone: iconeForm,
        });
      } else {
        await api.post('/processos', {
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          setor_id: parseInt(setorIdForm, 10),
          icone: iconeForm,
          criarEtapasPadrao: true,
        });
      }
      fecharModal();
      await Promise.all([carregarProcessos(), recarregarSetores()]);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao salvar processo');
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(p) {
    if (!window.confirm(`Tem certeza que deseja excluir o processo "${p.nome}"?\nTodas as etapas e tarefas vinculadas serão excluídas.`)) {
      return;
    }

    try {
      await api.delete(`/processos/${p.id}`);
      await Promise.all([carregarProcessos(), recarregarSetores()]);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao excluir processo');
    }
  }

  function handleSelecionarAba(abaId) {
    setSetorFiltroId(abaId);
    if (abaId === 'todos') {
      selecionarSetor(null);
    } else {
      const setorEncontrado = setoresDisponiveis.find(s => String(s.id) === String(abaId));
      if (setorEncontrado) {
        selecionarSetor(setorEncontrado);
      }
    }
  }

  const totalTarefas = useMemo(() => {
    return processos.reduce((acc, p) => acc + (parseInt(p.tarefas, 10) || 0), 0);
  }, [processos]);

  const totalEtapas = useMemo(() => {
    return processos.reduce((acc, p) => acc + (parseInt(p.etapas, 10) || 0), 0);
  }, [processos]);

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        {/* Cabeçalho Minimalista com Ribbon */}
        <header className={styles.minimalHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Processos</h1>
            <div className={styles.headerMetricsRibbon}>
              <span className={styles.ribbonItem}>
                <strong>{processos.length}</strong> {processos.length === 1 ? 'processo' : 'processos'}
              </span>
              <span className={styles.ribbonDot}>•</span>
              <span className={styles.ribbonItem}>
                <strong>{totalTarefas}</strong> tarefas
              </span>
              <span className={styles.ribbonDot}>•</span>
              <span className={styles.ribbonItem}>
                <strong>{totalEtapas}</strong> etapas kanban
              </span>
            </div>
          </div>

          <div className={styles.headerRight}>
            <button className={styles.btnPrimary} onClick={abrirModalCriar}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Novo Processo</span>
            </button>
          </div>
        </header>

        {/* Barra de Filtros Minimalista */}
        <div className={styles.cleanToolbar}>
          {/* Pesquisa */}
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Pesquisar processos..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            {busca && (
              <button className={styles.btnClearSearch} onClick={() => setBusca('')}>
                ×
              </button>
            )}
          </div>

          {/* Abas Rápidas de Setor */}
          <div className={styles.sectorPills}>
            <button
              type="button"
              className={`${styles.pillBtn} ${setorFiltroId === 'todos' ? styles.pillBtnActive : ''}`}
              onClick={() => handleSelecionarAba('todos')}
            >
              <ProcessIcon iconKey="kanban" size={13} />
              <span>Todos ({processos.length})</span>
            </button>

            {setoresDisponiveis.map(setor => {
              const count = processos.filter(p => String(p.setor_id) === String(setor.id)).length;
              return (
                <button
                  key={setor.id}
                  type="button"
                  className={`${styles.pillBtn} ${setorFiltroId === String(setor.id) ? styles.pillBtnActive : ''}`}
                  onClick={() => handleSelecionarAba(String(setor.id))}
                >
                  <span
                    className={styles.pillIconWrap}
                    style={{ color: setor.cor || '#2fd9f4' }}
                  >
                    <ProcessIcon iconKey={setor.icone} name={setor.nome} size={13} />
                  </span>
                  <span>{setor.nome} ({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid de Cards dos Processos */}
        {loading ? (
          <div className={styles.loadingBox}>Carregando processos...</div>
        ) : processos.length === 0 ? (
          <div className={styles.emptyStateBox}>
            <p className={styles.emptyStateTitle}>Nenhum processo cadastrado.</p>
            <p className={styles.emptyStateDesc}>Crie fluxos de trabalho visuais para padronizar as operações da sua equipe.</p>
            <button className={styles.btnPrimary} onClick={abrirModalCriar}>
              Criar primeiro processo
            </button>
          </div>
        ) : processosFiltrados.length === 0 ? (
          <div className={styles.emptyStateBox}>
            <p className={styles.emptyStateTitle}>Nenhum processo corresponde aos filtros selecionados.</p>
            <button
              type="button"
              className={styles.btnLimparBusca}
              onClick={() => {
                setBusca('');
                handleSelecionarAba('todos');
              }}
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {processosFiltrados.map((p) => (
              <div
                key={p.id}
                className={styles.card}
                onClick={() => navigate(`/processos/${p.id}/fluxo`)}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderLeft}>
                    <div
                      className={styles.cardIconBox}
                      style={{
                        backgroundColor: `${p.setor_cor || '#2fd9f4'}16`,
                        color: p.setor_cor || '#2fd9f4',
                        border: `1px solid ${p.setor_cor || '#2fd9f4'}30`,
                      }}
                      title={`Processo: ${p.nome}`}
                    >
                      <ProcessIcon processo={p} size={18} />
                    </div>

                    <div className={styles.cardDeptRow}>
                      <span
                        className={styles.deptDot}
                        style={{ backgroundColor: p.setor_cor || '#2fd9f4' }}
                      />
                      <span className={styles.cardDeptName} style={{ color: p.setor_cor || '#2fd9f4' }}>
                        {p.setor_nome || 'Geral'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardQuickActions} onClick={e => e.stopPropagation()}>
                    <button
                      className={styles.btnIconQuick}
                      onClick={() => abrirModalEditar(p)}
                      title="Editar processo"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>

                    <button
                      className={styles.btnIconQuickDanger}
                      onClick={() => handleExcluir(p)}
                      title="Excluir processo"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>
                </div>

                <h2 className={styles.cardNome} title={p.nome}>{p.nome}</h2>

                <p className={styles.cardDesc}>
                  {p.descricao || 'Sem descrição cadastrada.'}
                </p>

                <div className={styles.cardFooter}>
                  <div className={styles.cardMetrics}>
                    <span className={styles.metricItem}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="18" rx="1" />
                        <rect x="14" y="3" width="7" height="18" rx="1" />
                      </svg>
                      {p.etapas || 0} etapas
                    </span>
                    <span className={styles.metricItem}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      {p.tarefas || 0} tarefas
                    </span>
                  </div>

                  <span className={styles.btnAbrirFluxo}>
                    <span>Abrir Fluxo</span>
                    <svg className={styles.arrowIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Criação / Edição de Processo */}
        {modalAberto && (
          <div className={styles.modalOverlay} onClick={fecharModal}>
            <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {editandoProcesso ? 'Editar Processo' : 'Novo Processo'}
                </h2>
              </div>

              <form onSubmit={handleSubmitProcesso}>
                <div className={styles.modalBody}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Nome do Processo *</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      placeholder="Ex: Recebimento de Mercadorias, CRM Comercial..."
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Setor / Departamento *</label>
                    <select
                      className={styles.formSelect}
                      value={setorIdForm}
                      onChange={e => setSetorIdForm(e.target.value)}
                      required
                    >
                      <option value="">Selecione um setor...</option>
                      {setoresDisponiveis.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Ícone de Identificação</label>
                    <div className={styles.iconGrid}>
                      {OPCOES_ICONES.map((op) => (
                        <button
                          key={op.id}
                          type="button"
                          className={`${styles.iconOptionBtn} ${iconeForm === op.id ? styles.iconOptionBtnActive : ''}`}
                          onClick={() => setIconeForm(op.id)}
                          title={op.rotulo}
                        >
                          <ProcessIcon iconKey={op.id} size={18} />
                          <span>{op.rotulo.split('/')[0].split('&')[0].trim()}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Descrição</label>
                    <textarea
                      className={styles.formTextarea}
                      placeholder="Descreva o objetivo ou fluxo deste processo..."
                      value={descricao}
                      onChange={e => setDescricao(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button type="button" className={styles.btnCancel} onClick={fecharModal}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.btnSave} disabled={salvando}>
                    {salvando ? 'Salvando...' : (editandoProcesso ? 'Salvar Alterações' : 'Criar Processo')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
