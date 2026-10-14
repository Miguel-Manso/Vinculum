import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useSetor } from '../context/SetorContext';
import api from '../services/api';
import styles from './Processos.module.css';

export default function Processos() {
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
    setModalAberto(true);
  }

  function abrirModalEditar(p) {
    setEditandoProcesso(p);
    setNome(p.nome);
    setDescricao(p.descricao || '');
    setSetorIdForm(p.setor_id ? String(p.setor_id) : (setoresDisponiveis[0]?.id ? String(setoresDisponiveis[0].id) : ''));
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditandoProcesso(null);
    setNome('');
    setDescricao('');
    setSetorIdForm('');
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
        });
      } else {
        await api.post('/processos', {
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          setor_id: parseInt(setorIdForm, 10),
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

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        {/* Header do Catálogo no padrão Stitch */}
        <section className={styles.pageHeader}>
          <div className={styles.pageHeaderText}>
            <div className={styles.headerBadgeRow}>
              <span className={styles.headerChip}>
                <span className={styles.chipPulseDot}></span>
                ARQUITETURA DE WORKFLOWS
              </span>
              <span className={styles.chipMeta}>
                {setorAtivo ? `Setor: ${setorAtivo.nome}` : `${setoresDisponiveis.length} Setores Mapeados`}
              </span>
            </div>
            <h1 className={styles.pageTitle}>Catálogo de Processos</h1>
            <p className={styles.pageSubtitle}>
              Organize os fluxos departamentais, etapas do kanban e tarefas da sua empresa com isolamento de acesso por setor.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button className={styles.btnPrimary} onClick={abrirModalCriar}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Novo Processo</span>
            </button>
          </div>
        </section>

        {/* Abas Superiores de Filtro por Setor */}
        <div className={styles.sectorTabsContainer}>
          <button
            type="button"
            className={`${styles.sectorTab} ${setorFiltroId === 'todos' ? styles.sectorTabActive : ''}`}
            onClick={() => handleSelecionarAba('todos')}
          >
            <span>Todos os Setores</span>
            <span className={styles.sectorTabBadge}>{processos.length}</span>
          </button>

          {setoresDisponiveis.map(setor => {
            const countSetor = processos.filter(p => String(p.setor_id) === String(setor.id)).length;
            return (
              <button
                key={setor.id}
                type="button"
                className={`${styles.sectorTab} ${setorFiltroId === String(setor.id) ? styles.sectorTabActive : ''}`}
                onClick={() => handleSelecionarAba(String(setor.id))}
              >
                <span
                  className={styles.sectorTabDot}
                  style={{ backgroundColor: setor.cor || '#2fd9f4' }}
                />
                <span>{setor.nome}</span>
                <span className={styles.sectorTabBadge}>{countSetor}</span>
              </button>
            );
          })}
        </div>

        {/* Banner Strip de Estatísticas Rápidas do Stitch */}
        <section className={styles.quickStatStrip}>
          <div className={styles.statCol}>
            <span className={styles.statColLabel}>Processos no Setor</span>
            <div className={styles.statColValueRow}>
              <span className={styles.statColValue}>
                {loading ? '—' : String(processosFiltrados.length).padStart(2, '0')}
              </span>
              <span className={styles.statColBadgeGreen}>
                {setorFiltroId === 'todos' ? 'Visão Geral' : 'Setor Ativo'}
              </span>
            </div>
          </div>

          <div className={styles.statCol}>
            <span className={styles.statColLabel}>Tarefas em Execução</span>
            <div className={styles.statColValueRow}>
              <span className={styles.statColValue}>
                {loading ? '—' : processosFiltrados.reduce((acc, p) => acc + (parseInt(p.tarefas, 10) || 0), 0)}
              </span>
              <span className={styles.statColBadgeMuted}>tarefas ativas</span>
            </div>
          </div>

          <div className={styles.statCol}>
            <span className={styles.statColLabel}>Etapas Totais</span>
            <div className={styles.statColValueRow}>
              <span className={styles.statColValue}>
                {loading ? '—' : processosFiltrados.reduce((acc, p) => acc + (parseInt(p.etapas, 10) || 0), 0)}
              </span>
              <span className={styles.statColBadgeMuted}>colunas kanban</span>
            </div>
          </div>
        </section>

        {/* Toolbar de Busca e Filtro */}
        <div className={styles.searchToolbar}>
          <div className={styles.searchBarWrap}>
            <svg className={styles.searchBarIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className={styles.searchBarInput}
              type="text"
              placeholder="Buscar processo por nome, setor ou descrição..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            {busca ? (
              <button
                type="button"
                className={styles.btnClearSearch}
                onClick={() => setBusca('')}
                title="Limpar busca"
              >
                ✕
              </button>
            ) : (
              <span className={styles.kbdShortcut}>ESC</span>
            )}
          </div>
        </div>

        {busca && (
          <div className={styles.searchMeta}>
            Exibindo {processosFiltrados.length} de {processos.length} processos encontrados
          </div>
        )}

        {loading ? (
          <div className={styles.loadingBox}>Carregando catálogo de processos...</div>
        ) : processos.length === 0 ? (
          <div className={styles.emptyStateBox}>
            <p className={styles.emptyStateTitle}>Nenhum processo cadastrado ou acessível nos seus setores.</p>
            <p className={styles.emptyStateDesc}>Crie fluxos de trabalho visuais para padronizar as operações da sua equipe.</p>
            <button className={styles.btnPrimary} onClick={abrirModalCriar}>
              Criar meu primeiro processo
            </button>
          </div>
        ) : processosFiltrados.length === 0 ? (
          <div className={styles.emptyStateBox}>
            <p className={styles.emptyStateTitle}>
              Nenhum processo corresponde aos filtros selecionados.
            </p>
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
            {processosFiltrados.map((p, idx) => (
              <div key={p.id} className={styles.card}>
                <div className={styles.cardMainContent}>
                  <div className={styles.cardTop}>
                    <div className={styles.cardHeaderLeft}>
                      <div className={styles.cardIconWrap}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {idx % 3 === 0 ? (
                            <>
                              <line x1="12" y1="20" x2="12" y2="10" />
                              <line x1="18" y1="20" x2="18" y2="4" />
                              <line x1="6" y1="20" x2="6" y2="16" />
                            </>
                          ) : idx % 3 === 1 ? (
                            <>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </>
                          ) : (
                            <>
                              <circle cx="12" cy="12" r="3" />
                              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </>
                          )}
                        </svg>
                      </div>
                      <div className={styles.cardTitleWrap}>
                        <span
                          className={styles.cardDeptBadge}
                          style={{
                            backgroundColor: `${p.setor_cor || '#2fd9f4'}18`,
                            color: p.setor_cor || '#2fd9f4',
                            border: `1px solid ${p.setor_cor || '#2fd9f4'}44`,
                          }}
                        >
                          <span
                            className={styles.deptDot}
                            style={{ backgroundColor: p.setor_cor || '#2fd9f4' }}
                          />
                          {p.setor_nome || 'Geral'}
                        </span>
                        <h2 className={styles.cardNome}>{p.nome}</h2>
                      </div>
                    </div>

                    <div className={styles.cardQuickActions}>
                      <button
                        className={styles.btnIconQuick}
                        onClick={() => abrirModalEditar(p)}
                        title="Editar processo"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>

                      <button
                        className={styles.btnIconQuickDanger}
                        onClick={() => handleExcluir(p)}
                        title="Excluir processo"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <p className={styles.cardDesc}>
                    {p.descricao || 'Fluxo operacional sem descrição detalhada informada.'}
                  </p>

                  <div className={styles.cardMetricsRibbon}>
                    <span className={styles.metricItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="18" rx="1" />
                        <rect x="14" y="3" width="7" height="18" rx="1" />
                      </svg>
                      <span>{p.etapas || 0} etapas</span>
                    </span>

                    <span className={styles.metricItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span>{p.tarefas || 0} tarefas</span>
                    </span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.avatarMiniGroup}>
                    <div
                      className={styles.miniAvatar}
                      style={{ borderColor: p.setor_cor || '#2fd9f4', color: p.setor_cor || '#2fd9f4' }}
                      title={`Setor: ${p.setor_nome || 'Geral'}`}
                    >
                      {(p.setor_nome || 'G').charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <Link to={`/processos/${p.id}/fluxo`} className={styles.btnAbrirFluxo}>
                    <span>Abrir Fluxo</span>
                    <svg className={styles.arrowIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
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
