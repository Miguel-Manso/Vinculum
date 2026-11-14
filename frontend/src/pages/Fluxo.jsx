import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import SidebarTrigger from '../components/SidebarTrigger';
import ProcessIcon from '../components/ProcessIcon';
import KanbanBoard from '../components/KanbanBoard';
import api from '../services/api';
import styles from './Fluxo.module.css';
import { toast, confirmDialog } from '../components/feedback/feedback';
import {
  FilterToggle, FilterPanel, FilterField, FilterSelect, FilterSegment, FilterDateRange, ActiveFilters,
} from '../components/FilterPanel';
import ui from '../styles/ui.module.css';

const FILTROS_KANBAN_INICIAIS = {
  responsavel: '', prazo: '', urgencia: '', status: '', criadoDe: '', criadoAte: '', campos: {},
};
const OPCOES_PRAZO = [
  { value: 'atrasadas', label: 'Atrasadas' },
  { value: 'hoje', label: 'Vencem hoje' },
  { value: '7dias', label: 'Próximos 7 dias' },
  { value: '30dias', label: 'Próximos 30 dias' },
  { value: 'sem', label: 'Sem prazo' },
];
const ROTULO_PRAZO = Object.fromEntries(OPCOES_PRAZO.map(o => [o.value, o.label]));
const OPCOES_URGENCIA = [
  { value: '', label: 'Todas' },
  { value: 'urgente', label: 'Urgentes', tone: 'danger' },
  { value: 'normal', label: 'Normais' },
];
const OPCOES_STATUS = [
  { value: '', label: 'Todas' },
  { value: 'abertas', label: 'Em aberto' },
  { value: 'concluidas', label: 'Concluídas' },
];

function lerValoresCampos(tarefa) {
  if (!tarefa.campos_personalizados) return {};
  try {
    return typeof tarefa.campos_personalizados === 'string'
      ? JSON.parse(tarefa.campos_personalizados)
      : tarefa.campos_personalizados;
  } catch {
    return {};
  }
}

/** Data (sem hora) em ms; aceita 'YYYY-MM-DD' ou ISO. */
function diaEmMs(valor) {
  if (!valor) return null;
  const d = new Date(`${String(valor).split('T')[0]}T00:00:00`);
  return isNaN(d.getTime()) ? null : d.getTime();
}

