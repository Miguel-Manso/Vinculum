import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useSetor } from '../context/SetorContext';
import api from '../services/api';
import styles from './Tabela.module.css';

/**
 * Subcomponente de Combobox / Popover Minimalista com busca interna e multi-seleção
 */
function FilterPopover({
  label,
  icon,
  selectedValues,
  options,
  isOpen,
  onToggle,
  onSelectAll,
  onClear,
  onToggleItem,
  onClose,
  searchPlaceholder = 'Buscar...',
  alignRight = false,
}) {
  const [internalSearch, setInternalSearch] = useState('');
  const popoverRef = useRef(null);

  const filteredOptions = useMemo(() => {
    if (!internalSearch.trim()) return options;
    const q = internalSearch.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, internalSearch]);

  const countSelected = selectedValues.length;

  return (
    <div className={styles.filterPopoverContainer} ref={popoverRef}>
      <button
        type="button"
        className={`${styles.filterTriggerBtn} ${countSelected > 0 ? styles.filterTriggerBtnActive : ''} ${isOpen ? styles.filterTriggerBtnOpen : ''}`}
        onClick={onToggle}
      >
        <span className={styles.filterTriggerIcon}>{icon}</span>
        <span className={styles.filterTriggerLabel}>{label}</span>
        {countSelected > 0 && (
          <span className={styles.filterTriggerBadge}>{countSelected}</span>
        )}
        <svg
          className={`${styles.filterChevron} ${isOpen ? styles.filterChevronOpen : ''}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className={`${styles.popoverDropdown} ${alignRight ? styles.popoverAlignRight : ''}`}>
          <div className={styles.popoverHeader}>
            <span className={styles.popoverTitle}>{label}</span>
            <div className={styles.popoverHeaderActions}>
              <button
                type="button"
                className={styles.popoverLinkBtn}
                onClick={onSelectAll}
                title="Selecionar todos os itens"
              >
                Todos
              </button>
              <span className={styles.popoverActionSep}>•</span>
              <button
                type="button"
                className={styles.popoverLinkBtn}
                onClick={onClear}
                title="Limpar seleção"
              >
                Limpar
              </button>
            </div>
          </div>

          <div className={styles.popoverSearchBox}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              autoFocus
              className={styles.popoverSearchInput}
              placeholder={searchPlaceholder}
              value={internalSearch}
              onChange={e => setInternalSearch(e.target.value)}
            />
            {internalSearch && (
              <button
                type="button"
                className={styles.popoverClearSearchBtn}
                onClick={() => setInternalSearch('')}
              >
                ×
              </button>
            )}
          </div>

          <div className={styles.popoverList}>
            {filteredOptions.length === 0 ? (
              <div className={styles.popoverEmpty}>Nenhuma opção encontrada</div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={`${styles.popoverItem} ${isSelected ? styles.popoverItemActive : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleItem(opt.value)}
                      className={styles.popoverCheckbox}
                    />
                    {opt.color && (
                      <span
                        className={styles.popoverOptionDot}
                        style={{ backgroundColor: opt.color }}
                      />
                    )}
                    <span className={styles.popoverOptionLabel} title={opt.label}>
                      {opt.label}
                    </span>
                    <span className={styles.popoverOptionCount}>{opt.count}</span>
                  </label>
                );
              })
            )}
          </div>

          <div className={styles.popoverFooter}>
            <span className={styles.popoverFooterSummary}>
              {countSelected === 0 ? 'Nenhum item' : `${countSelected} marcado(s)`}
            </span>
            <button
              type="button"
              className={styles.popoverDoneBtn}
              onClick={onClose}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Subcomponente de Prazo & Período Minimalista
 */
