import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import styles from './Tarefa.module.css';

export default function Tarefa() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tarefa,        setTarefa]        = useState(null);
  const [historico,     setHistorico]     = useState([]);
  const [etapas,        setEtapas]        = useState([]);
  const [etapaSel,      setEtapaSel]      = useState('');
  const [campos,        setCampos]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [erro,          setErro]          = useState('');

  // Estados dos campos editáveis
  const [titulo,        setTitulo]        = useState('');
  const [descricao,     setDescricao]     = useState('');
  const [prazo,         setPrazo]         = useState('');
  const [urgente,       setUrgente]       = useState(false);
  const [responsavelId, setResponsavelId] = useState('');
  const [usuarios,      setUsuarios]      = useState([]);
  const [valoresCampos, setValoresCampos] = useState({});
  const [salvando,      setSalvando]      = useState(false);
  const [sucessoMsg,    setSucessoMsg]    = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        // Integração com APIs reais:
        // GET /api/tarefas/:id — detalhe da tarefa
        // GET /api/historico/tarefa/:id — histórico de movimentações
        // GET /api/usuarios — listagem de responsáveis disponíveis
        const [resTarefa, resHist, resUsuarios] = await Promise.all([
          api.get(`/tarefas/${id}`),
          api.get(`/historico/tarefa/${id}`),
          api.get('/usuarios').catch(() => ({ data: [] })),
        ]);

        const t = resTarefa.data;
        setTarefa(t);
        setTitulo(t.titulo || '');
        setDescricao(t.descricao || '');
        setPrazo(t.prazo ? t.prazo.split('T')[0] : '');
        setUrgente(t.urgente === 1 || t.urgente === true);
        setResponsavelId(t.responsavel_id ? String(t.responsavel_id) : '');
        setHistorico(resHist.data || []);
        setUsuarios(resUsuarios.data || []);
        setEtapaSel(String(t.etapa_id));

        let valores = {};
        if (t.campos_personalizados) {
          try {
            valores = typeof t.campos_personalizados === 'string'
              ? JSON.parse(t.campos_personalizados)
              : t.campos_personalizados;
          } catch {}
        }
        setValoresCampos(valores || {});

        // GET /api/tarefas/:id retorna processo_id corretamente para buscar as etapas do select de movimentação
        const processoId = t.processo_id;
        if (processoId) {
          const [resEtapas, resCampos] = await Promise.all([
            api.get(`/etapas/processo/${processoId}`),
            api.get(`/campos/processo/${processoId}`).catch(() => ({ data: [] })),
          ]);
          setEtapas(resEtapas.data || []);
          setCampos(resCampos.data || []);
        }
      } catch (err) {
        setErro('Erro ao carregar tarefa.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [id]);

  async function handleSalvar() {
    if (!titulo.trim()) {
      alert('O título da tarefa não pode ficar em branco.');
      return;
    }

    setSalvando(true);
    try {
      await api.put(`/tarefas/${id}`, {
        titulo: titulo.trim(),
        descricao: descricao || null,
        responsavel_id: responsavelId ? parseInt(responsavelId, 10) : null,
        prazo: prazo || null,
        urgente,
        campos_personalizados: valoresCampos,
      });

      setSucessoMsg('Alterações salvas com sucesso!');
      setTimeout(() => setSucessoMsg(''), 3000);

      const res = await api.get(`/tarefas/${id}`);
      setTarefa(res.data);
      setUrgente(res.data.urgente === 1 || res.data.urgente === true);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao salvar alterações');
    } finally {
      setSalvando(false);
    }
  }

  async function handleMover() {
    if (!etapaSel) return;
    if (Number(etapaSel) === Number(tarefa.etapa_id)) {
      alert('A tarefa já se encontra nesta etapa.');
      return;
    }

    const destinoEtapaId = parseInt(etapaSel, 10);
    const destinoEtapaObj = etapas.find(e => Number(e.id) === destinoEtapaId);

    // Valida campos obrigatórios da etapa de destino
    const exigidos = campos.filter(c =>
      c.obrigatorio &&
      Number(c.etapa_obrigatoria_id) === destinoEtapaId &&
      (valoresCampos[c.id] === undefined || valoresCampos[c.id] === null || String(valoresCampos[c.id]).trim() === '')
    );

    if (exigidos.length > 0) {
      alert(`Para mover para a etapa "${destinoEtapaObj?.nome || 'de destino'}", preencha o campo obrigatório: "${exigidos.map(c => c.nome).join(', ')}".`);
      return;
    }

    try {
      // Salva os campos atuais antes de mover
      await api.put(`/tarefas/${id}`, {
        titulo: titulo.trim(),
        descricao: descricao || null,
        responsavel_id: responsavelId ? parseInt(responsavelId, 10) : null,
        prazo: prazo || null,
        campos_personalizados: valoresCampos,
      });

      // PATCH /api/tarefas/:id/mover move de etapa e gera histórico no backend automaticamente
      await api.patch(`/tarefas/${id}/mover`, { etapa_id: destinoEtapaId });

      // Atualiza a tela e o histórico sem precisar recarregar a página
      const [resTarefa, resHist] = await Promise.all([
        api.get(`/tarefas/${id}`),
        api.get(`/historico/tarefa/${id}`),
      ]);
      setTarefa(resTarefa.data);
      setHistorico(resHist.data || []);
      setEtapaSel(String(resTarefa.data.etapa_id));
      setSucessoMsg('Tarefa movida com sucesso!');
      setTimeout(() => setSucessoMsg(''), 3000);
    } catch (err) {
      alert('Erro ao mover tarefa.');
    }
  }

  async function handleExcluir() {
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    try {
      await api.delete(`/tarefas/${id}`);
      navigate(-1);
    } catch (err) {
      alert('Erro ao excluir tarefa.');
    }
  }

  function formatarData(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('pt-BR');
  }

  if (loading) return <div className={styles.loading}>Carregando...</div>;
  if (erro)    return <div className={styles.loading}>{erro}</div>;

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <button className={styles.btnBack} onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Voltar
          </button>

          <div className={styles.headerRow}>
            <div className={styles.headerInfo}>
              <h1 className={styles.pageTitle}>{tarefa.titulo}</h1>
              <div className={styles.headerTags}>
                <span className={styles.tag}>{tarefa.processo_nome}</span>
                <span className={styles.tagId}>ID: #{tarefa.id}</span>
                {(tarefa.urgente === 1 || tarefa.urgente === true) && (
                  <span style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ⚑ Urgente
                  </span>
                )}
                {sucessoMsg && (
                  <span style={{ color: 'var(--turquesa-200)', fontSize: '13px', fontWeight: 600, marginLeft: '8px' }}>
                    ✓ {sucessoMsg}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className={styles.btnPrimary} onClick={handleSalvar} disabled={salvando}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </button>

              <button className={styles.btnDanger} onClick={handleExcluir}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                Excluir Tarefa
              </button>
            </div>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.colLeft}>
            {/* Card de Dados Editáveis da Tarefa */}
            <div className={styles.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className={styles.cardTitle}>Dados da Tarefa</span>
                <span style={{ fontSize: '12px', color: 'var(--gray-text-muted)' }}>Você pode editar e salvar os campos a qualquer momento</span>
              </div>

              <div className={styles.fields}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Título da Tarefa *</label>
                  <input
                    className={styles.fieldInput}
                    type="text"
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Prazo</label>
                  <input
                    className={styles.fieldInput}
                    type="date"
                    value={prazo}
                    onChange={e => setPrazo(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: 'var(--gray-text-main)', marginTop: '2px' }}>
                    <input
                      type="checkbox"
                      checked={urgente}
                      onChange={e => setUrgente(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#ef4444', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: 600, color: urgente ? '#f87171' : 'var(--text-main, #f8fafc)' }}>
                      ⚑ Marcar como Tarefa Urgente
                    </span>
                  </label>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Responsável</label>
                  <select
                    className={styles.select}
                    value={responsavelId}
                    onChange={e => setResponsavelId(e.target.value)}
                  >
                    <option value="">Não atribuído</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={String(u.id)}>{u.nome} ({u.email})</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Descrição</label>
                  <textarea
                    className={styles.fieldInput}
                    style={{ height: '70px', padding: '8px 12px', resize: 'vertical' }}
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                  />
                </div>

                {/* Campos Personalizados do Processo (Totalmente Editáveis) */}
                {campos.length > 0 && (
                  <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--turquesa-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Campos Personalizados do Processo
                      </span>
                    </div>

                    {campos.map(c => {
                      const val = valoresCampos[c.id] ?? '';
                      const etapaExigidaObj = c.etapa_obrigatoria_id
                        ? etapas.find(et => Number(et.id) === Number(c.etapa_obrigatoria_id))
                        : null;

                      if (c.tipo === 'textarea') {
                        return (
                          <div key={c.id} className={styles.field}>
                            <label className={styles.fieldLabel}>
                              {c.nome} {c.obrigatorio && !c.etapa_obrigatoria_id && <span style={{ color: '#ef4444' }}>*</span>}
                              {etapaExigidaObj && (
                                <span style={{ fontSize: '11px', color: '#fbbf24', marginLeft: '6px' }}>
                                  (Exigido na etapa: {etapaExigidaObj.nome})
                                </span>
                              )}
                            </label>
                            <textarea
                              className={styles.fieldInput}
                              style={{ height: '60px', padding: '8px 12px', resize: 'vertical' }}
                              value={val}
                              onChange={e => setValoresCampos(prev => ({ ...prev, [c.id]: e.target.value }))}
                            />
                          </div>
                        );
                      }

                      if (c.tipo === 'checkbox') {
                        return (
                          <div key={c.id} className={styles.field}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--gray-text-main)' }}>
                              <input
                                type="checkbox"
                                checked={Boolean(val)}
                                onChange={e => setValoresCampos(prev => ({ ...prev, [c.id]: e.target.checked }))}
                              />
                              <span>
                                {c.nome} {c.obrigatorio && !c.etapa_obrigatoria_id && <span style={{ color: '#ef4444' }}>*</span>}
                                {etapaExigidaObj && (
                                  <span style={{ fontSize: '11px', color: '#fbbf24', marginLeft: '6px' }}>
                                    (Exigido na etapa: {etapaExigidaObj.nome})
                                  </span>
                                )}
                              </span>
                            </label>
                          </div>
                        );
                      }

                      if (c.tipo === 'select') {
                        const listaOpcoes = (c.opcoes || '')
                          .split(',')
                          .map(o => o.trim())
                          .filter(Boolean);

                        return (
                          <div key={c.id} className={styles.field}>
                            <label className={styles.fieldLabel}>
                              {c.nome} {c.obrigatorio && !c.etapa_obrigatoria_id && <span style={{ color: '#ef4444' }}>*</span>}
                              {etapaExigidaObj && (
                                <span style={{ fontSize: '11px', color: '#fbbf24', marginLeft: '6px' }}>
                                  (Exigido na etapa: {etapaExigidaObj.nome})
                                </span>
                              )}
                            </label>
                            <select
                              className={styles.select}
                              value={val}
                              onChange={e => setValoresCampos(prev => ({ ...prev, [c.id]: e.target.value }))}
                            >
                              <option value="">Selecione...</option>
                              {listaOpcoes.map((op, idx) => (
                                <option key={idx} value={op}>{op}</option>
                              ))}
                            </select>
                          </div>
                        );
                      }

                      return (
                        <div key={c.id} className={styles.field}>
                          <label className={styles.fieldLabel}>
                            {c.nome} {c.obrigatorio && !c.etapa_obrigatoria_id && <span style={{ color: '#ef4444' }}>*</span>}
                            {etapaExigidaObj && (
                              <span style={{ fontSize: '11px', color: '#fbbf24', marginLeft: '6px' }}>
                                (Exigido na etapa: {etapaExigidaObj.nome})
                              </span>
                            )}
                          </label>
                          <input
                            className={styles.fieldInput}
                            type={c.tipo === 'numero' ? 'number' : c.tipo === 'data' ? 'date' : 'text'}
                            placeholder={c.tipo === 'moeda' ? 'Ex: R$ 1.500,00' : ''}
                            value={val}
                            onChange={e => setValoresCampos(prev => ({ ...prev, [c.id]: e.target.value }))}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Histórico */}
            <div className={styles.card}>
              <span className={styles.cardTitle}>Histórico de Movimentação</span>
              <div className={styles.historico}>
                {historico.length === 0 ? (
                  <p className={styles.semHistorico}>Nenhuma movimentação registrada.</p>
                ) : (
                  historico.map(h => (
                    <div key={h.id} className={styles.historicoItem}>
                      <div className={styles.historicoIcon}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div className={styles.historicoInfo}>
                        <span className={styles.historicoEtapa}>{h.descricao}</span>
                        <span className={styles.historicoData}>
                          {h.usuario_nome && `${h.usuario_nome} • `}{formatarData(h.criado_em)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className={styles.colRight}>
            <div className={styles.card}>
              <span className={styles.cardTitle}>Mover para Etapa</span>
              <div className={styles.moverWrap}>
                <select
                  className={styles.select}
                  value={etapaSel}
                  onChange={e => setEtapaSel(e.target.value)}
                >
                  {etapas.map(e => (
                    <option key={e.id} value={String(e.id)}>{e.nome}</option>
                  ))}
                </select>
                <button className={styles.btnMover} onClick={handleMover}>
                  Confirmar Movimentação
                </button>
                <span className={styles.etapaAtual}>Etapa atual: {tarefa.etapa_nome}</span>
              </div>
            </div>

            <div className={styles.card}>
              <span className={styles.cardTitle}>Informações</span>
              <div className={styles.infoList}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Processo</span>
                  <span className={styles.infoValor}>{tarefa.processo_nome}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Etapa atual</span>
                  <span className={styles.infoValor}>{tarefa.etapa_nome}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Criado em</span>
                  <span className={styles.infoValor}>{formatarData(tarefa.criado_em)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