export default function Fluxo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [processo, setProcesso] = useState(null);
  const [etapas, setEtapas] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [campos, setCampos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // Modais
  const [modalTarefaAberto, setModalTarefaAberto] = useState(false);
  const [modalEditarTarefaAberto, setModalEditarTarefaAberto] = useState(false);
  const [modalEtapaAberto, setModalEtapaAberto] = useState(false);
  const [modalEditarEtapaAberto, setModalEditarEtapaAberto] = useState(false);
  const [modalCamposAberto, setModalCamposAberto] = useState(false);
  const [modalExigenciaEtapaAberto, setModalExigenciaEtapaAberto] = useState(false);

  // Edição de Etapa
  const [etapaEmEdicao, setEtapaEmEdicao] = useState(null);
  const [nomeEtapaEdicao, setNomeEtapaEdicao] = useState('');

  // Form Tarefa (Criar)
  const [tituloTarefa, setTituloTarefa] = useState('');
  const [descTarefa, setDescTarefa] = useState('');
  const [etapaIdTarefa, setEtapaIdTarefa] = useState('');
  const [prazoTarefa, setPrazoTarefa] = useState('');
  const [urgenteTarefa, setUrgenteTarefa] = useState(false);
  const [valoresCampos, setValoresCampos] = useState({});
  const [salvandoTarefa, setSalvandoTarefa] = useState(false);

  // Form Tarefa (Editar)
  const [tarefaEmEdicao, setTarefaEmEdicao] = useState(null);
  const [tituloTarefaEdicao, setTituloTarefaEdicao] = useState('');
  const [descTarefaEdicao, setDescTarefaEdicao] = useState('');
  const [prazoTarefaEdicao, setPrazoTarefaEdicao] = useState('');
  const [urgenteTarefaEdicao, setUrgenteTarefaEdicao] = useState(false);
  const [valoresCamposEdicao, setValoresCamposEdicao] = useState({});
  const [salvandoEdicaoTarefa, setSalvandoEdicaoTarefa] = useState(false);

  // Form Etapa (Criar)
  const [nomeEtapa, setNomeEtapa] = useState('');
  const [salvandoEtapa, setSalvandoEtapa] = useState(false);
  const [salvandoEdicaoEtapa, setSalvandoEdicaoEtapa] = useState(false);

  // Form Campo Customizado (Criar)
  const [nomeNovoCampo, setNomeNovoCampo] = useState('');
  const [tipoNovoCampo, setTipoNovoCampo] = useState('texto');
  const [regraObrigatorioNovoCampo, setRegraObrigatorioNovoCampo] = useState('opcional');
  const [opcoesNovoCampo, setOpcoesNovoCampo] = useState('');
  const [salvandoCampo, setSalvandoCampo] = useState(false);

  // Exigência de Etapa ao Mover
  const [tarefaPendenteMover, setTarefaPendenteMover] = useState(null);
  const [etapaDestinoPendente, setEtapaDestinoPendente] = useState(null);
  const [camposExigidosEtapa, setCamposExigidosEtapa] = useState([]);
  const [valoresExigidos, setValoresExigidos] = useState({});
  const [salvandoExigencia, setSalvandoExigencia] = useState(false);

  // Drag and Drop State (Tarefas e Colunas)
  const [etapaArrastada, setEtapaArrastada] = useState(null);
  const [colunaDragOverId, setColunaDragOverId] = useState(null);

  const isDraggingColumnRef = useRef(false);

  const [usuarios, setUsuarios] = useState([]);
  const [responsavelIdTarefa, setResponsavelIdTarefa] = useState('');

  // Filtra colaboradores que pertencem ao mesmo setor do processo (ou administradores)
  const usuariosPermitidos = useMemo(() => {
    if (!processo?.setor_id) return usuarios;
    return usuarios.filter(u => {
      if (u.perfil === 'admin' || u.email === 'admin@vinculum.com') return true;
      return Array.isArray(u.setores) && u.setores.some(s => s.id === processo.setor_id);
    });
  }, [usuarios, processo]);

  // Integração com as APIs reais do Vinculum
  async function carregarDados() {
    try {
      const [resProc, resEtapas, resCampos, resUsuarios] = await Promise.all([
        api.get(`/processos/${id}`),
        api.get(`/etapas/processo/${id}`),
        api.get(`/campos/processo/${id}`).catch(() => ({ data: [] })),
        api.get('/usuarios').catch(() => ({ data: [] })),
      ]);

      const etapasData = resEtapas.data || [];
      setProcesso(resProc.data);
      setEtapas(etapasData);
      setCampos(resCampos.data || []);
      setUsuarios(resUsuarios.data || []);

      // Busca as etapas do processo e as tarefas de cada etapa individualmente via GET /api/tarefas/etapa/:id
      if (etapasData.length > 0) {
        const tarefasPorEtapa = await Promise.all(
          etapasData.map(e =>
            api.get(`/tarefas/etapa/${e.id}`)
              .then(res => (res.data || []).map(t => ({
                ...t,
                processo_id: parseInt(id, 10),
                etapa_nome: e.nome,
              })))
              .catch(() => [])
          )
        );
        setTarefas(tarefasPorEtapa.flat());
        setEtapaIdTarefa(prev => prev || String(etapasData[0].id));
      } else {
        setTarefas([]);
      }
    } catch (err) {
      console.error('Erro ao carregar fluxo:', err);
      setErro('Não foi possível carregar os dados do processo.');
    } finally {
      setLoading(false);
    }
  }

  async function carregarCampos() {
    try {
      const res = await api.get(`/campos/processo/${id}`);
      setCampos(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar campos:', err);
    }
  }

  useEffect(() => {
    carregarDados();
  }, [id]);

  function abrirModalNovaTarefa() {
    setTituloTarefa('');
    setDescTarefa('');
    setPrazoTarefa('');
    setUrgenteTarefa(false);
    setResponsavelIdTarefa('');
    const initVals = {};
    campos.forEach(c => {
      initVals[c.id] = c.tipo === 'checkbox' ? false : '';
    });
    setValoresCampos(initVals);
    if (etapas.length > 0 && !etapaIdTarefa) {
      setEtapaIdTarefa(String(etapas[0].id));
    }
    setModalTarefaAberto(true);
  }

  function abrirModalEditarTarefa(tarefa, e) {
    if (e) e.stopPropagation();
    setTarefaEmEdicao(tarefa);
    setTituloTarefaEdicao(tarefa.titulo);
    setDescTarefaEdicao(tarefa.descricao || '');
    setPrazoTarefaEdicao(tarefa.prazo ? tarefa.prazo.split('T')[0] : '');
    setUrgenteTarefaEdicao(tarefa.urgente === 1 || tarefa.urgente === true);

    let valores = {};
    if (tarefa.campos_personalizados) {
      try {
        valores = typeof tarefa.campos_personalizados === 'string'
          ? JSON.parse(tarefa.campos_personalizados)
          : tarefa.campos_personalizados;
      } catch {}
    }

    const initVals = {};
    campos.forEach(c => {
      initVals[c.id] = valores[c.id] !== undefined ? valores[c.id] : (c.tipo === 'checkbox' ? false : '');
    });
    setValoresCamposEdicao(initVals);
    setModalEditarTarefaAberto(true);
  }

  async function handleCriarTarefa(e) {
    e.preventDefault();
    if (!tituloTarefa.trim() || !etapaIdTarefa) return;

    // Valida apenas campos que são OBRIGATÓRIOS NA CRIAÇÃO (etapa_obrigatoria_id é nulo)
    for (const c of campos) {
      if (c.obrigatorio && !c.etapa_obrigatoria_id) {
        const val = valoresCampos[c.id];
        if (c.tipo === 'checkbox') {
          if (!val) {
            toast.warning(`O campo obrigatório "${c.nome}" deve ser marcado.`);
            return;
          }
        } else if (val === undefined || val === null || String(val).trim() === '') {
          toast.warning(`O campo "${c.nome}" é obrigatório na criação da tarefa.`);
          return;
        }
      }
    }

    setSalvandoTarefa(true);
    try {
      // POST /api/tarefas - Cria nova tarefa vinculada à etapa selecionada
      await api.post('/tarefas', {
        titulo: tituloTarefa.trim(),
        descricao: descTarefa || null,
        etapa_id: parseInt(etapaIdTarefa, 10),
        responsavel_id: responsavelIdTarefa ? parseInt(responsavelIdTarefa, 10) : null,
        prazo: prazoTarefa || null,
        urgente: urgenteTarefa,
        campos_personalizados: valoresCampos,
      });
      setTituloTarefa('');
      setDescTarefa('');
      setPrazoTarefa('');
      setUrgenteTarefa(false);
      setResponsavelIdTarefa('');
      setValoresCampos({});
      setModalTarefaAberto(false);
      await carregarDados();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar tarefa');
    } finally {
      setSalvandoTarefa(false);
    }
  }

  async function handleSalvarEdicaoTarefa(e) {
    e.preventDefault();
    if (!tarefaEmEdicao || !tituloTarefaEdicao.trim()) return;

    setSalvandoEdicaoTarefa(true);
    try {
      await api.put(`/tarefas/${tarefaEmEdicao.id}`, {
        titulo: tituloTarefaEdicao,
        descricao: descTarefaEdicao || null,
        responsavel_id: tarefaEmEdicao.responsavel_id || null,
        prazo: prazoTarefaEdicao || null,
        urgente: urgenteTarefaEdicao,
        campos_personalizados: valoresCamposEdicao,
      });
      setModalEditarTarefaAberto(false);
      setTarefaEmEdicao(null);
      await carregarDados();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar alterações da tarefa');
    } finally {
      setSalvandoEdicaoTarefa(false);
    }
  }

  async function handleCriarEtapa(e) {
    e.preventDefault();
    if (!nomeEtapa.trim()) return;

    setSalvandoEtapa(true);
    try {
      await api.post('/etapas', {
        nome: nomeEtapa,
        ordem: etapas.length + 1,
        processo_id: parseInt(id),
      });
      setNomeEtapa('');
      setModalEtapaAberto(false);
      await carregarDados();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar etapa');
    } finally {
      setSalvandoEtapa(false);
    }
  }

  function abrirModalEditarEtapa(etapa, e) {
    e.stopPropagation();
    setEtapaEmEdicao(etapa);
    setNomeEtapaEdicao(etapa.nome);
    setModalEditarEtapaAberto(true);
  }

  async function handleSalvarEdicaoEtapa(e) {
    e.preventDefault();
    if (!nomeEtapaEdicao.trim() || !etapaEmEdicao) return;

    setSalvandoEdicaoEtapa(true);
    try {
      await api.put(`/etapas/${etapaEmEdicao.id}`, {
        nome: nomeEtapaEdicao.trim(),
        ordem: etapaEmEdicao.ordem || 1,
      });
      setModalEditarEtapaAberto(false);
      setEtapaEmEdicao(null);
      await carregarDados();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao editar etapa');
    } finally {
      setSalvandoEdicaoEtapa(false);
    }
  }

  async function handleExcluirEtapa() {
    if (!etapaEmEdicao) return;
    const confirmou = await confirmDialog({
      title: `Excluir a etapa "${etapaEmEdicao.nome}"?`,
      message: 'Todas as tarefas vinculadas a esta etapa também serão excluídas. Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir etapa',
      tone: 'danger',
    });
    if (!confirmou) return;

    setSalvandoEdicaoEtapa(true);
    try {
      await api.delete(`/etapas/${etapaEmEdicao.id}`);
      setModalEditarEtapaAberto(false);
      setEtapaEmEdicao(null);
      await carregarDados();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao excluir etapa');
    } finally {
      setSalvandoEdicaoEtapa(false);
    }
  }

  // --- Handlers de Campos Personalizados ---
  async function handleCriarCampo(e) {
    e.preventDefault();
    if (!nomeNovoCampo.trim()) return;

    setSalvandoCampo(true);
    try {
      const isObrigatorio = regraObrigatorioNovoCampo !== 'opcional';
      const etapaObrigatoriaId =
        regraObrigatorioNovoCampo !== 'opcional' && regraObrigatorioNovoCampo !== 'criacao'
          ? parseInt(regraObrigatorioNovoCampo, 10)
          : null;

      await api.post(`/campos/processo/${id}`, {
        nome: nomeNovoCampo.trim(),
        tipo: tipoNovoCampo,
        obrigatorio: isObrigatorio,
        etapa_obrigatoria_id: etapaObrigatoriaId,
        opcoes: tipoNovoCampo === 'select' ? opcoesNovoCampo : null,
        ordem: campos.length + 1,
      });
      setNomeNovoCampo('');
      setTipoNovoCampo('texto');
      setRegraObrigatorioNovoCampo('opcional');
      setOpcoesNovoCampo('');
      await carregarCampos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao cadastrar campo');
    } finally {
      setSalvandoCampo(false);
    }
  }

  async function handleExcluirCampo(campoId, nomeCampo) {
    if (!await confirmDialog({ title: `Remover o campo "${nomeCampo}"?`, message: 'O campo deixará de aparecer nas tarefas deste processo.', confirmLabel: 'Remover campo', tone: 'danger' })) return;
    try {
      await api.delete(`/campos/${campoId}`);
      await carregarCampos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao excluir campo');
    }
  }

  // ---------------- Filtros do quadro ----------------
  const [buscaKanban, setBuscaKanban] = useState('');
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [filtros, setFiltros] = useState(FILTROS_KANBAN_INICIAIS);
  const setFiltro = (chave, valor) => setFiltros(f => ({ ...f, [chave]: valor }));
  const setFiltroCampo = (campoId, valor) =>
    setFiltros(f => {
      const campos = { ...f.campos };
      if (valor) campos[campoId] = valor; else delete campos[campoId];
      return { ...f, campos };
    });

  // Campos do tipo lista viram filtros
  const camposFiltraveis = useMemo(() => campos
    .filter(c => c.tipo === 'select')
    .map(c => ({
      ...c,
      lista: (c.opcoes || '').split(',').map(o => o.trim()).filter(Boolean),
    }))
    .filter(c => c.lista.length > 0), [campos]);

  // Responsáveis que aparecem nas tarefas (mais quem pode ser atribuído)
  const opcoesResponsavel = useMemo(() => {
    const mapa = new Map();
    usuariosPermitidos.forEach(u => mapa.set(String(u.id), u.nome));
    tarefas.forEach(t => {
      if (t.responsavel_id) mapa.set(String(t.responsavel_id), t.responsavel_nome || mapa.get(String(t.responsavel_id)) || `#${t.responsavel_id}`);
    });
    return [
      { value: 'nenhum', label: 'Sem responsável' },
      ...[...mapa.entries()]
        .sort((a, b) => (a[1] || '').localeCompare(b[1] || '', 'pt-BR'))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [usuariosPermitidos, tarefas]);

  const etapasFinais = useMemo(
    () => new Set(etapas.filter(e => isEtapaFinal(e.nome)).map(e => Number(e.id))),
    [etapas]
  );

  const tarefaPassaNosFiltros = useMemo(() => {
    const termo = buscaKanban.toLowerCase().trim().replace(/^#/, '');
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const hojeMs = hoje.getTime();
    const DIA = 86400000;
    const de = diaEmMs(filtros.criadoDe);
    const ate = diaEmMs(filtros.criadoAte);

    return (t) => {
      const concluida = etapasFinais.has(Number(t.etapa_id));

      if (termo) {
        const alvo = [t.titulo, t.descricao, t.responsavel_nome, String(t.id)].filter(Boolean).join(' ').toLowerCase();
        if (!alvo.includes(termo)) return false;
      }

      if (filtros.responsavel === 'nenhum' && t.responsavel_id) return false;
      if (filtros.responsavel && filtros.responsavel !== 'nenhum' && String(t.responsavel_id) !== filtros.responsavel) return false;

      const urgente = t.urgente === 1 || t.urgente === true;
      if (filtros.urgencia === 'urgente' && !urgente) return false;
      if (filtros.urgencia === 'normal' && urgente) return false;

      if (filtros.status === 'abertas' && concluida) return false;
      if (filtros.status === 'concluidas' && !concluida) return false;

      if (filtros.prazo) {
        const prazo = diaEmMs(t.prazo);
        if (filtros.prazo === 'sem') { if (prazo !== null) return false; }
        else {
          if (prazo === null || concluida) return false;
          if (filtros.prazo === 'atrasadas' && !(prazo < hojeMs)) return false;
          if (filtros.prazo === 'hoje' && prazo !== hojeMs) return false;
          if (filtros.prazo === '7dias' && !(prazo >= hojeMs && prazo <= hojeMs + 7 * DIA)) return false;
          if (filtros.prazo === '30dias' && !(prazo >= hojeMs && prazo <= hojeMs + 30 * DIA)) return false;
        }
      }

      if (de !== null || ate !== null) {
        const criado = diaEmMs(t.criado_em);
        if (criado === null) return false;
        if (de !== null && criado < de) return false;
        if (ate !== null && criado > ate) return false;
      }

      const camposAtivos = Object.entries(filtros.campos);
      if (camposAtivos.length) {
        const valores = lerValoresCampos(t);
        for (const [campoId, esperado] of camposAtivos) {
          if (String(valores[campoId] ?? '').trim() !== esperado) return false;
        }
      }
      return true;
    };
  }, [buscaKanban, filtros, etapasFinais]);

  const tarefasVisiveis = useMemo(() => tarefas.filter(tarefaPassaNosFiltros), [tarefas, tarefaPassaNosFiltros]);

  function limparFiltrosKanban() {
    setBuscaKanban('');
    setFiltros(FILTROS_KANBAN_INICIAIS);
  }

  const chipsKanban = [];
  if (buscaKanban.trim()) chipsKanban.push({ id: 'busca', label: `Busca: "${buscaKanban.trim()}"`, onRemove: () => setBuscaKanban('') });
  if (filtros.responsavel) {
    const r = opcoesResponsavel.find(o => o.value === filtros.responsavel);
    chipsKanban.push({ id: 'resp', label: `Responsável: ${r?.label || '—'}`, onRemove: () => setFiltro('responsavel', '') });
  }
  if (filtros.prazo) chipsKanban.push({ id: 'prazo', label: `Prazo: ${ROTULO_PRAZO[filtros.prazo]}`, onRemove: () => setFiltro('prazo', '') });
  if (filtros.urgencia) chipsKanban.push({ id: 'urg', label: filtros.urgencia === 'urgente' ? 'Somente urgentes' : 'Somente normais', onRemove: () => setFiltro('urgencia', '') });
  if (filtros.status) chipsKanban.push({ id: 'status', label: filtros.status === 'abertas' ? 'Em aberto' : 'Concluídas', onRemove: () => setFiltro('status', '') });
  if (filtros.criadoDe || filtros.criadoAte) {
    const fmt = v => (v ? new Date(`${v}T00:00:00`).toLocaleDateString('pt-BR') : '…');
    chipsKanban.push({
      id: 'criado',
      label: `Criadas: ${fmt(filtros.criadoDe)} a ${fmt(filtros.criadoAte)}`,
      onRemove: () => setFiltros(f => ({ ...f, criadoDe: '', criadoAte: '' })),
    });
  }
  Object.entries(filtros.campos).forEach(([campoId, valor]) => {
    const c = campos.find(x => String(x.id) === String(campoId));
    chipsKanban.push({ id: `campo-${campoId}`, label: `${c?.nome || 'Campo'}: ${valor}`, onRemove: () => setFiltroCampo(campoId, '') });
  });

  // Etapas e tarefas no formato do KanbanBoard (já filtradas)
  const colunasKanban = useMemo(() => etapas.map(etapa => ({
    id: etapa.id,
    name: etapa.nome,
    etapa,
    final: isEtapaFinal(etapa.nome),
    tasks: tarefasVisiveis.filter(t => Number(t.etapa_id) === Number(etapa.id)),
  })), [etapas, tarefasVisiveis]);

  // --- Handlers de Drag and Drop de Coluna (Etapas) ---
  function handleColumnDragStart(e, etapa) {
    isDraggingColumnRef.current = true;
    setEtapaArrastada(etapa);
    e.dataTransfer.setData('type', 'column');
    e.dataTransfer.setData('columnId', String(etapa.id));
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleColumnDragEnd() {
    setTimeout(() => {
      isDraggingColumnRef.current = false;
    }, 100);
    setEtapaArrastada(null);
    setColunaDragOverId(null);
  }

  function handleGlobalDragOver(e, etapaId) {
    if (!(isDraggingColumnRef.current || etapaArrastada)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (colunaDragOverId !== etapaId) setColunaDragOverId(etapaId);
  }

  function handleGlobalDragLeave(e, etapaId) {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (colunaDragOverId === etapaId) setColunaDragOverId(null);
  }

  async function handleGlobalDrop(e, etapaIdDestino) {
    e.preventDefault();
    setColunaDragOverId(null);

    // 1. Reordenação de Coluna (Etapa)
    if (isDraggingColumnRef.current || etapaArrastada) {
      if (!etapaArrastada) return;
      const origemId = Number(etapaArrastada.id);
      const destinoId = Number(etapaIdDestino);
      if (origemId === destinoId) {
        setEtapaArrastada(null);
        return;
      }

      const currentIndex = etapas.findIndex(et => Number(et.id) === origemId);
      const targetIndex = etapas.findIndex(et => Number(et.id) === destinoId);
      if (currentIndex === -1 || targetIndex === -1) return;

      const reordenadas = [...etapas];
      const [moved] = reordenadas.splice(currentIndex, 1);
      reordenadas.splice(targetIndex, 0, moved);

      const etapasComNovaOrdem = reordenadas.map((et, idx) => ({ ...et, ordem: idx + 1 }));
      setEtapas(etapasComNovaOrdem);
      setEtapaArrastada(null);

      try {
        await api.put('/etapas/reordenar', {
          etapas: etapasComNovaOrdem.map(et => ({ id: et.id, ordem: et.ordem })),
        });
      } catch (err) {
        console.error('Erro ao reordenar etapas:', err);
        toast.error('Erro ao salvar nova ordem das etapas.');
        await carregarDados();
      }
      return;
    }

  }

  // Move uma tarefa para outra etapa (chamado pelo KanbanBoard ao soltar)
  async function moverTarefa(tarefa, etapaIdDestino) {
    const etapaOrigemId = Number(tarefa.etapa_id);
    const etapaDestinoNum = Number(etapaIdDestino);
    if (etapaOrigemId === etapaDestinoNum) return;

    const destinoEtapaObj = etapas.find(et => Number(et.id) === etapaDestinoNum);

    // VERIFICAÇÃO DE CAMPOS EXIGIDOS PELA ETAPA DE DESTINO
    let valoresAtuais = {};
    if (tarefa.campos_personalizados) {
      try {
        valoresAtuais = typeof tarefa.campos_personalizados === 'string'
          ? JSON.parse(tarefa.campos_personalizados)
          : tarefa.campos_personalizados;
      } catch {}
    }

    const exigidos = campos.filter(c =>
      c.obrigatorio &&
      Number(c.etapa_obrigatoria_id) === etapaDestinoNum &&
      (valoresAtuais[c.id] === undefined || valoresAtuais[c.id] === null || String(valoresAtuais[c.id]).trim() === '')
    );

    if (exigidos.length > 0) {
      // Abre modal para que o usuário preencha antes de concluir o avanço de etapa
      setTarefaPendenteMover(tarefa);
      setEtapaDestinoPendente(destinoEtapaObj);
      setCamposExigidosEtapa(exigidos);
      const initVals = { ...valoresAtuais };
      exigidos.forEach(c => {
        initVals[c.id] = c.tipo === 'checkbox' ? false : '';
      });
      setValoresExigidos(initVals);
      setModalExigenciaEtapaAberto(true);
      return;
    }

    // Atualização otimista: o card já fica na etapa nova enquanto a API responde
    const tarefaMovida = { ...tarefa, etapa_id: etapaDestinoNum, etapa_nome: destinoEtapaObj?.nome };
    setTarefas(prev => prev.map(t => (t.id === tarefaMovida.id ? tarefaMovida : t)));

    try {
      await api.patch(`/tarefas/${tarefaMovida.id}/mover`, { etapa_id: etapaDestinoNum });
      await carregarDados();
    } catch (err) {
      console.error('Erro ao mover tarefa:', err);
      toast.error('Erro ao mover a tarefa.');
      await carregarDados();
    }
  }

  // Confirmação do modal de campos exigidos ao mover etapa
  async function handleConfirmarMoverComCampos(e) {
    e.preventDefault();
    if (!tarefaPendenteMover || !etapaDestinoPendente) return;

    for (const c of camposExigidosEtapa) {
      const v = valoresExigidos[c.id];
      if (c.tipo === 'checkbox') {
        if (!v) {
          toast.warning(`O campo obrigatório "${c.nome}" deve ser marcado para avançar.`);
          return;
        }
      } else if (v === undefined || v === null || String(v).trim() === '') {
        toast.warning(`O campo "${c.nome}" é obrigatório para mover a tarefa para "${etapaDestinoPendente.nome}".`);
        return;
      }
    }

    setSalvandoExigencia(true);
    try {
      // 1. Atualiza os campos personalizados da tarefa
      await api.put(`/tarefas/${tarefaPendenteMover.id}`, {
        titulo: tarefaPendenteMover.titulo,
        descricao: tarefaPendenteMover.descricao || null,
        responsavel_id: tarefaPendenteMover.responsavel_id || null,
        prazo: tarefaPendenteMover.prazo || null,
        campos_personalizados: valoresExigidos,
      });

      // 2. Move a tarefa para a etapa de destino
      await api.patch(`/tarefas/${tarefaPendenteMover.id}/mover`, {
        etapa_id: etapaDestinoPendente.id,
      });

      setModalExigenciaEtapaAberto(false);
      setTarefaPendenteMover(null);
      setEtapaDestinoPendente(null);
      await carregarDados();
    } catch (err) {
      console.error('Erro ao mover tarefa com campos:', err);
      toast.error('Erro ao mover tarefa.');
    } finally {
      setSalvandoExigencia(false);
    }
  }

  function handleCardClick(tarefaId) {
    if (isDraggingColumnRef.current) return;
    navigate(`/tarefas/${tarefaId}`);
  }

  function formatarData(dt) {
    if (!dt) return '';
    return new Date(dt).toLocaleDateString('pt-BR');
  }

  function isEtapaFinal(nome) {
    const n = nome?.toLowerCase() || '';
    return n.includes('finaliz') || n.includes('concluíd') || n.includes('concluid');
  }

  function renderizarChipsCampos(tarefa) {
    if (!tarefa.campos_personalizados || campos.length === 0) return null;
    let valores = {};
    try {
      valores = typeof tarefa.campos_personalizados === 'string'
        ? JSON.parse(tarefa.campos_personalizados)
        : tarefa.campos_personalizados;
    } catch {
      return null;
    }

    const preenchidos = campos
      .filter(c => valores[c.id] !== undefined && valores[c.id] !== null && String(valores[c.id]).trim() !== '')
      .map(c => ({ campo: c, valor: valores[c.id] }));

    if (preenchidos.length === 0) return null;

    const visiveis = preenchidos.slice(0, 3);
    const excedentes = preenchidos.length - 3;

    return (
      <div className={styles.taskCustomFields}>
        {visiveis.map(({ campo, valor }) => {
          let formatado = valor;
          let prefix = '';
          if (campo.tipo === 'moeda') {
            prefix = '💰 ';
            const num = Number(String(valor).replace(/[^\d.,]/g, '').replace(',', '.'));
            if (!isNaN(num)) {
              formatado = num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
          } else if (campo.tipo === 'data') {
            prefix = '📅 ';
            try {
              formatado = new Date(valor).toLocaleDateString('pt-BR');
            } catch {}
          } else if (campo.tipo === 'checkbox') {
            formatado = valor ? '✓ Sim' : '✕ Não';
          } else if (campo.tipo === 'select') {
            prefix = '🏷️ ';
          }

          return (
            <span key={campo.id} className={styles.customChip} title={`${campo.nome}: ${formatado}`}>
              <span className={styles.customChipStrong}>{campo.nome}:</span> {prefix}{formatado}
            </span>
          );
        })}
        {excedentes > 0 && (
          <span className={styles.customChipMore}>+{excedentes}</span>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main} style={{ justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: '#6A7282' }}>Carregando fluxo do processo...</p>
        </main>
      </div>
    );
  }

  if (erro || !processo) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main} style={{ justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: '#DC2626' }}>{erro || 'Processo não encontrado.'}</p>
          <button className={styles.btnPrimary} onClick={() => navigate('/processos')}>
            Voltar para Processos
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        {/* Cabeçalho da Página */}
        <div className={`${styles.pageHeader} page-hero`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SidebarTrigger />
            <button className={styles.btnBack} onClick={() => navigate('/processos')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Voltar
            </button>
          </div>

          <div className={styles.headerRow}>
            <div className={styles.headerInfo}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={styles.titleIcon} title={`Setor: ${processo.setor_nome || 'Geral'}`}>
                  <ProcessIcon processo={processo} size={16} />
                </span>
                <h1 className={styles.pageTitle}>{processo.nome}</h1>
              </div>
              <p className={styles.pageSubtitle}>
                {processo.descricao || `${tarefas.length} ${tarefas.length === 1 ? 'tarefa' : 'tarefas'} em ${etapas.length} ${etapas.length === 1 ? 'etapa' : 'etapas'}`}
              </p>
            </div>

            <div className={styles.headerActions}>
              {/* Botão de Configuração de Campos do Processo */}
              <button
                type="button"
                className={styles.btnOutline}
                onClick={() => setModalCamposAberto(true)}
                title="Configurar campos personalizados para as tarefas deste processo"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Campos {campos.length > 0 && <span className={styles.btnCount}>{campos.length}</span>}
              </button>

              <button
                type="button"
                className={styles.btnOutline}
                onClick={() => setModalEtapaAberto(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Etapa
              </button>

              <Link to="/tabela" className={styles.btnOutline} style={{ textDecoration: 'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
                Tabela
              </Link>

              <button
                type="button"
                className={styles.btnPrimary}
                onClick={abrirModalNovaTarefa}
                disabled={etapas.length === 0}
                title={etapas.length === 0 ? 'Crie ao menos uma etapa antes de adicionar tarefas' : ''}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Nova tarefa
              </button>
            </div>
          </div>
        </div>

        {/* Barra de busca + filtros do quadro */}
        {etapas.length > 0 && (
          <div className={styles.boardToolbar}>
            <div className={`${ui.searchWrap} ${styles.boardSearch}`}>
              <svg className={ui.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className={ui.searchInput}
                type="text"
                placeholder="Buscar tarefa, #id ou responsável"
                value={buscaKanban}
                onChange={e => setBuscaKanban(e.target.value)}
                aria-label="Buscar tarefas no quadro"
              />
              {buscaKanban && (
                <button type="button" className={ui.searchClear} onClick={() => setBuscaKanban('')} aria-label="Limpar busca">×</button>
              )}
            </div>

            <FilterToggle
              open={filtrosAbertos}
              onClick={() => setFiltrosAbertos(v => !v)}
              count={chipsKanban.filter(c => c.id !== 'busca').length}
            />

            <span className={styles.boardCount}>
              <strong>{tarefasVisiveis.length}</strong>
              {tarefasVisiveis.length !== tarefas.length && <> de <strong>{tarefas.length}</strong></>}
              {' '}{tarefas.length === 1 ? 'tarefa' : 'tarefas'}
            </span>
          </div>
        )}

        <FilterPanel
          open={filtrosAbertos && etapas.length > 0}
          onClose={() => setFiltrosAbertos(false)}
          subtitle="Combine responsável, prazo, urgência e campos do processo para focar no que importa."
          activeCount={chipsKanban.length}
          resultCount={tarefasVisiveis.length}
          totalCount={tarefas.length}
          resultNoun={['tarefa', 'tarefas']}
          onClear={limparFiltrosKanban}
        >
          <FilterField label="Responsável">
            <FilterSelect
              value={filtros.responsavel}
              onChange={v => setFiltro('responsavel', v)}
              placeholder="Todos os responsáveis"
              options={opcoesResponsavel}
              ariaLabel="Filtrar por responsável"
            />
          </FilterField>
          <FilterField label="Prazo">
            <FilterSelect
              value={filtros.prazo}
              onChange={v => setFiltro('prazo', v)}
              placeholder="Qualquer prazo"
              options={OPCOES_PRAZO}
              ariaLabel="Filtrar por prazo"
            />
          </FilterField>
          <FilterField label="Urgência">
            <FilterSegment value={filtros.urgencia} onChange={v => setFiltro('urgencia', v)} options={OPCOES_URGENCIA} ariaLabel="Urgência" />
          </FilterField>
          <FilterField label="Situação">
            <FilterSegment value={filtros.status} onChange={v => setFiltro('status', v)} options={OPCOES_STATUS} ariaLabel="Situação" />
          </FilterField>
          <FilterField label="Criadas entre" wide>
            <FilterDateRange
              from={filtros.criadoDe}
              to={filtros.criadoAte}
              onChange={(de, ate) => setFiltros(f => ({ ...f, criadoDe: de, criadoAte: ate }))}
            />
          </FilterField>
          {camposFiltraveis.map(c => (
            <FilterField key={c.id} label={c.nome}>
              <FilterSelect
                value={filtros.campos[c.id] || ''}
                onChange={v => setFiltroCampo(c.id, v)}
                placeholder="Qualquer valor"
                options={c.lista.map(op => ({ value: op, label: op }))}
                ariaLabel={`Filtrar por ${c.nome}`}
              />
            </FilterField>
          ))}
        </FilterPanel>

        <ActiveFilters chips={chipsKanban} onClearAll={limparFiltrosKanban} />

        {/* Quadro Kanban com Drag and Drop de Tarefas e Colunas */}
        {etapas.length === 0 ? (
          <div className={styles.emptyBoard}>
            <p>Este processo não possui etapas cadastradas.</p>
            <button className={styles.btnPrimary} onClick={() => setModalEtapaAberto(true)}>
              Adicionar primeira etapa
            </button>
          </div>
        ) : (
          <KanbanBoard
            label={`Etapas do processo ${processo.nome}`}
            columns={colunasKanban}
            onMove={(tarefa, _de, para) => moverTarefa(tarefa, para)}
            onOpen={tarefa => handleCardClick(tarefa.id)}
            getInsertIndex={(tarefa, lista) => {
              // O backend ordena as tarefas da etapa por data de criação
              const alvo = new Date(tarefa.criado_em).getTime();
              const i = lista.findIndex(t => new Date(t.criado_em).getTime() > alvo);
              return i === -1 ? lista.length : i;
            }}
            getColumnProps={coluna => ({
              onDragOver: e => handleGlobalDragOver(e, coluna.etapa.id),
              onDragLeave: e => handleGlobalDragLeave(e, coluna.etapa.id),
              onDrop: e => handleGlobalDrop(e, coluna.etapa.id),
              className: `${etapaArrastada?.id === coluna.etapa.id ? styles.columnDragging : ''} ${colunaDragOverId === coluna.etapa.id && etapaArrastada?.id !== coluna.etapa.id ? styles.columnDragOverTarget : ''}`,
            })}
            renderColumnHeader={(coluna, count) => (
              <div
                className={`${styles.columnHeader} ${styles.columnHeaderDraggable}`}
                draggable
                onDragStart={e => handleColumnDragStart(e, coluna.etapa)}
                onDragEnd={handleColumnDragEnd}
                title="Arraste o cabeçalho para reordenar a etapa"
              >
                <div className={styles.columnTitleRow}>
                  <div className={styles.columnTitleGroup}>
                    <span className={styles.columnTitle}>{coluna.name}</span>
                    <button
                      type="button"
                      className={styles.btnEditEtapa}
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => abrirModalEditarEtapa(coluna.etapa, e)}
                      title="Editar etapa"
                      aria-label={`Editar etapa ${coluna.name}`}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                  <span className={styles.columnCount}>{count}</span>
                </div>
              </div>
            )}
            renderCard={(tarefa, coluna) => (
              <div className={styles.taskCardBody}>
                <div className={styles.taskCardTop}>
                  <span className={styles.taskTitulo}>{tarefa.titulo}</span>
                  <button
                    type="button"
                    className={styles.btnEditCard}
                    onClick={e => { e.stopPropagation(); abrirModalEditarTarefa(tarefa, e); }}
                    title="Editar tarefa"
                    aria-label={`Editar ${tarefa.titulo}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>

                {renderizarChipsCampos(tarefa)}

                <div className={styles.taskMeta}>
                  <span>#{tarefa.id}</span>
                  {(tarefa.urgente === 1 || tarefa.urgente === true) && (
                    <span className={styles.urgentTag}>Urgente</span>
                  )}
                  {coluna?.final && <span className={styles.badgeConcluida}>Concluída</span>}
                  <span className={styles.taskDate}>
                    {formatarData(tarefa.prazo || tarefa.criado_em)}
                  </span>
                </div>
              </div>
            )}
          />
        )}

        {/* Modal Nova Tarefa */}
        <Modal open={Boolean(modalTarefaAberto)} onClose={() => setModalTarefaAberto(false)} maxWidth={520}>
          {modalTarefaAberto && (
            <>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Nova Tarefa</h2>
              </div>

              <form onSubmit={handleCriarTarefa}>
                <div className={styles.modalBody} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Título da Tarefa *</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      placeholder="Ex: Separar pedido #1234"
                      value={tituloTarefa}
                      onChange={e => setTituloTarefa(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Etapa *</label>
                    <select
                      className={styles.formSelect}
                      value={etapaIdTarefa}
                      onChange={e => setEtapaIdTarefa(e.target.value)}
                      required
                    >
                      {etapas.map(e => (
                        <option key={e.id} value={String(e.id)}>{e.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Responsável</label>
                    <select
                      className={styles.formSelect}
                      value={responsavelIdTarefa}
                      onChange={e => setResponsavelIdTarefa(e.target.value)}
                    >
                      <option value="">Não atribuído</option>
                      {usuariosPermitidos.map(u => (
                        <option key={u.id} value={String(u.id)}>{u.nome} ({u.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Prazo</label>
                    <input
                      className={styles.formInput}
                      type="date"
                      value={prazoTarefa}
                      onChange={e => setPrazoTarefa(e.target.value)}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.checkboxLabel} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <input
                        type="checkbox"
                        checked={urgenteTarefa}
                        onChange={e => setUrgenteTarefa(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#ef4444', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: urgenteTarefa ? '#f87171' : 'var(--gray-text-main)' }}>
                        Marcar como urgente
                      </span>
                    </label>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Descrição</label>
                    <textarea
                      className={styles.formTextarea}
                      placeholder="Detalhes ou observações da tarefa..."
                      value={descTarefa}
                      onChange={e => setDescTarefa(e.target.value)}
                    />
                  </div>

                  {/* Renderização Dinâmica de Campos do Processo */}
                  {campos.length > 0 && (
                    <div style={{
                      marginTop: '8px',
                      borderTop: '1px solid var(--color-border)',
                      paddingTop: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                          Campos do processo
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--gray-text-muted)' }}>
                          * Indica campos obrigatórios na criação
                        </span>
                      </div>

                      {campos.map(campo => {
                        const isObrigCriacao = !!campo.obrigatorio && !campo.etapa_obrigatoria_id;
                        const etapaExigidaObj = campo.etapa_obrigatoria_id
                          ? etapas.find(et => Number(et.id) === Number(campo.etapa_obrigatoria_id))
                          : null;

                        const val = valoresCampos[campo.id] ?? '';

                        if (campo.tipo === 'textarea') {
                          return (
                            <div key={campo.id} className={styles.formField}>
                              <label className={styles.formLabel}>
                                {campo.nome} {isObrigCriacao && <span style={{ color: '#ef4444' }}>*</span>}
                                {etapaExigidaObj && (
                                  <span style={{ fontSize: '11px', color: '#fbbf24', marginLeft: '6px', fontWeight: 400 }}>
                                    (Exigido na etapa: {etapaExigidaObj.nome})
                                  </span>
                                )}
                              </label>
                              <textarea
                                className={styles.formTextarea}
                                placeholder={`Informe ${campo.nome.toLowerCase()}...`}
                                value={val}
                                onChange={e => setValoresCampos(prev => ({ ...prev, [campo.id]: e.target.value }))}
                                required={Boolean(isObrigCriacao)}
                              />
                            </div>
                          );
                        }

                        if (campo.tipo === 'checkbox') {
                          return (
                            <div key={campo.id} className={styles.formField}>
                              <label className={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(val)}
                                  onChange={e => setValoresCampos(prev => ({ ...prev, [campo.id]: e.target.checked }))}
                                  required={Boolean(isObrigCriacao)}
                                />
                                <span>
                                  {campo.nome} {isObrigCriacao && <span style={{ color: '#ef4444' }}>*</span>}
                                  {etapaExigidaObj && (
                                    <span style={{ fontSize: '11px', color: '#fbbf24', marginLeft: '6px', fontWeight: 400 }}>
                                      (Exigido na etapa: {etapaExigidaObj.nome})
                                    </span>
                                  )}
                                </span>
                              </label>
                            </div>
                          );
                        }

                        if (campo.tipo === 'select') {
                          const listaOpcoes = (campo.opcoes || '')
                            .split(',')
                            .map(o => o.trim())
                            .filter(Boolean);

                          return (
                            <div key={campo.id} className={styles.formField}>
                              <label className={styles.formLabel}>
                                {campo.nome} {isObrigCriacao && <span style={{ color: '#ef4444' }}>*</span>}
                                {etapaExigidaObj && (
                                  <span style={{ fontSize: '11px', color: '#fbbf24', marginLeft: '6px', fontWeight: 400 }}>
                                    (Exigido na etapa: {etapaExigidaObj.nome})
                                  </span>
                                )}
                              </label>
                              <select
                                className={styles.formSelect}
                                value={val}
                                onChange={e => setValoresCampos(prev => ({ ...prev, [campo.id]: e.target.value }))}
                                required={Boolean(isObrigCriacao)}
                              >
                                <option value="">Selecione uma opção...</option>
                                {listaOpcoes.map((op, idx) => (
                                  <option key={idx} value={op}>{op}</option>
                                ))}
                              </select>
                            </div>
                          );
                        }

                        return (
                          <div key={campo.id} className={styles.formField}>
                            <label className={styles.formLabel}>
                              {campo.nome} {isObrigCriacao && <span style={{ color: '#ef4444' }}>*</span>}
                              {etapaExigidaObj && (
                                <span style={{ fontSize: '11px', color: '#fbbf24', marginLeft: '6px', fontWeight: 400 }}>
                                  (Exigido na etapa: {etapaExigidaObj.nome})
                                </span>
                              )}
                            </label>
                            <input
                              className={styles.formInput}
                              type={campo.tipo === 'numero' ? 'number' : campo.tipo === 'data' ? 'date' : 'text'}
                              placeholder={campo.tipo === 'moeda' ? 'Ex: R$ 1.500,00' : `Informe ${campo.nome.toLowerCase()}...`}
                              value={val}
                              onChange={e => setValoresCampos(prev => ({ ...prev, [campo.id]: e.target.value }))}
                              required={Boolean(isObrigCriacao)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.btnCancel}
                    onClick={() => setModalTarefaAberto(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className={styles.btnSave} disabled={salvandoTarefa}>
                    {salvandoTarefa ? 'Criando...' : 'Criar Tarefa'}
                  </button>
                </div>
              </form>
            </>
          )}
        </Modal>

        {/* Modal Editar Tarefa Rápido */}
        <Modal open={Boolean(modalEditarTarefaAberto && tarefaEmEdicao)} onClose={() => setModalEditarTarefaAberto(false)} maxWidth={520}>
          {modalEditarTarefaAberto && tarefaEmEdicao && (
            <>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Editar Tarefa #{tarefaEmEdicao.id}</h2>
              </div>

              <form onSubmit={handleSalvarEdicaoTarefa}>
                <div className={styles.modalBody} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Título da Tarefa *</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      value={tituloTarefaEdicao}
                      onChange={e => setTituloTarefaEdicao(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Prazo</label>
                    <input
                      className={styles.formInput}
                      type="date"
                      value={prazoTarefaEdicao}
                      onChange={e => setPrazoTarefaEdicao(e.target.value)}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.checkboxLabel} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <input
                        type="checkbox"
                        checked={urgenteTarefaEdicao}
                        onChange={e => setUrgenteTarefaEdicao(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#ef4444', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: urgenteTarefaEdicao ? '#f87171' : 'var(--gray-text-main)' }}>
                        Marcar como urgente
                      </span>
                    </label>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Descrição</label>
                    <textarea
                      className={styles.formTextarea}
                      value={descTarefaEdicao}
                      onChange={e => setDescTarefaEdicao(e.target.value)}
                    />
                  </div>

                  {campos.length > 0 && (
                    <div style={{
                      marginTop: '8px',
                      borderTop: '1px solid var(--color-border)',
                      paddingTop: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px'
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                        Campos Personalizados
                      </span>

                      {campos.map(campo => {
                        const val = valoresCamposEdicao[campo.id] ?? '';

                        if (campo.tipo === 'textarea') {
                          return (
                            <div key={campo.id} className={styles.formField}>
                              <label className={styles.formLabel}>{campo.nome}</label>
                              <textarea
                                className={styles.formTextarea}
                                value={val}
                                onChange={e => setValoresCamposEdicao(prev => ({ ...prev, [campo.id]: e.target.value }))}
                              />
                            </div>
                          );
                        }

                        if (campo.tipo === 'checkbox') {
                          return (
                            <div key={campo.id} className={styles.formField}>
                              <label className={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(val)}
                                  onChange={e => setValoresCamposEdicao(prev => ({ ...prev, [campo.id]: e.target.checked }))}
                                />
                                <span>{campo.nome}</span>
                              </label>
                            </div>
                          );
                        }

                        if (campo.tipo === 'select') {
                          const listaOpcoes = (campo.opcoes || '')
                            .split(',')
                            .map(o => o.trim())
                            .filter(Boolean);

                          return (
                            <div key={campo.id} className={styles.formField}>
                              <label className={styles.formLabel}>{campo.nome}</label>
                              <select
                                className={styles.formSelect}
                                value={val}
                                onChange={e => setValoresCamposEdicao(prev => ({ ...prev, [campo.id]: e.target.value }))}
                              >
                                <option value="">Selecione uma opção...</option>
                                {listaOpcoes.map((op, idx) => (
                                  <option key={idx} value={op}>{op}</option>
                                ))}
                              </select>
                            </div>
                          );
                        }

                        return (
                          <div key={campo.id} className={styles.formField}>
                            <label className={styles.formLabel}>{campo.nome}</label>
                            <input
                              className={styles.formInput}
                              type={campo.tipo === 'numero' ? 'number' : campo.tipo === 'data' ? 'date' : 'text'}
                              value={val}
                              onChange={e => setValoresCamposEdicao(prev => ({ ...prev, [campo.id]: e.target.value }))}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.btnCancel}
                    onClick={() => setModalEditarTarefaAberto(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className={styles.btnSave} disabled={salvandoEdicaoTarefa}>
                    {salvandoEdicaoTarefa ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </>
          )}
        </Modal>

        {/* Modal de Exigência da Etapa ao Mover */}
        <Modal open={Boolean(modalExigenciaEtapaAberto && etapaDestinoPendente)} onClose={() => setModalExigenciaEtapaAberto(false)} maxWidth={520}>
          {modalExigenciaEtapaAberto && etapaDestinoPendente && (
            <>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Campos Obrigatórios para Avançar</h2>
              </div>

              <form onSubmit={handleConfirmarMoverComCampos}>
                <div className={styles.modalBody} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className={styles.alertaExigenciaBox}>
                    A etapa <strong>&ldquo;{etapaDestinoPendente.nome}&rdquo;</strong> exige o preenchimento dos seguintes dados para que a tarefa possa avançar no fluxo:
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
                    {camposExigidosEtapa.map(campo => {
                      const val = valoresExigidos[campo.id] ?? '';

                      if (campo.tipo === 'textarea') {
                        return (
                          <div key={campo.id} className={styles.formField}>
                            <label className={styles.formLabel}>
                              {campo.nome} <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <textarea
                              className={styles.formTextarea}
                              placeholder={`Informe ${campo.nome.toLowerCase()}...`}
                              value={val}
                              onChange={e => setValoresExigidos(prev => ({ ...prev, [campo.id]: e.target.value }))}
                              required
                            />
                          </div>
                        );
                      }

                      if (campo.tipo === 'checkbox') {
                        return (
                          <div key={campo.id} className={styles.formField}>
                            <label className={styles.checkboxLabel}>
                              <input
                                type="checkbox"
                                checked={Boolean(val)}
                                onChange={e => setValoresExigidos(prev => ({ ...prev, [campo.id]: e.target.checked }))}
                                required
                              />
                              <span>{campo.nome} <span style={{ color: '#ef4444' }}>*</span></span>
                            </label>
                          </div>
                        );
                      }

                      if (campo.tipo === 'select') {
                        const listaOpcoes = (campo.opcoes || '')
                          .split(',')
                          .map(o => o.trim())
                          .filter(Boolean);

                        return (
                          <div key={campo.id} className={styles.formField}>
                            <label className={styles.formLabel}>
                              {campo.nome} <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select
                              className={styles.formSelect}
                              value={val}
                              onChange={e => setValoresExigidos(prev => ({ ...prev, [campo.id]: e.target.value }))}
                              required
                            >
                              <option value="">Selecione uma opção...</option>
                              {listaOpcoes.map((op, idx) => (
                                <option key={idx} value={op}>{op}</option>
                              ))}
                            </select>
                          </div>
                        );
                      }

                      return (
                        <div key={campo.id} className={styles.formField}>
                          <label className={styles.formLabel}>
                            {campo.nome} <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input
                            className={styles.formInput}
                            type={campo.tipo === 'numero' ? 'number' : campo.tipo === 'data' ? 'date' : 'text'}
                            placeholder={campo.tipo === 'moeda' ? 'Ex: R$ 1.500,00' : `Informe ${campo.nome.toLowerCase()}...`}
                            value={val}
                            onChange={e => setValoresExigidos(prev => ({ ...prev, [campo.id]: e.target.value }))}
                            required
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.btnCancel}
                    onClick={() => setModalExigenciaEtapaAberto(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className={styles.btnSave} disabled={salvandoExigencia}>
                    {salvandoExigencia ? 'Salvando...' : `Salvar e Mover para ${etapaDestinoPendente.nome}`}
                  </button>
                </div>
              </form>
            </>
          )}
        </Modal>

        {/* Modal Nova Etapa */}
        <Modal open={Boolean(modalEtapaAberto)} onClose={() => setModalEtapaAberto(false)} maxWidth={500}>
          {modalEtapaAberto && (
            <>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Nova Etapa</h2>
              </div>

              <form onSubmit={handleCriarEtapa}>
                <div className={styles.modalBody}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Nome da Etapa *</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      placeholder="Ex: Validação Jurídica"
                      value={nomeEtapa}
                      onChange={e => setNomeEtapa(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.btnCancel}
                    onClick={() => setModalEtapaAberto(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className={styles.btnSave} disabled={salvandoEtapa}>
                    {salvandoEtapa ? 'Adicionando...' : 'Adicionar Etapa'}
                  </button>
                </div>
              </form>
            </>
          )}
        </Modal>

        {/* Modal Editar Etapa */}
        <Modal open={Boolean(modalEditarEtapaAberto && etapaEmEdicao)} onClose={() => setModalEditarEtapaAberto(false)} maxWidth={500}>
          {modalEditarEtapaAberto && etapaEmEdicao && (
            <>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Editar Etapa</h2>
              </div>

              <form onSubmit={handleSalvarEdicaoEtapa}>
                <div className={styles.modalBody}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Nome da Etapa *</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      value={nomeEtapaEdicao}
                      onChange={e => setNomeEtapaEdicao(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={`${styles.modalFooter} ${styles.modalFooterBetween}`}>
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={handleExcluirEtapa}
                    disabled={salvandoEdicaoEtapa}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                    Excluir Etapa
                  </button>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className={styles.btnCancel}
                      onClick={() => setModalEditarEtapaAberto(false)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className={styles.btnSave} disabled={salvandoEdicaoEtapa}>
                      {salvandoEdicaoEtapa ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </Modal>

        {/* Modal de Configuração de Campos Personalizados do Processo */}
        <Modal open={Boolean(modalCamposAberto)} onClose={() => setModalCamposAberto(false)} maxWidth={560}>
          {modalCamposAberto && (
            <>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Campos Personalizados da Tarefa</h2>
              </div>

              <div className={styles.modalBody} style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                <p style={{ fontSize: '13px', color: 'var(--gray-text-muted)', margin: 0 }}>
                  Configure os campos que serão preenchidos nas tarefas deste processo. Você pode definir se o campo é exigido já na criação ou somente ao entrar em uma etapa específica (como Número da NF na etapa de faturamento).
                </p>

                {/* Lista de Campos Existentes */}
                <div>
                  <span className={styles.novoCampoHeader}>Campos Configurados ({campos.length})</span>
                  {campos.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--gray-text-muted)', margin: '8px 0 0' }}>
                      Nenhum campo personalizado cadastrado. As tarefas usarão apenas os dados padrão (Título, Descrição e Prazo).
                    </p>
                  ) : (
                    <div className={styles.camposList} style={{ marginTop: '8px' }}>
                      {campos.map(campo => {
                        const etapaExigidaObj = campo.etapa_obrigatoria_id
                          ? etapas.find(et => Number(et.id) === Number(campo.etapa_obrigatoria_id))
                          : null;

                        return (
                          <div key={campo.id} className={styles.campoItem}>
                            <div className={styles.campoItemInfo}>
                              <span className={styles.campoNome}>{campo.nome}</span>
                              <span className={styles.campoTipoBadge}>
                                {campo.tipo === 'texto' && 'Texto Curto'}
                                {campo.tipo === 'textarea' && 'Texto Longo'}
                                {campo.tipo === 'numero' && 'Número'}
                                {campo.tipo === 'moeda' && 'Moeda (R$)'}
                                {campo.tipo === 'data' && 'Data'}
                                {campo.tipo === 'select' && 'Seleção'}
                                {campo.tipo === 'checkbox' && 'Sim/Não'}
                              </span>

                              {!!campo.obrigatorio && !campo.etapa_obrigatoria_id && (
                                <span className={styles.campoObrigatorioBadge}>Obrigatório na Criação</span>
                              )}

                              {!!campo.obrigatorio && etapaExigidaObj && (
                                <span className={styles.campoEtapaBadge}>
                                  Obrigatório em: {etapaExigidaObj.nome}
                                </span>
                              )}

                              {!campo.obrigatorio && (
                                <span style={{ fontSize: '11px', color: 'var(--gray-text-muted)' }}>Opcional</span>
                              )}
                            </div>
                            <button
                              type="button"
                              className={styles.btnDeleteCampo}
                              onClick={() => handleExcluirCampo(campo.id, campo.nome)}
                              title="Remover campo do processo"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Formulário para Adicionar Novo Campo */}
                <form onSubmit={handleCriarCampo} className={styles.novoCampoBox}>
                  <span className={styles.novoCampoHeader}>+ Adicionar Novo Campo</span>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Nome do Campo *</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      placeholder="Ex: Número da NF, Solicitante, Conferente..."
                      value={nomeNovoCampo}
                      onChange={e => setNomeNovoCampo(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px', width: '100%' }}>
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Tipo do Campo *</label>
                      <select
                        className={styles.formSelect}
                        value={tipoNovoCampo}
                        onChange={e => setTipoNovoCampo(e.target.value)}
                      >
                        <option value="texto">Texto Curto</option>
                        <option value="textarea">Texto Longo</option>
                        <option value="numero">Número</option>
                        <option value="moeda">Valor Monetário (R$)</option>
                        <option value="data">Data</option>
                        <option value="select">Seleção (Dropdown)</option>
                        <option value="checkbox">Caixa de Seleção (Sim/Não)</option>
                      </select>
                    </div>

                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Regra de Preenchimento *</label>
                      <select
                        className={styles.formSelect}
                        value={regraObrigatorioNovoCampo}
                        onChange={e => setRegraObrigatorioNovoCampo(e.target.value)}
                        title="Selecione quando este campo deve ser obrigatoriamente preenchido"
                      >
                        <option value="opcional">Opcional em todas as etapas</option>
                        <option value="criacao">Obrigatório na Criação</option>
                        {etapas.map(et => (
                          <option key={et.id} value={String(et.id)}>
                            Obrigatório na etapa: {et.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {tipoNovoCampo === 'select' && (
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Opções (separadas por vírgula) *</label>
                      <input
                        className={styles.formInput}
                        type="text"
                        placeholder="Ex: Baixa, Média, Alta, Crítica"
                        value={opcoesNovoCampo}
                        onChange={e => setOpcoesNovoCampo(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className={styles.btnPrimary}
                    disabled={salvandoCampo}
                    style={{ justifyContent: 'center', height: '36px', marginTop: '4px' }}
                  >
                    {salvandoCampo ? 'Adicionando...' : 'Adicionar Campo ao Processo'}
                  </button>
                </form>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSave}
                  onClick={() => setModalCamposAberto(false)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Concluir
                </button>
              </div>
            </>
          )}
        </Modal>
      </main>
    </div>
  );
}
