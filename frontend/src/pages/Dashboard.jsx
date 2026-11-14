import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSetor } from '../context/SetorContext';
import Sidebar from '../components/Sidebar';
import SidebarTrigger from '../components/SidebarTrigger';
import api from '../services/api';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { usuario } = useAuth();
  const { setorAtivo } = useSetor();

  const [processos, setProcessos] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pendentes'); // 'pendentes', 'atrasadas', 'hoje', 'urgentes'
  const [busca, setBusca] = useState('');

  // Carrega dados da API
  useEffect(() => {
    async function carregarDados() {
      setLoading(true);
      try {
        const queryParams = setorAtivo ? `?setor_id=${setorAtivo.id}` : '';
        const [resProc, resTar] = await Promise.all([
          api.get(`/processos${queryParams}`),
          api.get(`/tarefas${queryParams}`),
        ]);
        setProcessos(resProc.data || []);
        setTarefas(resTar.data || []);
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, [setorAtivo]);

  // Checagem de conclusão
  function isConcluida(t) {
    if (t.concluida === 1 || t.concluida === true) return true;
    const nome = (t.etapa_nome || '').toLowerCase();
    return nome.includes('finaliz') || nome.includes('concluíd') || nome.includes('concluid');
  }

  // Cálculos de Status de Prazo
  function getPrazoInfo(prazoStr) {
    if (!prazoStr) return { status: 'sem_prazo', label: 'Sem prazo', dias: null };
    
    // Normalizar para data local considerando apenas dia/mês/ano
    const [ano, mes, dia] = prazoStr.split('T')[0].split('-').map(Number);
    const prazoDate = new Date(ano, mes - 1, dia);
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const diffMs = prazoDate.getTime() - hoje.getTime();
    const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      return { 
        status: 'atrasada', 
        label: `Atrasada (${Math.abs(diffDias)}d)`, 
        dias: diffDias,
        color: '#ef4444' 
      };
    } else if (diffDias === 0) {
      return { 
        status: 'hoje', 
        label: 'Vence hoje', 
        dias: 0,
        color: '#f59e0b' 
      };
    } else if (diffDias === 1) {
      return { 
        status: 'amanha', 
        label: 'Vence amanhã', 
        dias: 1,
        color: '#38bdf8' 
      };
    } else if (diffDias <= 3) {
      return { 
        status: 'em_breve', 
        label: `Em ${diffDias} dias`, 
        dias: diffDias,
        color: '#38bdf8' 
      };
    } else {
      const dataFormatada = prazoDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      return { 
        status: 'em_dia', 
        label: dataFormatada, 
        dias: diffDias,
        color: '#94a3b8' 
      };
    }
  }

  // Métricas agregadas
  const metricas = useMemo(() => {
    const total = tarefas.length;
    const concluidas = tarefas.filter(t => isConcluida(t));
    const pendentes = tarefas.filter(t => !isConcluida(t));

    const atrasadas = pendentes.filter(t => {
      const info = getPrazoInfo(t.prazo);
      return info.status === 'atrasada';
    });

    const vencendoHoje = pendentes.filter(t => {
      const info = getPrazoInfo(t.prazo);
      return info.status === 'hoje';
    });

    const vencendoEmBreve = pendentes.filter(t => {
      const info = getPrazoInfo(t.prazo);
      return info.status === 'hoje' || info.status === 'amanha' || (info.dias !== null && info.dias >= 0 && info.dias <= 3);
    });

    const urgentes = pendentes.filter(t => t.urgente === 1 || t.urgente === true);

    const taxa = total > 0 ? Math.round((concluidas.length / total) * 100) : 100;
    const totalEtapas = processos.reduce((acc, p) => acc + (parseInt(p.etapas) || 0), 0);

    return {
      total,
      concluidas: concluidas.length,
      pendentes: pendentes.length,
      atrasadas: atrasadas.length,
      vencendoHoje: vencendoHoje.length,
      vencendoEmBreve: vencendoEmBreve.length,
      urgentes: urgentes.length,
      taxa,
      totalEtapas,
      mediaEtapas: processos.length > 0 ? (totalEtapas / processos.length).toFixed(1) : '0'
    };
  }, [tarefas, processos]);

  // Filtro de tarefas para a seção Overview
  const tarefasFiltradasOverview = useMemo(() => {
    let lista = tarefas.filter(t => !isConcluida(t));

    if (activeTab === 'atrasadas') {
      lista = lista.filter(t => getPrazoInfo(t.prazo).status === 'atrasada');
    } else if (activeTab === 'em_breve') {
      lista = lista.filter(t => {
        const info = getPrazoInfo(t.prazo);
        return info.status === 'hoje' || info.status === 'amanha' || (info.dias !== null && info.dias >= 0 && info.dias <= 3);
      });
    } else if (activeTab === 'urgentes') {
      lista = lista.filter(t => t.urgente === 1 || t.urgente === true);
    }

    if (busca.trim()) {
      const q = busca.toLowerCase();
      lista = lista.filter(t => 
        (t.titulo && t.titulo.toLowerCase().includes(q)) ||
        (t.processo_nome && t.processo_nome.toLowerCase().includes(q)) ||
        (t.responsavel_nome && t.responsavel_nome.toLowerCase().includes(q)) ||
        (t.etapa_nome && t.etapa_nome.toLowerCase().includes(q))
      );
    }

    return lista;
  }, [tarefas, activeTab, busca]);

  // Limite executivo para não poluir o Dashboard
  const tarefasExibidas = useMemo(() => {
    return tarefasFiltradasOverview.slice(0, 8);
  }, [tarefasFiltradasOverview]);

  // Lista de processos detalhada com progresso e contadores
  const processosCards = useMemo(() => {
    return processos.map(p => {
      const tarefasProc = tarefas.filter(t => t.processo_id === p.id);
      const concluidas = tarefasProc.filter(t => isConcluida(t));
      const pendentes = tarefasProc.filter(t => !isConcluida(t));
      const atrasadas = pendentes.filter(t => getPrazoInfo(t.prazo).status === 'atrasada');
      
      const pct = tarefasProc.length > 0
        ? Math.round((concluidas.length / tarefasProc.length) * 100)
        : 0;

      const respsUnicos = new Set(tarefasProc.map(t => t.responsavel_id).filter(Boolean));

      return {
        ...p,
        totalTarefas: tarefasProc.length,
        tarefasPendentes: pendentes.length,
        tarefasAtrasadas: atrasadas.length,
        progresso: pct,
        totalResponsaveis: respsUnicos.size || 1,
        corSetor: p.setor_cor || '#45c4d6'
      };
    });
  }, [processos, tarefas]);

  // Limite executivo para não poluir o Dashboard (máximo 3 fluxos)
  const processosExibidos = useMemo(() => {
    return processosCards.slice(0, 6);
  }, [processosCards]);

  // Formatação de data amigável para o cabeçalho executivo
  const dataHojeFormatada = useMemo(() => {
    const agora = new Date();
    const str = agora.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, []);

  const prazoClass = (status) =>
    status === 'atrasada' ? styles.dueDanger
      : status === 'hoje' ? styles.dueWarning
      : status === 'amanha' || status === 'em_breve' ? styles.dueSoon
      : styles.dueNormal;

  const abas = [
    { id: 'pendentes', label: 'Pendentes', count: metricas.pendentes },
    { id: 'atrasadas', label: 'Atrasadas', count: metricas.atrasadas, tone: 'danger' },
    { id: 'em_breve', label: 'Vencem em breve', count: metricas.vencendoEmBreve },
    { id: 'urgentes', label: 'Urgentes', count: metricas.urgentes },
  ];

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        {/* Cabeçalho */}
        <header className={styles.topHeader}>
          <div className={styles.headerLeft}>
            <SidebarTrigger />
            <div className={styles.headerTitleWrap}>
              <span className={styles.dateLabel}>{dataHojeFormatada}</span>
              <h1 className={styles.pageTitle}>
                Olá, {usuario?.nome ? usuario.nome.split(' ')[0] : 'Gestor'}
              </h1>
              <p className={styles.pageSubtitle}>
                {setorAtivo ? (
                  <>
                    <span className={styles.sectorDot} style={{ backgroundColor: setorAtivo.cor || '#45c4d6' }} />
                    Resumo do setor <strong>{setorAtivo.nome}</strong>
                  </>
                ) : (
                  'Resumo de todos os setores'
                )}
              </p>
            </div>
          </div>

          <div className={styles.headerToolbar}>
            <Link to="/tabela" className={styles.btnSecondary}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M3 15h18M9 3v18" />
              </svg>
              <span>Tabela</span>
            </Link>
            <Link to="/processos" className={styles.btnPrimary}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Novo processo</span>
            </Link>
          </div>
        </header>

        {/* Indicadores */}
        <section className={styles.kpiGrid} aria-label="Indicadores">
          <Link to="/processos" className={styles.kpiCell}>
            <span className={styles.kpiLabel}>Processos ativos</span>
            <span className={styles.kpiValue}>{loading ? '—' : processos.length}</span>
            <span className={styles.kpiMeta}>{metricas.totalEtapas} etapas no total</span>
          </Link>

          <div className={styles.kpiCell}>
            <span className={styles.kpiLabel}>Tarefas em aberto</span>
            <span className={styles.kpiValue}>{loading ? '—' : metricas.pendentes}</span>
            <span className={styles.kpiMeta}>
              {metricas.vencendoHoje > 0 ? `${metricas.vencendoHoje} vence(m) hoje` : 'Nenhuma vence hoje'}
            </span>
          </div>

          <button
            type="button"
            className={`${styles.kpiCell} ${styles.kpiCellButton}`}
            onClick={() => setActiveTab('atrasadas')}
            title="Mostrar tarefas atrasadas"
          >
            <span className={styles.kpiLabel}>Atrasadas</span>
            <span className={`${styles.kpiValue} ${metricas.atrasadas > 0 ? styles.valDanger : ''}`}>
              {loading ? '—' : metricas.atrasadas}
            </span>
            <span className={styles.kpiMeta}>
              {metricas.atrasadas > 0 ? 'Precisam de atenção' : 'Tudo dentro do prazo'}
            </span>
          </button>

          <div className={styles.kpiCell}>
            <span className={styles.kpiLabel}>Concluídas</span>
            <span className={styles.kpiValue}>
              {loading ? '—' : `${metricas.taxa}%`}
            </span>
            <div className={styles.kpiProgress}>
              <div className={styles.kpiProgressTrack}>
                <div className={styles.kpiProgressFill} style={{ width: `${Math.min(100, Math.max(0, metricas.taxa))}%` }} />
              </div>
              <span className={styles.kpiMeta}>{metricas.concluidas} de {metricas.total}</span>
            </div>
          </div>
        </section>

        <div className={styles.columns}>
          {/* Tarefas */}
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitleRow}>
                <h2 className={styles.sectionTitle}>Tarefas</h2>
                <div className={styles.searchBox}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className={styles.searchInput}
                  />
                  {busca && (
                    <button onClick={() => setBusca('')} className={styles.searchClearBtn} title="Limpar busca">×</button>
                  )}
                </div>
              </div>

              <div className={styles.tabsStrip} role="tablist">
                {abas.map(a => (
                  <button
                    key={a.id}
                    role="tab"
                    aria-selected={activeTab === a.id}
                    onClick={() => setActiveTab(a.id)}
                    className={`${styles.tabBtn} ${activeTab === a.id ? styles.tabBtnActive : ''}`}
                  >
                    <span>{a.label}</span>
                    <span className={`${styles.tabCount} ${a.tone === 'danger' && a.count > 0 ? styles.tabCountDanger : ''}`}>
                      {a.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <span>Carregando tarefas…</span>
              </div>
            ) : tarefasFiltradasOverview.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>Nada por aqui</p>
                <p className={styles.emptySubtitle}>
                  {busca
                    ? `Nenhuma tarefa corresponde a "${busca}".`
                    : activeTab === 'atrasadas'
                    ? 'Nenhuma tarefa está atrasada.'
                    : 'Nenhuma tarefa nesta categoria.'}
                </p>
                {(busca || activeTab !== 'pendentes') && (
                  <button onClick={() => { setActiveTab('pendentes'); setBusca(''); }} className={styles.emptyResetBtn}>
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <ul className={styles.taskList}>
                {tarefasExibidas.map((t) => {
                  const prazoInfo = getPrazoInfo(t.prazo);
                  const isUrgente = t.urgente === 1 || t.urgente === true;
                  return (
                    <li key={t.id}>
                      <Link to={`/tarefas/${t.id}`} className={styles.taskRow}>
                        <span
                          className={styles.taskSectorDot}
                          style={{ backgroundColor: t.setor_cor || '#45c4d6' }}
                          title={t.setor_nome || ''}
                        />
                        <div className={styles.taskMain}>
                          <span className={styles.taskTitle} title={t.titulo}>
                            {t.titulo}
                            {isUrgente && <span className={styles.urgentTag}>Urgente</span>}
                          </span>
                          <span className={styles.taskSub}>
                            {t.processo_nome || 'Geral'}
                            <span className={styles.sep}>/</span>
                            {t.etapa_nome || 'Em andamento'}
                          </span>
                        </div>
                        <span className={styles.taskAssignee} title={t.responsavel_nome || 'Não atribuído'}>
                          <span className={styles.assigneeAvatar}>
                            {t.responsavel_nome ? t.responsavel_nome.trim().charAt(0).toUpperCase() : '?'}
                          </span>
                          <span className={styles.assigneeName}>{t.responsavel_nome || 'Não atribuído'}</span>
                        </span>
                        <span className={`${styles.taskDue} ${prazoClass(prazoInfo.status)}`}>
                          {prazoInfo.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {tarefasFiltradasOverview.length > tarefasExibidas.length && (
              <div className={styles.panelFooter}>
                <span>
                  Mostrando {tarefasExibidas.length} de {tarefasFiltradasOverview.length}
                </span>
                <Link to="/tabela" className={styles.linkMore}>
                  Ver todas na tabela →
                </Link>
              </div>
            )}
          </section>

          {/* Processos */}
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitleRow}>
                <h2 className={styles.sectionTitle}>Processos</h2>
                <Link to="/processos" className={styles.linkMore}>Ver todos</Link>
              </div>
            </div>

            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
              </div>
            ) : processosCards.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptySubtitle}>Nenhum processo neste setor ainda.</p>
                <Link to="/processos" className={styles.emptyResetBtn}>Criar processo</Link>
              </div>
            ) : (
              <ul className={styles.processList}>
                {processosExibidos.map((p) => (
                  <li key={p.id}>
                    <Link to={`/processos/${p.id}/fluxo`} className={styles.processRow}>
                      <div className={styles.processTop}>
                        <span className={styles.processName}>{p.nome}</span>
                        <span className={styles.processPct}>{p.progresso}%</span>
                      </div>
                      <div className={styles.progressTrack}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${Math.min(100, Math.max(0, p.progresso))}%`, backgroundColor: p.corSetor }}
                        />
                      </div>
                      <div className={styles.processMeta}>
                        {p.setor_nome && (
                          <span className={styles.processSector}>
                            <span className={styles.taskSectorDot} style={{ backgroundColor: p.corSetor }} />
                            {p.setor_nome}
                          </span>
                        )}
                        <span>{p.tarefasPendentes} em aberto</span>
                        {p.tarefasAtrasadas > 0 && (
                          <span className={styles.textDanger}>{p.tarefasAtrasadas} atrasada{p.tarefasAtrasadas > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
