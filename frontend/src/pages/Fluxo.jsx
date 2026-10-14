import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import styles from './Fluxo.module.css';

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
  const [tarefaArrastada, setTarefaArrastada] = useState(null);
  const [dropTargetEtapaId, setDropTargetEtapaId] = useState(null);
  const [etapaArrastada, setEtapaArrastada] = useState(null);
  const [colunaDragOverId, setColunaDragOverId] = useState(null);

  const isDraggingTaskRef = useRef(false);
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
            alert(`O campo obrigatório "${c.nome}" deve ser marcado.`);
            return;
          }
        } else if (val === undefined || val === null || String(val).trim() === '') {
          alert(`O campo "${c.nome}" é obrigatório na criação da tarefa.`);
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
      alert(err.response?.data?.error || 'Erro ao criar tarefa');
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
      alert(err.response?.data?.error || 'Erro ao salvar alterações da tarefa');
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
      alert(err.response?.data?.error || 'Erro ao criar etapa');
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
      alert(err.response?.data?.error || 'Erro ao editar etapa');
    } finally {
      setSalvandoEdicaoEtapa(false);
    }
  }

  async function handleExcluirEtapa() {
    if (!etapaEmEdicao) return;
    const confirmou = window.confirm(
      `Tem certeza que deseja excluir a etapa "${etapaEmEdicao.nome}"?\nTodas as tarefas vinculadas a esta etapa também serão excluídas.`
    );
    if (!confirmou) return;

    setSalvandoEdicaoEtapa(true);
    try {
      await api.delete(`/etapas/${etapaEmEdicao.id}`);
      setModalEditarEtapaAberto(false);
      setEtapaEmEdicao(null);
      await carregarDados();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao excluir etapa');
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
      alert(err.response?.data?.error || 'Erro ao cadastrar campo');
    } finally {
      setSalvandoCampo(false);
    }
  }

  async function handleExcluirCampo(campoId, nomeCampo) {
    if (!window.confirm(`Tem certeza que deseja remover o campo "${nomeCampo}" deste processo?`)) return;
    try {
      await api.delete(`/campos/${campoId}`);
      await carregarCampos();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao excluir campo');
    }
  }

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

  // --- Handlers de Drag and Drop de Tarefas ---
  function handleTaskDragStart(e, tarefa) {
    e.stopPropagation();
    isDraggingTaskRef.current = true;
    setTarefaArrastada(tarefa);
    e.dataTransfer.setData('type', 'task');
    e.dataTransfer.setData('text/plain', String(tarefa.id));
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleTaskDragEnd() {
    setTimeout(() => {
      isDraggingTaskRef.current = false;
    }, 100);
    setTarefaArrastada(null);
    setDropTargetEtapaId(null);
  }

  function handleGlobalDragOver(e, etapaId) {
    e.preventDefault();
    if (isDraggingColumnRef.current || etapaArrastada) {
      e.dataTransfer.dropEffect = 'move';
      if (colunaDragOverId !== etapaId) {
        setColunaDragOverId(etapaId);
      }
    } else if (tarefaArrastada) {
      e.dataTransfer.dropEffect = 'move';
      if (dropTargetEtapaId !== etapaId) {
        setDropTargetEtapaId(etapaId);
      }
    }
  }

  function handleGlobalDragLeave(e, etapaId) {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (colunaDragOverId === etapaId) setColunaDragOverId(null);
    if (dropTargetEtapaId === etapaId) setDropTargetEtapaId(null);
  }

  async function handleGlobalDrop(e, etapaIdDestino) {
    e.preventDefault();
    setDropTargetEtapaId(null);
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
        alert('Erro ao salvar nova ordem das etapas.');
        await carregarDados();
      }
      return;
    }

    // 2. Mover Tarefa entre Colunas
    if (tarefaArrastada) {
      const etapaOrigemId = Number(tarefaArrastada.etapa_id);
      const etapaDestinoNum = Number(etapaIdDestino);

      if (etapaOrigemId === etapaDestinoNum) {
        setTarefaArrastada(null);
        return;
      }

      const destinoEtapaObj = etapas.find(et => Number(et.id) === etapaDestinoNum);

      // VERIFICAÇÃO DE CAMPOS EXIGIDOS PELA ETAPA DE DESTINO
      let valoresAtuais = {};
      if (tarefaArrastada.campos_personalizados) {
        try {
          valoresAtuais = typeof tarefaArrastada.campos_personalizados === 'string'
            ? JSON.parse(tarefaArrastada.campos_personalizados)
            : tarefaArrastada.campos_personalizados;
        } catch {}
      }

      // Filtra campos obrigatórios configurados especificamente para esta etapa de destino
      const exigidos = campos.filter(c =>
        c.obrigatorio &&
        Number(c.etapa_obrigatoria_id) === etapaDestinoNum &&
        (valoresAtuais[c.id] === undefined || valoresAtuais[c.id] === null || String(valoresAtuais[c.id]).trim() === '')
      );

      if (exigidos.length > 0) {
        // Abre modal para que o usuário preencha antes de concluir o avanço de etapa
        setTarefaPendenteMover(tarefaArrastada);
        setEtapaDestinoPendente(destinoEtapaObj);
        setCamposExigidosEtapa(exigidos);

        const initVals = { ...valoresAtuais };
        exigidos.forEach(c => {
          initVals[c.id] = c.tipo === 'checkbox' ? false : '';
        });
        setValoresExigidos(initVals);
        setModalExigenciaEtapaAberto(true);
        setTarefaArrastada(null);
        return;
      }

      // Se não há pendências, move diretamente
      const tarefaMovida = { ...tarefaArrastada, etapa_id: etapaDestinoNum };
      setTarefas(prev => prev.map(t => (t.id === tarefaMovida.id ? tarefaMovida : t)));

      try {
        await api.patch(`/tarefas/${tarefaMovida.id}/mover`, {
          etapa_id: etapaDestinoNum,
        });
        await carregarDados();
      } catch (err) {
        console.error('Erro ao mover tarefa:', err);
        alert('Erro ao mover a tarefa.');
        await carregarDados();
      } finally {
        setTarefaArrastada(null);
      }
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
          alert(`O campo obrigatório "${c.nome}" deve ser marcado para avançar.`);
          return;
        }
      } else if (v === undefined || v === null || String(v).trim() === '') {
        alert(`O campo "${c.nome}" é obrigatório para mover a tarefa para "${etapaDestinoPendente.nome}".`);
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
      alert('Erro ao mover tarefa.');
    } finally {
      setSalvandoExigencia(false);
    }
  }

  function handleCardClick(tarefaId) {
    if (isDraggingTaskRef.current || isDraggingColumnRef.current) return;
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
        <div className={styles.pageHeader}>
          <button className={styles.btnBack} onClick={() => navigate('/processos')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Voltar
          </button>

          <div className={styles.headerRow}>
            <div className={styles.headerInfo}>
              <h1 className={styles.pageTitle}>{processo.nome}</h1>
              <p className={styles.pageSubtitle}>
                {processo.descricao ? `${processo.descricao} • ` : ''}
                {tarefas.length} {tarefas.length === 1 ? 'tarefa' : 'tarefas'} em {etapas.length} {etapas.length === 1 ? 'etapa' : 'etapas'} • Arraste tarefas entre etapas ou cabeçalhos para reordenar
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
                Campos da Tarefa {campos.length > 0 && `(${campos.length})`}
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
                Nova Etapa
              </button>

              <Link to="/tabela" className={styles.btnOutline} style={{ textDecoration: 'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
                Visualizar Tabela
              </Link>

              <button
                type="button"
                className={styles.btnPrimary}
                onClick={abrirModalNovaTarefa}
                disabled={etapas.length === 0}
                title={etapas.length === 0 ? 'Crie ao menos uma etapa antes de adicionar tarefas' : ''}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Nova Tarefa
              </button>
            </div>
          </div>
        </div>

        {/* Quadro Kanban com Drag and Drop de Tarefas e Colunas */}
        {etapas.length === 0 ? (
          <div style={{
            background: 'var(--slate-800)',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            padding: '40px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <p style={{ color: 'var(--slate-400)', margin: 0 }}>Este processo não possui etapas cadastradas.</p>
            <button className={styles.btnPrimary} onClick={() => setModalEtapaAberto(true)}>
              Adicionar primeira etapa
            </button>
          </div>
        ) : (
          <div className={styles.kanban}>
            {etapas.map(etapa => {
              const tarefasEtapa = tarefas.filter(t => Number(t.etapa_id) === Number(etapa.id));
              const porcentagem = tarefas.length > 0 ? (tarefasEtapa.length / tarefas.length) * 100 : 0;
              const isFinal = isEtapaFinal(etapa.nome);
              const isOver = dropTargetEtapaId === etapa.id;
              const isDraggingThisColumn = etapaArrastada?.id === etapa.id;
              const isDragOverThisColumn = colunaDragOverId === etapa.id;

              return (
                <div
                  key={etapa.id}
                  className={`${styles.column} ${isFinal ? styles.columnFinalizado : ''} ${isOver ? styles.columnDropTarget : ''} ${isDraggingThisColumn ? styles.columnDragging : ''} ${isDragOverThisColumn ? styles.columnDragOverTarget : ''}`}
                  onDragOver={e => handleGlobalDragOver(e, etapa.id)}
                  onDragLeave={e => handleGlobalDragLeave(e, etapa.id)}
                  onDrop={e => handleGlobalDrop(e, etapa.id)}
                >
                  {/* Cabeçalho da Coluna: Arrastável para reordenar */}
                  <div
                    className={`${styles.columnHeader} ${styles.columnHeaderDraggable}`}
                    draggable
                    onDragStart={e => handleColumnDragStart(e, etapa)}
                    onDragEnd={handleColumnDragEnd}
                    title="Arraste pelo cabeçalho para reordenar a etapa horizontalmente"
                  >
                    <div className={styles.columnTitleRow}>
                      <div className={styles.columnTitleGroup}>
                        <span className={styles.columnTitle}>{etapa.nome}</span>
                        <button
                          type="button"
                          className={styles.btnEditEtapa}
                          onMouseDown={e => e.stopPropagation()}
                          onClick={e => abrirModalEditarEtapa(etapa, e)}
                          title="Editar etapa"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </div>
                      <span className={styles.columnCount}>
                        {tarefasEtapa.length}
                      </span>
                    </div>

                    <div className={styles.columnMeta}>
                      <div className={styles.columnBar}>
                        <div
                          className={isFinal ? styles.columnBarFillGreen : styles.columnBarFill}
                          style={{ width: `${porcentagem}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cards da Coluna */}
                  <div className={styles.columnCards}>
                    {tarefasEtapa.length === 0 ? (
                      <div className={styles.emptyCard}>
                        {isOver ? 'Solte aqui para mover' : 'Nenhuma tarefa'}
                      </div>
                    ) : (
                      tarefasEtapa.map(tarefa => {
                        const isThisDragging = tarefaArrastada?.id === tarefa.id;

                        return (
                          <div
                            key={tarefa.id}
                            draggable
                            onDragStart={e => handleTaskDragStart(e, tarefa)}
                            onDragEnd={handleTaskDragEnd}
                            onClick={() => handleCardClick(tarefa.id)}
                            className={`${styles.taskCard} ${isThisDragging ? styles.taskCardDragging : ''}`}
                            title="Clique para ver detalhes ou arraste para outra etapa"
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                              <span className={styles.taskTitulo}>{tarefa.titulo}</span>
                              <button
                                type="button"
                                className={styles.btnEditCard}
                                onClick={e => abrirModalEditarTarefa(tarefa, e)}
                                title="Editar dados e campos da tarefa"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                            </div>

                            {/* Exibição dos chips de campos customizados */}
                            {renderizarChipsCampos(tarefa)}

                            <div className={styles.taskMeta}>
                              <span>#{tarefa.id}</span>
                              {(tarefa.urgente === 1 || tarefa.urgente === true) && (
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
                              {isFinal && (
                                <span className={styles.badgeConcluida}>Concluída</span>
                              )}
                              {tarefa.prazo ? (
                                <span>Prazo: {formatarData(tarefa.prazo)}</span>
                              ) : (
                                <span>{formatarData(tarefa.criado_em)}</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Nova Tarefa */}
        {modalTarefaAberto && (
          <div className={styles.modalOverlay} onClick={() => setModalTarefaAberto(false)}>
            <div className={styles.modalCard} onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
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
                        ⚑ Marcar como Tarefa Urgente
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
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--turquesa-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Campos do Processo
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--gray-text-muted)' }}>
                          * Indica campos obrigatórios na criação
                        </span>
                      </div>

                      {campos.map(campo => {
                        const isObrigCriacao = campo.obrigatorio && !campo.etapa_obrigatoria_id;
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
            </div>
          </div>
        )}

        {/* Modal Editar Tarefa Rápido */}
        {modalEditarTarefaAberto && tarefaEmEdicao && (
          <div className={styles.modalOverlay} onClick={() => setModalEditarTarefaAberto(false)}>
            <div className={styles.modalCard} onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
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
                        ⚑ Marcar como Tarefa Urgente
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
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--turquesa-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
            </div>
          </div>
        )}

        {/* Modal de Exigência da Etapa ao Mover */}
        {modalExigenciaEtapaAberto && etapaDestinoPendente && (
          <div className={styles.modalOverlay} onClick={() => setModalExigenciaEtapaAberto(false)}>
            <div className={styles.modalCard} onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
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
            </div>
          </div>
        )}

        {/* Modal Nova Etapa */}
        {modalEtapaAberto && (
          <div className={styles.modalOverlay} onClick={() => setModalEtapaAberto(false)}>
            <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
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
            </div>
          </div>
        )}

        {/* Modal Editar Etapa */}
        {modalEditarEtapaAberto && etapaEmEdicao && (
          <div className={styles.modalOverlay} onClick={() => setModalEditarEtapaAberto(false)}>
            <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
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
            </div>
          </div>
        )}

        {/* Modal de Configuração de Campos Personalizados do Processo */}
        {modalCamposAberto && (
          <div className={styles.modalOverlay} onClick={() => setModalCamposAberto(false)}>
            <div className={styles.modalCard} onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
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

                              {campo.obrigatorio && !campo.etapa_obrigatoria_id && (
                                <span className={styles.campoObrigatorioBadge}>Obrigatório na Criação</span>
                              )}

                              {campo.obrigatorio && etapaExigidaObj && (
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
