import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSetor } from '../context/SetorContext';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { usuario } = useAuth();
  const { setorAtivo } = useSetor();
  const navigate = useNavigate();

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
    return tarefasFiltradasOverview.slice(0, 6);
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
        corSetor: p.setor_cor || '#2fd9f4'
      };
    });
  }, [processos, tarefas]);

  // Limite executivo para não poluir o Dashboard (máximo 3 fluxos)
  const processosExibidos = useMemo(() => {
    return processosCards.slice(0, 3);
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

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        {/* Glow de Iluminação Ambiente (Stitch Obsidian Motif) */}
        <div className={styles.ambientGlowWrap} aria-hidden="true">
          <div className={styles.ambientGlowCyan}></div>
          <div className={styles.ambientGlowMint}></div>
        </div>

        {/* 1. Header Executivo com Saudação e Controles */}
        <header className={styles.topHeader}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.dateLabelRow}>
              <span className={styles.dateLabel}>{dataHojeFormatada}</span>
            </div>
            
            <div className={styles.greetingRow}>
              <h1 className={styles.pageTitle}>
                Olá, {usuario?.nome ? usuario.nome.split(' ')[0] : 'Gestor'}
              </h1>
              <span className={styles.waveEmoji} role="img" aria-label="Aceno">👋</span>
              
              <div 
                className={styles.sectorChipHeader}
                style={{
                  backgroundColor: `${setorAtivo?.cor || '#2fd9f4'}16`,
                  color: setorAtivo?.cor || '#2fd9f4',
                  borderColor: `${setorAtivo?.cor || '#2fd9f4'}38`,
                }}
              >
                <span 
                  className={styles.sectorDot} 
                  style={{ backgroundColor: setorAtivo?.cor || '#2fd9f4' }} 
                />
                <span>{setorAtivo ? setorAtivo.nome : 'Visão Geral Consolidada'}</span>
              </div>
            </div>

            <p className={styles.pageSubtitle}>
              {setorAtivo
                ? `Painel de controle com processos, metas e tarefas operacionais exclusivas do setor "${setorAtivo.nome}".`
                : 'Monitoramento unificado de produtividade, gargalos e execução de fluxos operacionais em todos os setores.'}
            </p>
          </div>

          <div className={styles.headerToolbar}>
            <Link to="/tabela" className={styles.btnSecondary} title="Visualizar planilha avançada de tarefas">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
              </svg>
              <span>Tabela Operacional</span>
            </Link>

            <Link to="/processos" className={styles.btnPrimary} title="Configurar ou modelar novo fluxo">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Novo Processo</span>
            </Link>
          </div>
        </header>

        {/* 2. Grid de 4 KPIs Executivos com Acentos Visuais */}
        <section className={styles.kpiGrid} aria-label="Indicadores Chave">
          {/* Card 1: Processos */}
          <div className={styles.kpiCard}>
            <div className={styles.kpiCardTop}>
              <div className={styles.kpiIconWrapper} style={{ color: '#2fd9f4', background: 'rgba(47, 217, 244, 0.1)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="6" height="6" rx="1" />
                  <rect x="16" y="3" width="6" height="6" rx="1" />
                  <rect x="16" y="15" width="6" height="6" rx="1" />
                  <path d="M8 10h4a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2" />
                  <path d="M12 10V5a2 2 0 0 1 2-2h2" />
                </svg>
              </div>
              <span className={styles.kpiChipMuted}>{loading ? '...' : `${metricas.totalEtapas} etapas ativas`}</span>
            </div>
            
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Processos Ativos</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>{loading ? '—' : processos.length}</span>
                <span className={styles.kpiBadgeCyan}>
                  {metricas.mediaEtapas} etapas/fluxo
                </span>
              </div>
            </div>

            <div className={styles.kpiFooter}>
              <Link to="/processos" className={styles.kpiFooterLink}>
                Ver todos os fluxos
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Card 2: Tarefas Pendentes */}
          <div className={styles.kpiCard}>
            <div className={styles.kpiCardTop}>
              <div className={styles.kpiIconWrapper} style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span className={styles.kpiChipMuted}>
                {loading ? '...' : `${metricas.total} registradas`}
              </span>
            </div>
            
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Tarefas em Execução</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>{loading ? '—' : metricas.pendentes}</span>
                <span className={styles.kpiBadgeSky}>
                  {metricas.pendentes - metricas.atrasadas} em dia
                </span>
              </div>
            </div>

            <div className={styles.kpiFooter}>
              <span className={styles.kpiFooterNote}>
                {metricas.vencendoHoje > 0 ? `${metricas.vencendoHoje} vencem hoje` : 'Nenhuma tarefa expira hoje'}
              </span>
            </div>
          </div>

          {/* Card 3: Gargalos e Atrasos (Crítico) */}
          <div 
            className={`${styles.kpiCard} ${metricas.atrasadas > 0 ? styles.kpiCardCritical : ''}`}
            onClick={() => setActiveTab('atrasadas')}
            style={{ cursor: 'pointer' }}
            title="Clique para filtrar apenas tarefas atrasadas"
          >
            <div className={styles.kpiCardTop}>
              <div 
                className={styles.kpiIconWrapper} 
                style={{ 
                  color: metricas.atrasadas > 0 ? '#ef4444' : '#10b981', 
                  background: metricas.atrasadas > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.1)' 
                }}
              >
                {metricas.atrasadas > 0 ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                )}
              </div>
              {metricas.atrasadas > 0 ? (
                <span className={styles.badgePulseRed}>
                  <span className={styles.pulseInnerRed}></span>
                  Atenção Necessária
                </span>
              ) : (
                <span className={styles.badgeEmerald}>100% no Prazo</span>
              )}
            </div>
            
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Gargalos & Atrasos</span>
              <div className={styles.kpiValueRow}>
                <span className={`${styles.kpiValue} ${metricas.atrasadas > 0 ? styles.valDanger : ''}`}>
                  {loading ? '—' : metricas.atrasadas}
                </span>
                <span className={metricas.atrasadas > 0 ? styles.kpiBadgeDanger : styles.kpiBadgeSuccess}>
                  {metricas.atrasadas > 0 ? 'tarefas vencidas' : 'operação regular'}
                </span>
              </div>
            </div>

            <div className={styles.kpiFooter}>
              <span className={styles.kpiFooterActionText}>
                {metricas.atrasadas > 0 ? 'Ver tarefas atrasadas →' : 'Tudo em conformidade'}
              </span>
            </div>
          </div>

          {/* Card 4: Taxa de Conclusão */}
          <div className={styles.kpiCard}>
            <div className={styles.kpiCardTop}>
              <div className={styles.kpiIconWrapper} style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <span className={styles.kpiChipSuccess}>{loading ? '...' : `${metricas.concluidas} finalizadas`}</span>
            </div>
            
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Taxa de Conclusão</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>{loading ? '—' : `${metricas.taxa}%`}</span>
                <span className={styles.kpiBadgeSuccess}>
                  eficiência global
                </span>
              </div>
            </div>

            <div className={styles.kpiFooter}>
              <div className={styles.miniProgressTrack}>
                <div 
                  className={styles.miniProgressFill} 
                  style={{ width: `${Math.min(100, Math.max(0, metricas.taxa))}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 3. Seção Interativa: Tarefas no Overview */}
        <section className={styles.sectionContainer}>
          <div className={styles.sectionHeaderRow}>
            <div className={styles.sectionTitleBlock}>
              <div className={styles.sectionTitleWithPill}>
                <h2 className={styles.sectionTitle}>Tarefas no Overview</h2>
                <span className={styles.sectionCounterPill}>{tarefasFiltradasOverview.length}</span>
              </div>
              <p className={styles.sectionSubtitle}>
                Acompanhamento em tempo real de itens que demandam ação ou resolução
              </p>
            </div>

            {/* Ações e Pesquisa Rápida */}
            <div className={styles.sectionControls}>
              <div className={styles.searchBox}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Pesquisar tarefas..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className={styles.searchInput}
                />
                {busca && (
                  <button onClick={() => setBusca('')} className={styles.searchClearBtn} title="Limpar busca">
                    ×
                  </button>
                )}
              </div>

              <Link to="/tabela" className={styles.linkVerTudo}>
                <span>Abrir Tabela Completa</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Filtros em Abas Segmentadas */}
          <div className={styles.tabsStrip}>
            <button
              onClick={() => setActiveTab('pendentes')}
              className={`${styles.tabBtn} ${activeTab === 'pendentes' ? styles.tabBtnActive : ''}`}
            >
              <span>Todas Pendentes</span>
              <span className={styles.tabBadge}>{metricas.pendentes}</span>
            </button>

            <button
              onClick={() => setActiveTab('atrasadas')}
              className={`${styles.tabBtn} ${styles.tabBtnDanger} ${activeTab === 'atrasadas' ? styles.tabBtnActiveDanger : ''}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Atrasadas</span>
              <span className={styles.tabBadgeDanger}>{metricas.atrasadas}</span>
            </button>

            <button
              onClick={() => setActiveTab('em_breve')}
              className={`${styles.tabBtn} ${styles.tabBtnWarning} ${activeTab === 'em_breve' ? styles.tabBtnActiveWarning : ''}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Vencendo em Breve</span>
              <span className={styles.tabBadgeWarning}>{metricas.vencendoEmBreve}</span>
            </button>

            <button
              onClick={() => setActiveTab('urgentes')}
              className={`${styles.tabBtn} ${styles.tabBtnSky} ${activeTab === 'urgentes' ? styles.tabBtnActiveSky : ''}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span>Urgentes</span>
              <span className={styles.tabBadgeSky}>{metricas.urgentes}</span>
            </button>
          </div>

          {/* Cards de Tarefas no Layout Stitch */}
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <span>Carregando tarefas operacionais...</span>
            </div>
          ) : tarefasFiltradasOverview.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrap}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3 className={styles.emptyTitle}>Nenhuma tarefa encontrada neste filtro</h3>
              <p className={styles.emptySubtitle}>
                {busca 
                  ? `Nenhum resultado corresponde à pesquisa "${busca}".` 
                  : activeTab === 'atrasadas'
                  ? 'Excelente notícia! Nenhuma tarefa está em atraso neste momento.'
                  : 'Todas as tarefas desta categoria foram concluídas ou não foram criadas.'}
              </p>
              {(busca || activeTab !== 'pendentes') && (
                <button
                  onClick={() => { setActiveTab('pendentes'); setBusca(''); }}
                  className={styles.emptyResetBtn}
                >
                  Restaurar Filtro Padrão
                </button>
              )}
            </div>
          ) : (
            <div className={styles.taskCardsGrid}>
              {tarefasExibidas.map((t) => {
                const prazoInfo = getPrazoInfo(t.prazo);
                const isUrgente = t.urgente === 1 || t.urgente === true;
                const corSetor = t.setor_cor || '#2fd9f4';

                return (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/tarefas/${t.id}`)}
                    className={styles.taskCard}
                  >
                    {/* Header do Card: Processo / Setor + Urgência/Prazo */}
                    <div className={styles.taskCardHeader}>
                      <div className={styles.taskSectorWrap}>
                        <span 
                          className={styles.sectorDotMini} 
                          style={{ backgroundColor: corSetor }} 
                        />
                        <span className={styles.taskProcessName} title={t.processo_nome || 'Geral'}>
                          {t.processo_nome || 'Geral'}
                        </span>
                      </div>

                      <div className={styles.taskPillsRow}>
                        {isUrgente && (
                          <span className={styles.urgentFlagPill} title="Tarefa prioritária">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                            </svg>
                            Urgente
                          </span>
                        )}

                        <span 
                          className={`${styles.deadlinePill} ${
                            prazoInfo.status === 'atrasada' 
                              ? styles.deadlineDanger 
                              : prazoInfo.status === 'hoje' 
                              ? styles.deadlineWarning 
                              : styles.deadlineNormal
                          }`}
                        >
                          {prazoInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Corpo do Card: Título + Descrição */}
                    <div className={styles.taskCardBody}>
                      <h3 className={styles.taskTitle} title={t.titulo}>
                        {t.titulo}
                      </h3>
                      {t.descricao ? (
                        <p className={styles.taskSnippet} title={t.descricao}>
                          {t.descricao}
                        </p>
                      ) : (
                        <p className={styles.taskSnippetEmpty}>Sem observações adicionais</p>
                      )}
                    </div>

                    {/* Etapa Atual do Fluxo */}
                    <div className={styles.taskStageRow}>
                      <span className={styles.stageIndicatorIcon}>➔</span>
                      <span className={styles.stageLabelText}>
                        Etapa: <strong>{t.etapa_nome || 'Em Andamento'}</strong>
                      </span>
                    </div>

                    {/* Footer do Card: Responsável + Link Ação */}
                    <div className={styles.taskCardFooter}>
                      <div className={styles.assigneeWrap} title={`Responsável: ${t.responsavel_nome || 'Não atribuído'}`}>
                        <span className={styles.assigneeAvatar}>
                          {t.responsavel_nome ? t.responsavel_nome.trim().charAt(0).toUpperCase() : 'U'}
                        </span>
                        <span className={styles.assigneeName}>
                          {t.responsavel_nome || 'Não atribuído'}
                        </span>
                      </div>

                      <span className={styles.cardActionHint}>
                        Detalhes
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Aviso e link quando houver mais de 6 tarefas pendentes */}
          {tarefasFiltradasOverview.length > 6 && (
            <div className={styles.sectionShowMoreRow}>
              <span className={styles.showMoreNotice}>
                Exibindo as <strong>6</strong> tarefas mais prioritárias de <strong>{tarefasFiltradasOverview.length}</strong> pendentes.
              </span>
              <Link to="/tabela" className={styles.linkShowMore}>
                <span>Ver todas na Tabela Completa ({tarefasFiltradasOverview.length})</span>
                <span className={styles.arrowIcon}>→</span>
              </Link>
            </div>
          )}

          {/* Banner de Auditoria e Conformidade */}
          <div className={`${styles.complianceBanner} ${metricas.atrasadas > 0 ? styles.complianceBannerWarning : ''}`}>
            <div className={styles.complianceIcon}>
              {metricas.atrasadas > 0 ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="9 12 12 15 16 10" />
                </svg>
              )}
            </div>
            <div className={styles.complianceContent}>
              <span className={styles.complianceTitle}>
                {metricas.atrasadas > 0 ? 'Atenção Operacional' : 'Operação em Total Conformidade'}
              </span>
              <span className={styles.complianceText}>
                {metricas.atrasadas > 0
                  ? `Identificamos ${metricas.atrasadas} tarefa(s) com prazo estourado que requerem intervenção prioritária dos gestores.`
                  : 'Nenhuma pendência crítica ou atraso detectado nas últimas 24 horas. SLAs mantidos com sucesso.'}
              </span>
            </div>
            {metricas.atrasadas > 0 && (
              <button 
                onClick={() => setActiveTab('atrasadas')}
                className={styles.complianceActionBtn}
              >
                Filtrar Atrasos
              </button>
            )}
          </div>
        </section>

        {/* 4. Seção: Processos e Fluxos Operacionais Configurados */}
        <section className={styles.sectionContainer}>
          <div className={styles.sectionHeaderRow}>
            <div className={styles.sectionTitleBlock}>
              <div className={styles.sectionTitleWithPill}>
                <h2 className={styles.sectionTitle}>Processos e Fluxos Operacionais</h2>
                <span className={styles.sectionCounterPill}>{processos.length}</span>
              </div>
              <p className={styles.sectionSubtitle}>
                Mapeamento e automação de rotinas contínuas entre setores e colaboradores
              </p>
            </div>

            <Link to="/processos" className={styles.linkVerTudo}>
              <span>Gerenciar Fluxos</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <span>Carregando fluxos de trabalho...</span>
            </div>
          ) : processosCards.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptySubtitle}>Nenhum processo mapeado para este setor até o momento.</p>
              <Link to="/processos" className={styles.emptyResetBtn}>
                Criar Primeiro Processo
              </Link>
            </div>
          ) : (
            <div className={styles.processList}>
              {processosExibidos.map((p) => (
                <div key={p.id} className={styles.processItemCard}>
                  {/* Lado Esquerdo: Ícone + Título + Metadados */}
                  <div className={styles.processLeft}>
                    <div 
                      className={styles.processSectorIcon}
                      style={{
                        backgroundColor: `${p.corSetor}16`,
                        color: p.corSetor,
                        borderColor: `${p.corSetor}33`,
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                      </svg>
                    </div>

                    <div className={styles.processInfo}>
                      <div className={styles.processHeaderTitle}>
                        <Link to={`/processos/${p.id}/fluxo`} className={styles.processLinkName}>
                          {p.nome}
                        </Link>
                        {p.setor_nome && (
                          <span 
                            className={styles.processSectorTag}
                            style={{
                              color: p.corSetor,
                              backgroundColor: `${p.corSetor}12`,
                              borderColor: `${p.corSetor}2b`
                            }}
                          >
                            {p.setor_nome}
                          </span>
                        )}
                      </div>

                      <div className={styles.processMetaDetails}>
                        <span>{p.etapas || 0} etapas</span>
                        <span className={styles.metaDot}>•</span>
                        <span>{p.totalTarefas} tarefa(s) total</span>
                        <span className={styles.metaDot}>•</span>
                        <span className={p.tarefasPendentes > 0 ? styles.textCyan : styles.textSuccess}>
                          {p.tarefasPendentes} em andamento
                        </span>
                        {p.tarefasAtrasadas > 0 && (
                          <>
                            <span className={styles.metaDot}>•</span>
                            <span className={styles.textDanger}>
                              ⚠️ {p.tarefasAtrasadas} atrasada(s)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lado Direito: Barra de Progresso + Botão Acessar */}
                  <div className={styles.processRight}>
                    <div className={styles.progressContainer}>
                      <div className={styles.progressHeader}>
                        <span className={styles.progressTitle}>Conclusão</span>
                        <span className={styles.progressPercent}>{p.progresso}%</span>
                      </div>
                      <div className={styles.progressTrack}>
                        <div 
                          className={styles.progressFill}
                          style={{ 
                            width: `${Math.min(100, Math.max(p.progresso > 0 ? 5 : 0, p.progresso))}%`,
                            background: p.progresso === 100 
                              ? 'linear-gradient(90deg, #10b981, #059669)' 
                              : 'linear-gradient(90deg, #2fd9f4, #14b8a6)'
                          }}
                        />
                      </div>
                    </div>

                    <Link 
                      to={`/processos/${p.id}/fluxo`}
                      className={styles.btnOpenFlow}
                      title="Visualizar etapas e tarefas deste fluxo"
                    >
                      <span>Abrir Fluxo</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Aviso e link quando houver mais de 3 processos */}
          {processosCards.length > 3 && (
            <div className={styles.sectionShowMoreRow}>
              <span className={styles.showMoreNotice}>
                Exibindo <strong>3</strong> de <strong>{processosCards.length}</strong> fluxos de trabalho configurados.
              </span>
              <Link to="/processos" className={styles.linkShowMore}>
                <span>Ver todos os processos ({processosCards.length})</span>
                <span className={styles.arrowIcon}>→</span>
              </Link>
            </div>
          )}

          {/* Footer CTA: Criar novo processo */}
          <div className={styles.sectionFooterCta}>
            <div className={styles.footerCtaInfo}>
              <span className={styles.footerCtaTitle}>Quer desenhar um novo procedimento operacional?</span>
              <span className={styles.footerCtaSub}>Crie formulários, defina etapas com responsáveis e automatize transições.</span>
            </div>
            <Link to="/processos" className={styles.btnCreateProcessQuick}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Cadastrar Novo Fluxo</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
