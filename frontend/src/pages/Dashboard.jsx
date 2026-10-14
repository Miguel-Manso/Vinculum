import { useState, useEffect } from 'react';
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

  function isConcluida(t) {
    if (t.concluida === 1 || t.concluida === true) return true;
    const nome = t.etapa_nome?.toLowerCase() || '';
    return nome.includes('finaliz') || nome.includes('concluíd') || nome.includes('concluid');
  }

  const tarefasPendentes = tarefas.filter(t => !isConcluida(t));
  const tarefasConcluidas = tarefas.filter(t => isConcluida(t));
  const totalEtapas = processos.reduce((acc, p) => acc + (parseInt(p.etapas) || 0), 0);
  const taxaConclusao = tarefas.length > 0 
    ? Math.round((tarefasConcluidas.length / tarefas.length) * 100) 
    : 100;

  // Tarefas com alerta de prazo
  const tarefasAlerta = tarefasPendentes.filter(t => {
    if (!t.prazo) return false;
    const prazoDate = new Date(t.prazo);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return prazoDate <= hoje;
  });

  // Preparação de dados para a Seção de Tarefas Pendentes no Overview (apenas tarefas reais)
  const tarefasOverview = tarefasPendentes.map((t, idx) => {
    let urgencia = { tipo: 'emDia', label: 'Em dia', icon: 'check' };
    let prazoLabel = 'Sem prazo';

    const isUrgente = t.urgente === 1 || t.urgente === true;
    if (isUrgente) {
      urgencia = { tipo: 'urgente', label: 'Urgente', icon: 'flag' };
    }

    if (t.prazo) {
      const prazoDate = new Date(t.prazo);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const diffDias = Math.ceil((prazoDate - hoje) / (1000 * 60 * 60 * 24));

      if (diffDias < 0) {
        if (!isUrgente) urgencia = { tipo: 'urgente', label: 'Atrasada', icon: 'flag' };
        prazoLabel = `Atrasada (${Math.abs(diffDias)}d)`;
      } else if (diffDias === 0) {
        if (!isUrgente) urgencia = { tipo: 'urgente', label: 'Vence hoje', icon: 'flag' };
        prazoLabel = 'Vence hoje';
      } else if (diffDias === 1) {
        if (!isUrgente) urgencia = { tipo: 'warning', label: 'Amanhã', icon: 'clock' };
        prazoLabel = 'Amanhã';
      } else if (diffDias <= 3) {
        if (!isUrgente) urgencia = { tipo: 'warning', label: `${diffDias}d`, icon: 'clock' };
        prazoLabel = `Em ${diffDias} dias`;
      } else {
        prazoLabel = `Em ${diffDias} dias`;
      }
    }

    const categoria = t.processo_nome || 'Geral';
    const categoriaTipo = idx % 3 === 0 ? 'amber' : idx % 3 === 1 ? 'blue' : 'neutral';
    const responsavel = t.responsavel_nome || 'Não atribuído';

    return {
      id: t.id,
      titulo: t.titulo,
      descricao: t.descricao || `Etapa: ${t.etapa_nome || 'Em andamento'}`,
      categoria,
      categoriaTipo,
      urgencia,
      responsavel,
      prazoLabel,
    };
  });

  // Preparação de dados para a Seção de Processos Configurados (apenas processos reais)
  const processosLista = processos.map((p, idx) => {
    const iconColors = ['cyan', 'blue', 'amber'];
    const icons = ['workflow', 'shield', 'idcard'];

    const tarefasProc = tarefas.filter(t => t.processo_id === p.id);
    const concluidas = tarefasProc.filter(t => isConcluida(t));
    const pct = tarefasProc.length > 0 
      ? Math.round((concluidas.length / tarefasProc.length) * 100) 
      : 0;

    const respsUnicos = new Set(tarefasProc.map(t => t.responsavel_id).filter(Boolean));
    const totalResp = respsUnicos.size > 0 ? respsUnicos.size : 1;

    let atualizado = 'hoje';
    if (p.criado_em) {
      const d = new Date(p.criado_em);
      atualizado = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }

    return {
      id: p.id,
      nome: p.nome,
      etapas: p.etapas || 0,
      responsaveis: totalResp,
      atualizado,
      progresso: pct,
      iconType: icons[idx % icons.length],
      colorTheme: iconColors[idx % iconColors.length],
    };
  });

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        {/* Ambient Glow sutil no fundo */}
        <div className={styles.ambientGlowWrap} aria-hidden="true">
          <div className={styles.ambientGlowLeft}></div>
          <div className={styles.ambientGlowRight}></div>
        </div>

        {/* Top Header / Workspace Banner */}
        <section className={styles.topHeader}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.greetingRow}>
              <h1 className={styles.pageTitle}>
                Olá, {usuario?.nome ? usuario.nome.split(' ')[0] : 'Administrador'}
              </h1>
              <span className={styles.waveEmoji} role="img" aria-label="Aceno">👋</span>
              <span
                className={styles.sectorChipHeader}
                style={{
                  backgroundColor: `${setorAtivo?.cor || '#2fd9f4'}18`,
                  color: setorAtivo?.cor || '#2fd9f4',
                  border: `1px solid ${setorAtivo?.cor || '#2fd9f4'}44`,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: setorAtivo?.cor || '#2fd9f4',
                    display: 'inline-block',
                    marginRight: 6
                  }}
                />
                {setorAtivo ? `Setor: ${setorAtivo.nome}` : 'Todos os Setores'}
              </span>
            </div>
            <p className={styles.pageSubtitle}>
              {setorAtivo
                ? `Visualizando indicadores, tarefas e processos exclusivos do setor "${setorAtivo.nome}".`
                : 'Visão consolidada do fluxo operacional e monitoramento de todos os seus setores.'}
            </p>
          </div>

          <div className={styles.headerToolbar}>
            <Link to="/tabela" className={styles.btnToolbarSecondary}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Exportar Tabela</span>
            </Link>

            <Link to="/processos" className={styles.btnToolbarPrimary}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Novo Processo</span>
            </Link>
          </div>
        </section>

        {/* 4 KPI Summary Cards no padrão Stitch */}
        <section className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiCardHeader}>
              <span className={styles.kpiLabel}>Processos Ativos</span>
              <span className={styles.kpiChipMuted}>{loading ? '...' : `${processos.length} total`}</span>
            </div>
            <div className={styles.kpiValueRow}>
              <span className={styles.kpiValue}>{loading ? '—' : processos.length}</span>
              <span className={styles.kpiChipPrimary}>fluxos em execução</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiCardHeader}>
              <span className={styles.kpiLabel}>Tarefas em Andamento</span>
              <span className={styles.dotWarningPulse}></span>
            </div>
            <div className={styles.kpiValueRow}>
              <span className={styles.kpiValue}>{loading ? '—' : tarefasPendentes.length}</span>
              {tarefasAlerta.length > 0 ? (
                <span className={styles.kpiChipWarning}>{tarefasAlerta.length} com alerta</span>
              ) : (
                <span className={styles.kpiChipSuccess}>fluxo regular</span>
              )}
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiCardHeader}>
              <span className={styles.kpiLabel}>Taxa de Conclusão</span>
              <span className={styles.kpiChipSuccess}>{loading ? '...' : `${taxaConclusao}%`}</span>
            </div>
            <div className={styles.kpiValueRow}>
              <span className={styles.kpiValue}>{loading ? '—' : `${taxaConclusao}%`}</span>
              <span className={styles.kpiChipMuted}>{tarefasConcluidas.length} finalizadas</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiCardHeader}>
              <span className={styles.kpiLabel}>Etapas Configuradas</span>
              <span className={styles.kpiChipMuted}>{loading ? '...' : `${totalEtapas} etapas`}</span>
            </div>
            <div className={styles.kpiValueRow}>
              <span className={styles.kpiValue}>{loading ? '—' : totalEtapas}</span>
              <span className={styles.kpiChipPrimary}>
                {processos.length > 0 ? `${(totalEtapas / processos.length).toFixed(1)} méd/fluxo` : '—'}
              </span>
            </div>
          </div>
        </section>

        {/* SEÇÃO 1: Tarefas Pendentes no Overview (Stitch Grid Layout) */}
        <section className={styles.sectionContainer}>
          <div className={styles.sectionHeaderRow}>
            <div className={styles.sectionHeaderTitles}>
              <h2 className={styles.sectionTitle}>Tarefas Pendentes no Overview</h2>
              <p className={styles.sectionSubtitle}>
                Tarefas em andamento que exigem atenção (etapa Finalizado é desconsiderada como pendente)
              </p>
            </div>
            <Link to="/tabela" className={styles.sectionHeaderAction}>
              <span>Ver Todas na Tabela</span>
              <span className={styles.arrowIcon}>→</span>
            </Link>
          </div>

          {/* Grid de Cards de Tarefas Pendentes */}
          {loading ? (
            <div className={styles.emptyStateContainer}>Carregando tarefas em andamento...</div>
          ) : tarefasOverview.length === 0 ? (
            <div className={styles.emptyStateContainer}>
              <span>Nenhuma tarefa pendente no momento. Todas as rotinas operacionais estão em conformidade!</span>
            </div>
          ) : (
            <div className={styles.taskCardsGrid}>
              {tarefasOverview.map(card => (
                <Link key={card.id} to={`/tarefas/${card.id}`} className={styles.cardLinkWrap}>
                  <div className={styles.taskOverviewCard}>
                    <div className={styles.taskCardTopRow}>
                      <span className={`${styles.categoryBadge} ${styles['cat_' + card.categoriaTipo]}`}>
                        {card.categoria}
                      </span>
                      <span className={`${styles.urgencyChip} ${styles['urg_' + card.urgencia.tipo]}`}>
                        {card.urgencia.icon === 'flag' && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                            <line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        )}
                        {card.urgencia.icon === 'clock' && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        )}
                        {card.urgencia.icon === 'check' && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="9 12 12 15 16 10" />
                          </svg>
                        )}
                        <span>{card.urgencia.label}</span>
                      </span>
                    </div>

                    <div className={styles.taskCardBody}>
                      <h3 className={styles.taskCardTitle} title={card.titulo}>
                        {card.titulo}
                      </h3>
                      <p className={styles.taskCardSnippet} title={card.descricao}>
                        {card.descricao}
                      </p>
                    </div>

                    <div className={styles.taskCardFooter}>
                      <div className={styles.userRow}>
                        <span className={styles.avatarMini}>
                          {card.responsavel ? card.responsavel.trim().charAt(0).toUpperCase() : 'U'}
                        </span>
                        <span className={styles.userNome}>{card.responsavel}</span>
                      </div>
                      <span className={styles.deadlineLabel}>{card.prazoLabel}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Banner de Conformidade */}
          <div className={styles.complianceBanner}>
            <div className={styles.complianceIconWrap}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <span className={styles.complianceText}>
              {tarefasAlerta.length === 0 ? (
                'Operação em conformidade. Nenhuma tarefa atrasada registrada nas últimas 24 horas.'
              ) : (
                `Atenção operacional: ${tarefasAlerta.length} tarefa(s) pendente(s) com prazo crítico ou em atraso.`
              )}
            </span>
          </div>
        </section>

        {/* SEÇÃO 2: Processos Configurados */}
        <section className={styles.sectionContainer}>
          <div className={styles.sectionHeaderRow}>
            <div className={styles.sectionHeaderTitles}>
              <h2 className={styles.sectionTitle}>Processos Configurados</h2>
              <p className={styles.sectionSubtitle}>
                Fluxos operacionais em execução contínua com gatilhos automáticos
              </p>
            </div>
            <Link to="/processos" className={styles.sectionHeaderAction}>
              <span>Ver Todos</span>
              <span className={styles.arrowIcon}>→</span>
            </Link>
          </div>

          {/* Lista de Processos Configurados */}
          {loading ? (
            <div className={styles.emptyStateContainer}>Carregando processos...</div>
          ) : processosLista.length === 0 ? (
            <div className={styles.emptyStateContainer}>
              <span>Nenhum processo configurado no momento. Crie seu primeiro fluxo de trabalho no botão abaixo.</span>
            </div>
          ) : (
            <div className={styles.processRowsList}>
              {processosLista.map(p => (
                <div key={p.id} className={styles.processRowItem}>
                  <div className={styles.processRowLeft}>
                    {/* Ícone Setorial */}
                    <div className={`${styles.sectorIconBox} ${styles['sector_' + p.colorTheme]}`}>
                      {p.iconType === 'workflow' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="7" width="6" height="6" rx="1" />
                          <rect x="16" y="3" width="6" height="6" rx="1" />
                          <rect x="16" y="15" width="6" height="6" rx="1" />
                          <path d="M8 10h4a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2" />
                          <path d="M12 10V5a2 2 0 0 1 2-2h2" />
                        </svg>
                      )}
                      {p.iconType === 'shield' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      )}
                      {p.iconType === 'idcard' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="16" rx="2" />
                          <line x1="7" y1="8" x2="11" y2="8" />
                          <line x1="7" y1="12" x2="17" y2="12" />
                          <line x1="7" y1="16" x2="13" y2="16" />
                        </svg>
                      )}
                    </div>

                    <div className={styles.processMetaWrap}>
                      <div className={styles.processTitleRow}>
                        <Link
                          to={`/processos/${p.id}/fluxo`}
                          className={styles.processTitleLink}
                        >
                          {p.nome}
                        </Link>
                        <span className={styles.cyanDot}>•</span>
                      </div>
                      <div className={styles.processMetaSub}>
                        <span>{p.etapas} etapas</span>
                        <span className={styles.metaDotSep}>•</span>
                        <span>{p.responsaveis} responsável{p.responsaveis !== 1 ? 'is' : ''}</span>
                        <span className={styles.metaDotSep}>•</span>
                        <span>Atualizado {p.atualizado}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.processRowRight}>
                    <div className={styles.globalProgressWrap}>
                      <span className={styles.progressLabel}>Progresso Global</span>
                      <div className={styles.progressBarRow}>
                        <div className={styles.progressBarTrack}>
                          <div
                            className={styles.progressBarFillCyan}
                            style={{ width: `${Math.min(100, Math.max(p.progresso === 0 ? 0 : 8, p.progresso))}%` }}
                          ></div>
                        </div>
                        <span className={styles.progressPercentText}>{p.progresso}%</span>
                      </div>
                    </div>

                    <Link
                      to={`/processos/${p.id}/fluxo`}
                      className={styles.btnRowMore}
                      title="Acessar quadro do processo"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rodapé CTA para Mapear Novo Processo */}
          <div className={styles.bottomCtaRow}>
            <span className={styles.bottomCtaText}>Precisa mapear um novo fluxo de trabalho?</span>
            <Link to="/processos" className={styles.bottomCtaLink}>
              <span>Clique aqui para criar um novo processo</span>
              <span className={styles.chevronIcon}>›</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