function PrazoPopover({
  isOpen,
  onToggle,
  onClose,
  preset,
  dataDe,
  dataAte,
  onSetPreset,
  onSetDataDe,
  onSetDataAte,
  onClear,
}) {
  const isFiltered = Boolean(preset || dataDe || dataAte);

  return (
    <div className={styles.filterPopoverContainer}>
      <button
        type="button"
        className={`${styles.filterTriggerBtn} ${isFiltered ? styles.filterTriggerBtnActive : ''} ${isOpen ? styles.filterTriggerBtnOpen : ''}`}
        onClick={onToggle}
      >
        <span className={styles.filterTriggerIcon}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
        <span className={styles.filterTriggerLabel}>Prazo</span>
        {isFiltered && <span className={styles.filterTriggerBadge}>Ativo</span>}
        <svg
          className={`${styles.filterChevron} ${isOpen ? styles.filterChevronOpen : ''}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className={`${styles.popoverDropdown} ${styles.prazoDropdown}`}>
          <div className={styles.popoverHeader}>
            <span className={styles.popoverTitle}>Filtrar por Vencimento</span>
            {isFiltered && (
              <button
                type="button"
                className={styles.popoverLinkBtn}
                onClick={onClear}
              >
                Limpar
              </button>
            )}
          </div>

          <div className={styles.prazoPresetsList}>
            {[
              { id: 'atrasado', label: '⚠️ Atrasadas' },
              { id: 'hoje', label: '📅 Vence Hoje' },
              { id: '7dias', label: '⏳ Próximos 7d' },
              { id: '30dias', label: '🗓️ Próximos 30d' },
              { id: 'com_prazo', label: '✓ Com Prazo' },
              { id: 'sem_prazo', label: '— Sem Prazo' },
            ].map(p => (
              <button
                key={p.id}
                type="button"
                className={`${styles.prazoPresetBtn} ${preset === p.id ? styles.prazoPresetBtnActive : ''}`}
                onClick={() => onSetPreset(preset === p.id ? '' : p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className={styles.prazoCustomDivider}>
            <span>ou intervalo</span>
          </div>

          <div className={styles.prazoDateInputsRow}>
            <div className={styles.prazoDateInputWrap}>
              <label className={styles.prazoDateLabel}>De:</label>
              <input
                type="date"
                value={dataDe}
                onChange={e => onSetDataDe(e.target.value)}
                className={styles.prazoInputDate}
              />
            </div>
            <div className={styles.prazoDateInputWrap}>
              <label className={styles.prazoDateLabel}>Até:</label>
              <input
                type="date"
                value={dataAte}
                onChange={e => onSetDataAte(e.target.value)}
                className={styles.prazoInputDate}
              />
            </div>
          </div>

          <div className={styles.popoverFooter}>
            <button
              type="button"
              className={styles.popoverDoneBtn}
              onClick={onClose}
              style={{ width: '100%' }}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Tabela() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { setorAtivo } = useSetor();

  const [tarefas, setTarefas] = useState([]);
  const [campos, setCampos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroQuickView, setFiltroQuickView] = useState('todas'); // todas, minhas, pendente, atrasada, concluida
  const [filtrosSetor, setFiltrosSetor] = useState(() => (setorAtivo?.nome ? [setorAtivo.nome] : []));
  const [filtrosProcesso, setFiltrosProcesso] = useState([]);
  const [filtrosEtapa, setFiltrosEtapa] = useState([]);
  const [filtrosResponsavel, setFiltrosResponsavel] = useState([]);
  const [filtroPrazoPreset, setFiltroPrazoPreset] = useState('');
  const [filtroDataDe, setFiltroDataDe] = useState('');
  const [filtroDataAte, setFiltroDataAte] = useState('');

  // Dropdown aberto
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownContainerRef = useRef(null);

  // Ordenação e Paginação
  const [ordenacao, setOrdenacao] = useState({ campo: 'criado_em', dir: 'desc' });
  const [itensPorPagina, setItensPorPagina] = useState(15);
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Sincroniza com setor ativo global
  useEffect(() => {
    if (setorAtivo?.nome) {
      setFiltrosSetor([setorAtivo.nome]);
    }
  }, [setorAtivo]);

  // Carrega dados da API
  useEffect(() => {
    setLoading(true);
    Promise.all([api.get('/tarefas'), api.get('/campos')])
      .then(([resTarefas, resCampos]) => {
        setTarefas(resTarefas.data || []);
        setCampos(resCampos.data || []);
      })
      .catch(err => console.error('Erro ao carregar tabela:', err))
      .finally(() => setLoading(false));
  }, []);

  // Fechar dropdown ao clicar fora ou apertar ESC
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (openDropdown) setOpenDropdown(null);
        else if (busca) setBusca('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDropdown, busca]);

  // Helpers de status
  function isConcluida(t) {
    if (t.concluida === 1 || t.concluida === true) return true;
    const nome = (t.etapa_nome || '').toLowerCase();
    return nome.includes('finaliz') || nome.includes('concluíd') || nome.includes('concluid');
  }

  function getDiffDias(prazoStr) {
    if (!prazoStr) return null;
    const [ano, mes, dia] = prazoStr.split('T')[0].split('-').map(Number);
    const prazoDate = new Date(ano, mes - 1, dia);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return Math.round((prazoDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  }

  function isAtrasada(t) {
    if (isConcluida(t) || !t.prazo) return false;
    const diff = getDiffDias(t.prazo);
    return diff !== null && diff < 0;
  }

  function isHoje(t) {
    if (!t.prazo) return false;
    const diff = getDiffDias(t.prazo);
    return diff === 0;
  }

  function isUrgente(t) {
    return t.urgente === 1 || t.urgente === true || t.urgente === '1';
  }

  const mapaCampos = useMemo(() => {
    const mapa = {};
    campos.forEach(c => { mapa[c.id] = c; });
    return mapa;
  }, [campos]);

  // Opções para cada Dropdown com contagem
  const opcoesSetor = useMemo(() => {
    const contadores = {};
    const cores = {};
    tarefas.forEach(t => {
      const s = t.setor_nome || 'Geral';
      contadores[s] = (contadores[s] || 0) + 1;
      if (t.setor_cor) cores[s] = t.setor_cor;
    });

    return Object.keys(contadores).sort().map(s => ({
      value: s,
      label: s,
      count: contadores[s],
      color: cores[s] || '#2fd9f4'
    }));
  }, [tarefas]);

  const opcoesProcesso = useMemo(() => {
    const contadores = {};
    let base = tarefas;
    if (filtrosSetor.length > 0) base = base.filter(t => filtrosSetor.includes(t.setor_nome));
    base.forEach(t => {
      if (t.processo_nome) contadores[t.processo_nome] = (contadores[t.processo_nome] || 0) + 1;
    });
    return Object.keys(contadores).sort().map(p => ({
      value: p,
      label: p,
      count: contadores[p]
    }));
  }, [tarefas, filtrosSetor]);

  const opcoesEtapa = useMemo(() => {
    const contadores = {};
    let base = tarefas;
    if (filtrosProcesso.length > 0) base = base.filter(t => filtrosProcesso.includes(t.processo_nome));
    else if (filtrosSetor.length > 0) base = base.filter(t => filtrosSetor.includes(t.setor_nome));
    base.forEach(t => {
      if (t.etapa_nome) contadores[t.etapa_nome] = (contadores[t.etapa_nome] || 0) + 1;
    });
    return Object.keys(contadores).sort().map(e => ({
      value: e,
      label: e,
      count: contadores[e]
    }));
  }, [tarefas, filtrosProcesso, filtrosSetor]);

  const opcoesResponsavel = useMemo(() => {
    const contadores = {};
    tarefas.forEach(t => {
      const r = t.responsavel_nome || 'Não atribuído';
      contadores[r] = (contadores[r] || 0) + 1;
    });
    return Object.keys(contadores).sort().map(r => ({
      value: r,
      label: r,
      count: contadores[r]
    }));
  }, [tarefas]);

  // Contagens dos Quick Views
  const contagensQuickView = useMemo(() => {
    let base = tarefas;
    if (filtrosSetor.length > 0) {
      base = base.filter(t => filtrosSetor.includes(t.setor_nome));
    }
    const userName = (usuario?.nome || '').toLowerCase();
    const userId = usuario?.id;

    const minhas = base.filter(t => {
      if (userId && t.responsavel_id === userId) return true;
      if (userName && t.responsavel_nome && t.responsavel_nome.toLowerCase().includes(userName)) return true;
      return false;
    }).length;

    return {
      todas: base.length,
      minhas,
      pendente: base.filter(t => !isConcluida(t)).length,
      atrasada: base.filter(t => isAtrasada(t)).length,
      concluida: base.filter(t => isConcluida(t)).length,
    };
  }, [tarefas, filtrosSetor, usuario]);

  // Filtragem Multicritério
  const tarefasFiltradas = useMemo(() => {
    const userName = (usuario?.nome || '').toLowerCase();
    const userId = usuario?.id;

    return tarefas.filter(t => {
      if (busca.trim()) {
        const q = busca.toLowerCase();
        let matchCampos = false;
        if (t.campos_personalizados) {
          matchCampos = String(t.campos_personalizados).toLowerCase().includes(q);
        }
        const matchGeral =
          `#${t.id}`.includes(q) ||
          String(t.id).includes(q) ||
          (t.titulo && t.titulo.toLowerCase().includes(q)) ||
          (t.descricao && t.descricao.toLowerCase().includes(q)) ||
          (t.setor_nome && t.setor_nome.toLowerCase().includes(q)) ||
          (t.processo_nome && t.processo_nome.toLowerCase().includes(q)) ||
          (t.etapa_nome && t.etapa_nome.toLowerCase().includes(q)) ||
          (t.responsavel_nome && t.responsavel_nome.toLowerCase().includes(q)) ||
          matchCampos;
        if (!matchGeral) return false;
      }

      if (filtroQuickView === 'minhas') {
        const isMinha = (userId && t.responsavel_id === userId) ||
          (userName && t.responsavel_nome && t.responsavel_nome.toLowerCase().includes(userName));
        if (!isMinha) return false;
      } else if (filtroQuickView === 'pendente') {
        if (isConcluida(t)) return false;
      } else if (filtroQuickView === 'atrasada') {
        if (!isAtrasada(t)) return false;
      } else if (filtroQuickView === 'concluida') {
        if (!isConcluida(t)) return false;
      }

      if (filtrosSetor.length > 0 && !filtrosSetor.includes(t.setor_nome || 'Geral')) return false;
      if (filtrosProcesso.length > 0 && !filtrosProcesso.includes(t.processo_nome)) return false;
      if (filtrosEtapa.length > 0 && !filtrosEtapa.includes(t.etapa_nome)) return false;
      if (filtrosResponsavel.length > 0 && !filtrosResponsavel.includes(t.responsavel_nome || 'Não atribuído')) return false;

      if (filtroPrazoPreset) {
        const diff = getDiffDias(t.prazo);
        if (filtroPrazoPreset === 'atrasado' && !isAtrasada(t)) return false;
        if (filtroPrazoPreset === 'hoje' && !isHoje(t)) return false;
        if (filtroPrazoPreset === '7dias' && (!t.prazo || diff === null || diff < 0 || diff > 7)) return false;
        if (filtroPrazoPreset === '30dias' && (!t.prazo || diff === null || diff < 0 || diff > 30)) return false;
        if (filtroPrazoPreset === 'com_prazo' && !t.prazo) return false;
        if (filtroPrazoPreset === 'sem_prazo' && t.prazo) return false;
      }

      if (filtroDataDe || filtroDataAte) {
        if (!t.prazo) return false;
        const prazoDia = t.prazo.split('T')[0];
        if (filtroDataDe && prazoDia < filtroDataDe) return false;
        if (filtroDataAte && prazoDia > filtroDataAte) return false;
      }

      return true;
    }).sort((a, b) => {
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
      } else if (ordenacao.campo === 'situacao') {
        va = isConcluida(a) ? 2 : isAtrasada(a) ? 0 : 1;
        vb = isConcluida(b) ? 2 : isAtrasada(b) ? 0 : 1;
        return ordenacao.dir === 'asc' ? va - vb : vb - va;
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
  }, [
    tarefas,
    busca,
    filtroQuickView,
    filtrosSetor,
    filtrosProcesso,
    filtrosEtapa,
    filtrosResponsavel,
    filtroPrazoPreset,
    filtroDataDe,
    filtroDataAte,
    ordenacao,
    usuario
  ]);

  // Resumo de métricas minimalistas inline
  const resumoMinimalista = useMemo(() => {
    const total = tarefasFiltradas.length;
    const pendentes = tarefasFiltradas.filter(t => !isConcluida(t)).length;
    const atrasadas = tarefasFiltradas.filter(t => isAtrasada(t)).length;
    const concluidas = tarefasFiltradas.filter(t => isConcluida(t)).length;
    return { total, pendentes, atrasadas, concluidas };
  }, [tarefasFiltradas]);

  // Colunas dinâmicas quando exatamente 1 processo estiver filtrado
  const camposProcessoAtual = useMemo(() => {
    if (filtrosProcesso.length === 1) {
      return campos.filter(c => c.processo_nome === filtrosProcesso[0]);
    }
    return [];
  }, [campos, filtrosProcesso]);

  // Paginação
  const totalPaginas = Math.ceil(tarefasFiltradas.length / (itensPorPagina === 'todos' ? tarefasFiltradas.length || 1 : itensPorPagina));
  const tarefasPaginadas = useMemo(() => {
    if (itensPorPagina === 'todos') return tarefasFiltradas;
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return tarefasFiltradas.slice(inicio, inicio + itensPorPagina);
  }, [tarefasFiltradas, paginaAtual, itensPorPagina]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [
    busca,
    filtroQuickView,
    filtrosSetor,
    filtrosProcesso,
    filtrosEtapa,
    filtrosResponsavel,
    filtroPrazoPreset,
    filtroDataDe,
    filtroDataAte,
    itensPorPagina
  ]);

  function toggleOrdenacao(campo) {
    setOrdenacao(prev =>
      prev.campo === campo
        ? { campo, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { campo, dir: 'asc' }
    );
  }

  function renderSetaOrdenacao(campo) {
    const isAtivo = ordenacao.campo === campo;
    return (
      <span className={`${styles.sortIcon} ${isAtivo ? styles.sortIconActive : ''}`}>
        {isAtivo ? (ordenacao.dir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    );
  }

  function handleToggleSetor(s) {
    setFiltrosSetor(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }
  function handleToggleProcesso(p) {
    setFiltrosProcesso(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }
  function handleToggleEtapa(e) {
    setFiltrosEtapa(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  }
  function handleToggleResponsavel(r) {
    setFiltrosResponsavel(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  }

  function limparTodosFiltros() {
    setBusca('');
    setFiltroQuickView('todas');
    setFiltrosSetor([]);
    setFiltrosProcesso([]);
    setFiltrosEtapa([]);
    setFiltrosResponsavel([]);
    setFiltroPrazoPreset('');
    setFiltroDataDe('');
    setFiltroDataAte('');
    setOpenDropdown(null);
  }

  const tagsAtivas = useMemo(() => {
    const tags = [];
    if (busca.trim()) tags.push({ id: 'busca', label: `Busca: "${busca}"`, clear: () => setBusca('') });
    if (filtroQuickView !== 'todas') {
      const labels = {
        minhas: 'Minhas Tarefas',
        pendente: 'Pendentes',
        atrasada: 'Atrasadas',
        concluida: 'Concluídas',
      };
      tags.push({ id: 'quickView', label: labels[filtroQuickView] || filtroQuickView, clear: () => setFiltroQuickView('todas') });
    }
    if (filtrosSetor.length > 0) {
      tags.push({
        id: 'setor',
        label: `Setor: ${filtrosSetor.join(', ')}`,
        clear: () => setFiltrosSetor([])
      });
    }
    if (filtrosProcesso.length > 0) {
      tags.push({
        id: 'processo',
        label: `Processo: ${filtrosProcesso.join(', ')}`,
        clear: () => setFiltrosProcesso([])
      });
    }
    if (filtrosEtapa.length > 0) {
      tags.push({
        id: 'etapa',
        label: `Etapa: ${filtrosEtapa.join(', ')}`,
        clear: () => setFiltrosEtapa([])
      });
    }
    if (filtrosResponsavel.length > 0) {
      tags.push({
        id: 'responsavel',
        label: `Resp: ${filtrosResponsavel.join(', ')}`,
        clear: () => setFiltrosResponsavel([])
      });
    }
    if (filtroPrazoPreset) {
      const pLabels = {
        atrasado: 'Atrasadas',
        hoje: 'Hoje',
        '7dias': 'Próximos 7d',
        '30dias': 'Próximos 30d',
        com_prazo: 'Com prazo',
        sem_prazo: 'Sem prazo',
      };
      tags.push({ id: 'prazo', label: `Prazo: ${pLabels[filtroPrazoPreset] || filtroPrazoPreset}`, clear: () => setFiltroPrazoPreset('') });
    }
    if (filtroDataDe || filtroDataAte) {
      tags.push({
        id: 'datas',
        label: `Período: ${filtroDataDe || '...'} a ${filtroDataAte || '...'}`,
        clear: () => { setFiltroDataDe(''); setFiltroDataAte(''); }
      });
    }
    return tags;
  }, [busca, filtroQuickView, filtrosSetor, filtrosProcesso, filtrosEtapa, filtrosResponsavel, filtroPrazoPreset, filtroDataDe, filtroDataAte]);

  function exportarCSV() {
    if (tarefasFiltradas.length === 0) {
      alert('Nenhuma tarefa para exportar.');
      return;
    }

    const headers = ['ID', 'Título', 'Setor', 'Processo', 'Etapa', 'Responsável', 'Situação', 'Prazo', 'Criado Em'];
    if (camposProcessoAtual.length > 0) {
      camposProcessoAtual.forEach(c => headers.push(c.nome));
    } else {
      headers.push('Campos Personalizados');
    }

    const rows = tarefasFiltradas.map(t => {
      const situacao = isConcluida(t) ? 'Concluída' : isAtrasada(t) ? 'Atrasada' : 'Em Andamento';
      const prazoFormatado = t.prazo ? new Date(t.prazo).toLocaleDateString('pt-BR') : '';
      const criadoFormatado = t.criado_em ? new Date(t.criado_em).toLocaleDateString('pt-BR') : '';

      const baseRow = [
        t.id,
        `"${(t.titulo || '').replace(/"/g, '""')}"`,
        `"${(t.setor_nome || '').replace(/"/g, '""')}"`,
        `"${(t.processo_nome || '').replace(/"/g, '""')}"`,
        `"${(t.etapa_nome || '').replace(/"/g, '""')}"`,
        `"${(t.responsavel_nome || 'Não atribuído').replace(/"/g, '""')}"`,
        `"${situacao}"`,
        `"${prazoFormatado}"`,
        `"${criadoFormatado}"`
      ];

      if (camposProcessoAtual.length > 0) {
        let customValues = {};
        try {
          customValues = typeof t.campos_personalizados === 'string' ? JSON.parse(t.campos_personalizados) : (t.campos_personalizados || {});
        } catch {}
        camposProcessoAtual.forEach(c => {
          const val = customValues[c.id] ?? '';
          baseRow.push(`"${String(val).replace(/"/g, '""')}"`);
        });
      } else {
        baseRow.push(`"${(t.campos_personalizados || '').replace(/"/g, '""')}"`);
      }

      return baseRow.join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', `vinculum_tarefas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function formatarData(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('pt-BR');
  }

  function renderResumoCampos(t) {
    if (!t.campos_personalizados) return <span className={styles.emptyDash}>—</span>;
    let valores = {};
    try {
      valores = typeof t.campos_personalizados === 'string' ? JSON.parse(t.campos_personalizados) : t.campos_personalizados;
    } catch {
      return <span className={styles.emptyDash}>—</span>;
    }

    const preenchidos = Object.entries(valores).filter(([, val]) => val !== undefined && val !== null && String(val).trim() !== '');
    if (preenchidos.length === 0) return <span className={styles.emptyDash}>—</span>;

    return (
      <div className={styles.customChipsCell}>
        {preenchidos.slice(0, 2).map(([campoId, val]) => {
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
              <span className={styles.customChipKey}>{nomeCampo}:</span>
              <span className={styles.customChipVal}>{exibicao}</span>
            </span>
          );
        })}
        {preenchidos.length > 2 && (
          <span className={styles.customMoreBadge}>+{preenchidos.length - 2}</span>
        )}
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        {/* Cabeçalho Minimalista e Clean */}
        <header className={styles.minimalHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Tarefas</h1>
            <div className={styles.headerMetricsRibbon}>
              <span className={styles.ribbonItem}>
                <strong>{resumoMinimalista.total}</strong> total
              </span>
              <span className={styles.ribbonDot}>•</span>
              <span className={styles.ribbonItem}>
                <span className={styles.dotCyan}></span>
                <strong>{resumoMinimalista.pendentes}</strong> em aberto
              </span>
              {resumoMinimalista.atrasadas > 0 && (
                <>
                  <span className={styles.ribbonDot}>•</span>
                  <span className={`${styles.ribbonItem} ${styles.ribbonDanger}`}>
                    <span className={styles.dotRed}></span>
                    <strong>{resumoMinimalista.atrasadas}</strong> atrasadas
                  </span>
                </>
              )}
              <span className={styles.ribbonDot}>•</span>
              <span className={styles.ribbonItem}>
                <span className={styles.dotGreen}></span>
                <strong>{resumoMinimalista.concluidas}</strong> concluídas
              </span>
            </div>
          </div>

          <div className={styles.headerRight}>
            <button className={styles.btnExportarMinimal} onClick={exportarCSV} title="Exportar para CSV">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Exportar</span>
            </button>
          </div>
        </header>

        {/* Barra de Filtros Minimalista (Clean Toolbar) */}
        <div className={styles.cleanToolbar} ref={dropdownContainerRef}>
          {/* Campo de Pesquisa Discreto */}
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Pesquisar..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            {busca && (
              <button className={styles.btnClearSearch} onClick={() => setBusca('')}>
                ×
              </button>
            )}
          </div>

          {/* Abas Rápidas Discretas com Ícones */}
          <div className={styles.quickPills}>
            <button
              type="button"
              className={`${styles.pillBtn} ${filtroQuickView === 'todas' ? styles.pillBtnActive : ''}`}
              onClick={() => setFiltroQuickView('todas')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span>Todas</span>
            </button>
            <button
              type="button"
              className={`${styles.pillBtn} ${filtroQuickView === 'minhas' ? styles.pillBtnActive : ''}`}
              onClick={() => setFiltroQuickView(filtroQuickView === 'minhas' ? 'todas' : 'minhas')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Minhas ({contagensQuickView.minhas})</span>
            </button>
            <button
              type="button"
              className={`${styles.pillBtn} ${filtroQuickView === 'pendente' ? styles.pillBtnActive : ''}`}
              onClick={() => setFiltroQuickView(filtroQuickView === 'pendente' ? 'todas' : 'pendente')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Em aberto ({contagensQuickView.pendente})</span>
            </button>
            <button
              type="button"
              className={`${styles.pillBtn} ${filtroQuickView === 'atrasada' ? styles.pillBtnActiveDanger : ''}`}
              onClick={() => setFiltroQuickView(filtroQuickView === 'atrasada' ? 'todas' : 'atrasada')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Atrasadas ({contagensQuickView.atrasada})</span>
            </button>
            <button
              type="button"
              className={`${styles.pillBtn} ${filtroQuickView === 'concluida' ? styles.pillBtnActive : ''}`}
              onClick={() => setFiltroQuickView(filtroQuickView === 'concluida' ? 'todas' : 'concluida')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="9 12 12 15 16 10" />
              </svg>
              <span>Concluídas</span>
            </button>
          </div>

          {/* Botões de Filtro Refinado */}
          <div className={styles.dropdownsCluster}>
            <FilterPopover
              label="Setor"
              icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                </svg>
              }
              selectedValues={filtrosSetor}
              options={opcoesSetor}
              isOpen={openDropdown === 'setor'}
              onToggle={() => setOpenDropdown(openDropdown === 'setor' ? null : 'setor')}
              onSelectAll={() => setFiltrosSetor(opcoesSetor.map(o => o.value))}
              onClear={() => setFiltrosSetor([])}
              onToggleItem={handleToggleSetor}
              onClose={() => setOpenDropdown(null)}
              searchPlaceholder="Filtrar setor..."
            />

            <FilterPopover
              label="Processo"
              icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
              selectedValues={filtrosProcesso}
              options={opcoesProcesso}
              isOpen={openDropdown === 'processo'}
              onToggle={() => setOpenDropdown(openDropdown === 'processo' ? null : 'processo')}
              onSelectAll={() => setFiltrosProcesso(opcoesProcesso.map(o => o.value))}
              onClear={() => setFiltrosProcesso([])}
              onToggleItem={handleToggleProcesso}
              onClose={() => setOpenDropdown(null)}
              searchPlaceholder="Filtrar processo..."
            />

            <FilterPopover
              label="Responsável"
              icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
              selectedValues={filtrosResponsavel}
              options={opcoesResponsavel}
              isOpen={openDropdown === 'responsavel'}
              onToggle={() => setOpenDropdown(openDropdown === 'responsavel' ? null : 'responsavel')}
              onSelectAll={() => setFiltrosResponsavel(opcoesResponsavel.map(o => o.value))}
              onClear={() => setFiltrosResponsavel([])}
              onToggleItem={handleToggleResponsavel}
              onClose={() => setOpenDropdown(null)}
              searchPlaceholder="Filtrar responsável..."
              alignRight={true}
            />

            <PrazoPopover
              isOpen={openDropdown === 'prazo'}
              onToggle={() => setOpenDropdown(openDropdown === 'prazo' ? null : 'prazo')}
              onClose={() => setOpenDropdown(null)}
              preset={filtroPrazoPreset}
              dataDe={filtroDataDe}
              dataAte={filtroDataAte}
              onSetPreset={setFiltroPrazoPreset}
              onSetDataDe={setFiltroDataDe}
              onSetDataAte={setFiltroDataAte}
              onClear={() => {
                setFiltroPrazoPreset('');
                setFiltroDataDe('');
                setFiltroDataAte('');
              }}
            />

            {tagsAtivas.length > 0 && (
              <button
                type="button"
                className={styles.btnClearMinimal}
                onClick={limparTodosFiltros}
                title="Limpar todos os filtros"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Tags de Filtros Ativos (Aparece apenas quando houver filtros) */}
        {tagsAtivas.length > 0 && (
          <div className={styles.activeTagsRow}>
            {tagsAtivas.map(t => (
              <span key={t.id} className={styles.activeTagBadge} onClick={t.clear} title="Remover filtro">
                {t.label} <span className={styles.activeTagClose}>×</span>
              </span>
            ))}
          </div>
        )}

        {/* Tabela Minimalista */}
        <section className={styles.tableCard}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <span>Carregando tarefas...</span>
            </div>
          ) : tarefasFiltradas.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhuma tarefa encontrada para os filtros selecionados.</p>
              {tagsAtivas.length > 0 && (
                <button className={styles.btnEmptyReset} onClick={limparTodosFiltros}>
                  Limpar Filtros
                </button>
              )}
            </div>
          ) : (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thTarefa} onClick={() => toggleOrdenacao('titulo')}>
                      <div className={styles.thContent}>
                        <span>Tarefa</span>
                        {renderSetaOrdenacao('titulo')}
                      </div>
                    </th>

                    <th onClick={() => toggleOrdenacao('setor_nome')}>
                      <div className={styles.thContent}>
                        <span>Setor</span>
                        {renderSetaOrdenacao('setor_nome')}
                      </div>
                    </th>

                    <th onClick={() => toggleOrdenacao('processo_nome')}>
                      <div className={styles.thContent}>
                        <span>Processo</span>
                        {renderSetaOrdenacao('processo_nome')}
                      </div>
                    </th>

                    <th onClick={() => toggleOrdenacao('etapa_nome')}>
                      <div className={styles.thContent}>
                        <span>Etapa</span>
                        {renderSetaOrdenacao('etapa_nome')}
                      </div>
                    </th>

                    <th onClick={() => toggleOrdenacao('responsavel_nome')}>
                      <div className={styles.thContent}>
                        <span>Responsável</span>
                        {renderSetaOrdenacao('responsavel_nome')}
                      </div>
                    </th>

                    <th onClick={() => toggleOrdenacao('situacao')}>
                      <div className={styles.thContent}>
                        <span>Status</span>
                        {renderSetaOrdenacao('situacao')}
                      </div>
                    </th>

                    {/* Colunas Dinâmicas (exibidas apenas quando 1 processo específico estiver selecionado) */}
                    {camposProcessoAtual.length > 0 && (
                      camposProcessoAtual.map(c => (
                        <th key={`th_${c.id}`} onClick={() => toggleOrdenacao(`custom_${c.id}`)}>
                          <div className={styles.thContent}>
                            <span>{c.nome}</span>
                            {renderSetaOrdenacao(`custom_${c.id}`)}
                          </div>
                        </th>
                      ))
                    )}

                    <th onClick={() => toggleOrdenacao('prazo')}>
                      <div className={styles.thContent}>
                        <span>Prazo</span>
                        {renderSetaOrdenacao('prazo')}
                      </div>
                    </th>

                    <th className={styles.thAcoes}></th>
                  </tr>
                </thead>

                <tbody>
                  {tarefasPaginadas.map(t => {
                    const concluida = isConcluida(t);
                    const atrasada = isAtrasada(t);
                    const hoje = isHoje(t);
                    const urgente = isUrgente(t);

                    return (
                      <tr
                        key={t.id}
                        className={`${styles.tr} ${atrasada ? styles.trAtrasada : ''}`}
                        onClick={() => navigate(`/tarefas/${t.id}`)}
                      >
                        {/* Tarefa (Inline, limpo e sem quebra excessiva) */}
                        <td className={styles.tdTarefa}>
                          <div className={styles.taskCellInline}>
                            <span className={styles.taskIdBadge}>#{t.id}</span>
                            <span className={styles.taskTitle} title={t.titulo}>
                              {t.titulo}
                            </span>
                            {urgente && <span className={styles.badgeUrgente}>Urgente</span>}
                          </div>
                        </td>

                        {/* Setor */}
                        <td>
                          <span className={styles.setorTag}>
                            <span
                              className={styles.setorDot}
                              style={{ backgroundColor: t.setor_cor || '#2fd9f4' }}
                            />
                            {t.setor_nome || 'Geral'}
                          </span>
                        </td>

                        {/* Processo */}
                        <td>
                          <span className={styles.processoText} title={t.processo_nome}>
                            {t.processo_nome}
                          </span>
                        </td>

                        {/* Etapa */}
                        <td>
                          <span className={styles.etapaText} title={t.etapa_nome}>
                            {t.etapa_nome}
                          </span>
                        </td>

                        {/* Responsável */}
                        <td>
                          <div className={styles.userCell}>
                            <span className={styles.avatarMini}>
                              {t.responsavel_nome ? t.responsavel_nome.trim().charAt(0).toUpperCase() : '—'}
                            </span>
                            <span className={styles.userName}>{t.responsavel_nome || '—'}</span>
                          </div>
                        </td>

                        {/* Status Minimalista */}
                        <td>
                          {concluida ? (
                            <span className={styles.statusConcluida}>
                              <span className={styles.statusDotGreen}></span>
                              Concluída
                            </span>
                          ) : atrasada ? (
                            <span className={styles.statusAtrasada}>
                              <span className={styles.statusDotRed}></span>
                              Atrasada
                            </span>
                          ) : hoje ? (
                            <span className={styles.statusHoje}>
                              <span className={styles.statusDotAmber}></span>
                              Vence hoje
                            </span>
                          ) : (
                            <span className={styles.statusEmAndamento}>
                              <span className={styles.statusDotCyan}></span>
                              Em andamento
                            </span>
                          )}
                        </td>

                        {/* Campos Customizados (somente quando 1 processo está filtrado) */}
                        {camposProcessoAtual.length > 0 && (
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
                            return (
                              <td key={`val_${c.id}`} className={styles.tdCustom}>
                                {val !== '' && val !== undefined ? String(val) : '—'}
                              </td>
                            );
                          })
                        )}

                        {/* Prazo */}
                        <td>
                          <span className={`${styles.prazoText} ${atrasada ? styles.prazoRed : hoje ? styles.prazoAmber : ''}`}>
                            {formatarData(t.prazo)}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className={styles.tdAcoes} onClick={e => e.stopPropagation()}>
                          <button
                            className={styles.btnRowOpen}
                            onClick={() => navigate(`/tarefas/${t.id}`)}
                            title="Ver detalhes"
                          >
                            →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Rodapé Discreto com Paginação */}
          <footer className={styles.tableFooter}>
            <div className={styles.footerLeft}>
              <span>
                {tarefasFiltradas.length === 0 ? 0 : (paginaAtual - 1) * (itensPorPagina === 'todos' ? tarefasFiltradas.length : itensPorPagina) + 1}
                -
                {itensPorPagina === 'todos' ? tarefasFiltradas.length : Math.min(paginaAtual * itensPorPagina, tarefasFiltradas.length)} de {tarefasFiltradas.length}
              </span>

              <select
                className={styles.pageSizeSelect}
                value={itensPorPagina}
                onChange={e => setItensPorPagina(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
              >
                <option value={15}>15 por pág.</option>
                <option value={30}>30 por pág.</option>
                <option value={50}>50 por pág.</option>
                <option value="todos">Todas</option>
              </select>
            </div>

            {itensPorPagina !== 'todos' && totalPaginas > 1 && (
              <div className={styles.footerPagination}>
                <button
                  className={styles.btnPage}
                  onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                >
                  ‹
                </button>
                <span className={styles.pageNumber}>
                  {paginaAtual} / {totalPaginas}
                </span>
                <button
                  className={styles.btnPage}
                  onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas}
                >
                  ›
                </button>
              </div>
            )}
          </footer>
        </section>
      </main>
    </div>
  );
}
