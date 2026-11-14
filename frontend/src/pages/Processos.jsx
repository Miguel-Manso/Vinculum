import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import FeatureCards from '../components/FeatureCards';
import SidebarTrigger from '../components/SidebarTrigger';
import ProcessIcon, { OPCOES_ICONES, getProcessIconKey } from '../components/ProcessIcon';
import { useSetor } from '../context/SetorContext';
import api from '../services/api';
import styles from './Processos.module.css';
import { toast, confirmDialog } from '../components/feedback/feedback';
import {
  FilterToggle, FilterPanel, FilterField, FilterSelect, FilterSegment, ActiveFilters,
} from '../components/FilterPanel';

const FILTROS_INICIAIS = { icone: '', volume: '', etapas: '', ordenar: 'nome' };

const OPCOES_VOLUME = [
  { value: '', label: 'Todos' },
  { value: 'com', label: 'Com tarefas' },
  { value: 'sem', label: 'Vazios' },
];
const OPCOES_ETAPAS = [
  { value: '', label: 'Todas' },
  { value: '1-3', label: '1–3' },
  { value: '4-6', label: '4–6' },
  { value: '7+', label: '7+' },
];
const OPCOES_ORDENAR = [
  { value: 'nome', label: 'Nome (A–Z)' },
  { value: 'nome-desc', label: 'Nome (Z–A)' },
  { value: 'tarefas', label: 'Mais tarefas' },
  { value: 'etapas', label: 'Mais etapas' },
  { value: 'recentes', label: 'Mais recentes' },
];

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

  // Painel de filtros avançados
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
  const setFiltro = (chave, valor) => setFiltros(f => ({ ...f, [chave]: valor }));

  // Filtra processos por busca, setor e filtros avançados; depois ordena
  const processosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    const lista = processos.filter(p => {
      // Filtro por setor
      if (setorFiltroId !== 'todos') {
        if (String(p.setor_id) !== String(setorFiltroId)) return false;
      }

      // Tipo (ícone)
      if (filtros.icone && (p.icone || getProcessIconKey(p)) !== filtros.icone) return false;

      // Volume de tarefas
      const nTarefas = parseInt(p.tarefas, 10) || 0;
      if (filtros.volume === 'com' && nTarefas === 0) return false;
      if (filtros.volume === 'sem' && nTarefas > 0) return false;

      // Quantidade de etapas
      const nEtapas = parseInt(p.etapas, 10) || 0;
      if (filtros.etapas === '1-3' && (nEtapas < 1 || nEtapas > 3)) return false;
      if (filtros.etapas === '4-6' && (nEtapas < 4 || nEtapas > 6)) return false;
      if (filtros.etapas === '7+' && nEtapas < 7) return false;

      // Filtro por termo de busca
      if (!termo) return true;

      return (
        p.nome?.toLowerCase().includes(termo) ||
        (p.descricao && p.descricao.toLowerCase().includes(termo)) ||
        (p.setor_nome && p.setor_nome.toLowerCase().includes(termo))
      );
    });

    const num = v => parseInt(v, 10) || 0;
    const porNome = (a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
    switch (filtros.ordenar) {
      case 'nome-desc': return lista.sort((a, b) => porNome(b, a));
      case 'tarefas':   return lista.sort((a, b) => num(b.tarefas) - num(a.tarefas) || porNome(a, b));
      case 'etapas':    return lista.sort((a, b) => num(b.etapas) - num(a.etapas) || porNome(a, b));
      case 'recentes':  return lista.sort((a, b) => num(b.id) - num(a.id));
      default:          return lista.sort(porNome);
    }
  }, [processos, setorFiltroId, busca, filtros]);

  function limparFiltros() {
    setBusca('');
    setFiltros(FILTROS_INICIAIS);
    handleSelecionarAba('todos');
  }

  // Chips dos filtros aplicados (ordenação não conta como filtro)
  const chipsAtivos = [];
  if (busca.trim()) chipsAtivos.push({ id: 'busca', label: `Busca: "${busca.trim()}"`, onRemove: () => setBusca('') });
  if (setorFiltroId !== 'todos') {
    const s = setoresDisponiveis.find(x => String(x.id) === String(setorFiltroId));
    chipsAtivos.push({ id: 'setor', label: `Setor: ${s?.nome || '—'}`, onRemove: () => handleSelecionarAba('todos') });
  }
  if (filtros.icone) {
    const op = OPCOES_ICONES.find(o => o.id === filtros.icone);
    chipsAtivos.push({ id: 'icone', label: `Tipo: ${op?.rotulo || filtros.icone}`, onRemove: () => setFiltro('icone', '') });
  }
  if (filtros.volume) chipsAtivos.push({ id: 'volume', label: filtros.volume === 'com' ? 'Com tarefas' : 'Sem tarefas', onRemove: () => setFiltro('volume', '') });
  if (filtros.etapas) chipsAtivos.push({ id: 'etapas', label: `Etapas: ${filtros.etapas}`, onRemove: () => setFiltro('etapas', '') });
  const totalFiltrosAtivos = chipsAtivos.length;

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
      toast.warning('Por favor, selecione um setor para vincular o processo.');
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
      toast.error(err.response?.data?.error || 'Erro ao salvar processo');
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(p) {
    if (!await confirmDialog({ title: `Excluir o processo "${p.nome}"?`, message: 'Todas as etapas e tarefas vinculadas serão excluídas. Esta ação não pode ser desfeita.', confirmLabel: 'Excluir processo', tone: 'danger' })) {
      return;
    }

    try {
      await api.delete(`/processos/${p.id}`);
      await Promise.all([carregarProcessos(), recarregarSetores()]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao excluir processo');
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
        <header className={`${styles.minimalHeader} page-hero`}>
          <div className={styles.headerLeft}>
            <SidebarTrigger />
            <h1 className={styles.pageTitle}>Processos.</h1>
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
              <span>Novo processo</span>
            </button>
          </div>
        </header>

        {/* Barra de Filtros Minimalista */}
        <div className={styles.cleanToolbar}>
          <div className={styles.searchRow}>
          {/* Pesquisa */}
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Buscar processos"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            {busca && (
              <button className={styles.btnClearSearch} onClick={() => setBusca('')}>
                ×
              </button>
            )}
          </div>

          <FilterToggle
            open={filtrosAbertos}
            onClick={() => setFiltrosAbertos(v => !v)}
            count={totalFiltrosAtivos}
          />
          </div>

          {/* Abas Rápidas de Setor */}
          <div className={styles.sectorPills}>
            <button
              type="button"
              className={`${styles.pillBtn} ${setorFiltroId === 'todos' ? styles.pillBtnActive : ''}`}
              onClick={() => handleSelecionarAba('todos')}
            >
              <span>Todos</span>
              <span className={styles.pillCount}>{processos.length}</span>
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
                  <span className={styles.pillDot} style={{ backgroundColor: setor.cor || '#45c4d6' }} />
                  <span>{setor.nome}</span>
                  <span className={styles.pillCount}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <FilterPanel
          open={filtrosAbertos}
          onClose={() => setFiltrosAbertos(false)}
          subtitle="Refine a lista por setor, tipo, volume de trabalho e ordene como preferir."
          activeCount={totalFiltrosAtivos}
          resultCount={processosFiltrados.length}
          totalCount={processos.length}
          resultNoun={['processo', 'processos']}
          onClear={limparFiltros}
        >
          <FilterField label="Setor">
            <FilterSelect
              value={setorFiltroId === 'todos' ? '' : setorFiltroId}
              onChange={v => handleSelecionarAba(v || 'todos')}
              placeholder="Todos os setores"
              options={setoresDisponiveis.map(s => ({ value: String(s.id), label: s.nome }))}
              ariaLabel="Filtrar por setor"
            />
          </FilterField>
          <FilterField label="Tipo de processo">
            <FilterSelect
              value={filtros.icone}
              onChange={v => setFiltro('icone', v)}
              placeholder="Todos os tipos"
              options={OPCOES_ICONES.map(o => ({ value: o.id, label: o.rotulo }))}
              ariaLabel="Filtrar por tipo"
            />
          </FilterField>
          <FilterField label="Volume de tarefas">
            <FilterSegment value={filtros.volume} onChange={v => setFiltro('volume', v)} options={OPCOES_VOLUME} ariaLabel="Volume de tarefas" />
          </FilterField>
          <FilterField label="Quantidade de etapas">
            <FilterSegment value={filtros.etapas} onChange={v => setFiltro('etapas', v)} options={OPCOES_ETAPAS} ariaLabel="Quantidade de etapas" />
          </FilterField>
          <FilterField label="Ordenar por">
            <FilterSelect
              value={filtros.ordenar}
              onChange={v => setFiltro('ordenar', v)}
              placeholder={null}
              options={OPCOES_ORDENAR}
              ariaLabel="Ordenar processos"
            />
          </FilterField>
        </FilterPanel>

        <ActiveFilters chips={chipsAtivos} onClearAll={limparFiltros} />

        {/* Grid de Cards dos Processos */}
        {loading ? (
          <div className={styles.loadingBox}>Carregando processos...</div>
        ) : processos.length === 0 ? (
          <section className={styles.onboarding}>
            <div className={styles.onboardingHeader}>
              <h2 className={styles.onboardingTitle}>Comece pelo primeiro processo</h2>
              <p className={styles.emptyStateDesc}>Um processo é o caminho que um trabalho percorre na sua equipe, dividido em etapas.</p>
              <button className={styles.btnPrimary} onClick={abrirModalCriar}>
                Criar primeiro processo
              </button>
            </div>
            <FeatureCards />
          </section>
        ) : processosFiltrados.length === 0 ? (
          <div className={styles.emptyStateBox}>
            <p className={styles.emptyStateTitle}>Nenhum processo corresponde aos filtros selecionados.</p>
            <button
              type="button"
              className={styles.btnLimparBusca}
              onClick={limparFiltros}
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
                      title={`Processo: ${p.nome}`}
                    >
                      <ProcessIcon processo={p} size={18} />
                    </div>

                    <div className={styles.cardDeptRow}>
                      <span
                        className={styles.deptDot}
                        style={{ backgroundColor: p.setor_cor || '#45c4d6' }}
                      />
                      <span className={styles.cardDeptName}>
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
                    <span>Abrir</span>
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
        <Modal open={Boolean(modalAberto)} onClose={fecharModal} maxWidth={500}>
          {modalAberto && (
            <>
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
            </>
          )}
        </Modal>
      </main>
    </div>
  );
}
