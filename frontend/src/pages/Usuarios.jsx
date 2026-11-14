import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import SidebarTrigger from '../components/SidebarTrigger';
import { useAuth } from '../context/AuthContext';
import { useSetor } from '../context/SetorContext';
import api from '../services/api';
import styles from './Usuarios.module.css';
import { toast, confirmDialog } from '../components/feedback/feedback';
import {
  FilterToggle, FilterPanel, FilterField, FilterSelect, FilterSegment, FilterDateRange, ActiveFilters,
} from '../components/FilterPanel';

const FILTROS_EQUIPE_INICIAIS = { setor: '', cadastroDe: '', cadastroAte: '', ordenar: 'nome' };
const OPCOES_PERFIL = [
  { value: 'todos', label: 'Todos' },
  { value: 'admin', label: 'Admins' },
  { value: 'usuario', label: 'Membros' },
];
const OPCOES_ORDENAR_EQUIPE = [
  { value: 'nome', label: 'Nome (A–Z)' },
  { value: 'recentes', label: 'Cadastro mais recente' },
  { value: 'antigos', label: 'Cadastro mais antigo' },
  { value: 'setores', label: 'Mais setores de acesso' },
];

function diaEmMs(valor) {
  if (!valor) return null;
  const d = new Date(`${String(valor).split('T')[0]}T00:00:00`);
  return isNaN(d.getTime()) ? null : d.getTime();
}

export default function Usuarios() {
  const { usuario } = useAuth();
  const { setoresDisponiveis, recarregarSetores } = useSetor();
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroPerfil, setFiltroPerfil] = useState('todos'); // 'todos' | 'admin' | 'usuario'

  // Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  // Form State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState('usuario');
  const [setoresSelecionados, setSetoresSelecionados] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const isAdmin = usuario?.perfil === 'admin' || usuario?.email === 'admin@vinculum.com';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }

    carregarUsuarios();
  }, [isAdmin]);

  async function carregarUsuarios() {
    try {
      const res = await api.get('/usuarios');
      setUsuarios(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  }

  // Estatísticas do cabeçalho
  const adminsCount = useMemo(() => {
    return usuarios.filter(u => u.perfil === 'admin').length;
  }, [usuarios]);

  const membrosCount = useMemo(() => {
    return usuarios.length - adminsCount;
  }, [usuarios, adminsCount]);

  // Painel de filtros avançados
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [filtros, setFiltros] = useState(FILTROS_EQUIPE_INICIAIS);
  const setFiltro = (chave, valor) => setFiltros(f => ({ ...f, [chave]: valor }));

  // Filtro de busca, perfil, setor e período; depois ordenação
  const usuariosFiltrados = useMemo(() => {
    const de = diaEmMs(filtros.cadastroDe);
    const ate = diaEmMs(filtros.cadastroAte);

    const lista = usuarios.filter(u => {
      if (filtroPerfil !== 'todos' && u.perfil !== filtroPerfil) return false;

      const setoresU = u.setores || [];
      if (filtros.setor === 'nenhum' && setoresU.length > 0) return false;
      if (filtros.setor && filtros.setor !== 'nenhum' && !setoresU.some(s => String(s.id) === filtros.setor)) return false;

      if (de !== null || ate !== null) {
        const cad = diaEmMs(u.criado_em);
        if (cad === null) return false;
        if (de !== null && cad < de) return false;
        if (ate !== null && cad > ate) return false;
      }

      if (busca.trim()) {
        const q = busca.toLowerCase().trim();
        const matchNome = (u.nome || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        if (!matchNome && !matchEmail) return false;
      }

      return true;
    });

    const data = u => new Date(u.criado_em || 0).getTime() || 0;
    const porNome = (a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
    switch (filtros.ordenar) {
      case 'recentes': return lista.sort((a, b) => data(b) - data(a));
      case 'antigos':  return lista.sort((a, b) => data(a) - data(b));
      case 'setores':  return lista.sort((a, b) => (b.setores || []).length - (a.setores || []).length || porNome(a, b));
      default:         return lista.sort(porNome);
    }
  }, [usuarios, filtroPerfil, busca, filtros]);

  function limparFiltrosEquipe() {
    setBusca('');
    setFiltroPerfil('todos');
    setFiltros(FILTROS_EQUIPE_INICIAIS);
  }

  const chipsEquipe = [];
  if (busca.trim()) chipsEquipe.push({ id: 'busca', label: `Busca: "${busca.trim()}"`, onRemove: () => setBusca('') });
  if (filtroPerfil !== 'todos') chipsEquipe.push({ id: 'perfil', label: filtroPerfil === 'admin' ? 'Administradores' : 'Colaboradores', onRemove: () => setFiltroPerfil('todos') });
  if (filtros.setor) {
    const s = setoresDisponiveis.find(x => String(x.id) === filtros.setor);
    chipsEquipe.push({ id: 'setor', label: filtros.setor === 'nenhum' ? 'Sem setor' : `Setor: ${s?.nome || '—'}`, onRemove: () => setFiltro('setor', '') });
  }
  if (filtros.cadastroDe || filtros.cadastroAte) {
    const fmt = v => (v ? new Date(`${v}T00:00:00`).toLocaleDateString('pt-BR') : '…');
    chipsEquipe.push({
      id: 'cadastro',
      label: `Cadastro: ${fmt(filtros.cadastroDe)} a ${fmt(filtros.cadastroAte)}`,
      onRemove: () => setFiltros(f => ({ ...f, cadastroDe: '', cadastroAte: '' })),
    });
  }

  function abrirModalCriar() {
    setUsuarioEditando(null);
    setNome('');
    setEmail('');
    setSenha('');
    setPerfil('usuario');
    setSetoresSelecionados(setoresDisponiveis.map(s => s.id));
    setErro('');
    setSucesso('');
    setModalAberto(true);
  }

  function abrirModalEditar(u) {
    setUsuarioEditando(u);
    setNome(u.nome || '');
    setEmail(u.email || '');
    setSenha('');
    setPerfil(u.perfil || 'usuario');
    setSetoresSelecionados((u.setores || []).map(s => s.id));
    setErro('');
    setSucesso('');
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setUsuarioEditando(null);
    setSetoresSelecionados([]);
    setErro('');
    setSucesso('');
  }

  async function handleSalvarUsuario(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);

    try {
      if (usuarioEditando) {
        await api.put(`/usuarios/${usuarioEditando.id}`, {
          nome: nome.trim(),
          email: email.trim(),
          senha: senha.trim() ? senha : undefined,
          perfil,
          setores_ids: setoresSelecionados,
        });
        setSucesso('Usuário atualizado com sucesso!');
      } else {
        await api.post('/usuarios', {
          nome: nome.trim(),
          email: email.trim(),
          senha: senha.trim(),
          perfil,
          setores_ids: setoresSelecionados,
        });
        setSucesso('Usuário cadastrado com sucesso!');
      }

      await Promise.all([carregarUsuarios(), recarregarSetores()]);
      setTimeout(() => {
        fecharModal();
      }, 500);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao salvar usuário.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluirUsuario(u) {
    if (u.id === usuario?.id) {
      toast.warning('Você não pode excluir sua própria conta.');
      return;
    }

    if (u.email === 'admin@vinculum.com') {
      toast.warning('O administrador principal do sistema não pode ser removido.');
      return;
    }

    if (!await confirmDialog({ title: `Remover o acesso de "${u.nome}"?`, message: 'A pessoa não conseguirá mais entrar no Vinculum.', confirmLabel: 'Remover acesso', tone: 'danger' })) {
      return;
    }

    try {
      await api.delete(`/usuarios/${u.id}`);
      await Promise.all([carregarUsuarios(), recarregarSetores()]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao excluir usuário.');
    }
  }

  function formatarData(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('pt-BR');
  }

  if (!isAdmin) return null;

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        {/* Cabeçalho Minimalista com Ribbon */}
        <header className={`${styles.minimalHeader} page-hero`}>
          <div className={styles.headerLeft}>
            <SidebarTrigger />
            <h1 className={styles.pageTitle}>Equipe e Acessos.</h1>
            <div className={styles.headerMetricsRibbon}>
              <span className={styles.ribbonItem}>
                <strong>{usuarios.length}</strong> {usuarios.length === 1 ? 'membro' : 'membros'}
              </span>
              <span className={styles.ribbonDot}>•</span>
              <span className={styles.ribbonItem}>
                <span className={styles.dotCyan}></span>
                <strong>{adminsCount}</strong> administradores
              </span>
              <span className={styles.ribbonDot}>•</span>
              <span className={styles.ribbonItem}>
                <strong>{membrosCount}</strong> colaboradores
              </span>
            </div>
          </div>

          <div className={styles.headerRight}>
            <button className={styles.btnPrimary} onClick={abrirModalCriar}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Novo Colaborador</span>
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
              placeholder="Pesquisar por nome ou email..."
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
            count={chipsEquipe.filter(c => c.id !== 'busca').length}
          />
          </div>

          {/* Abas Rápidas de Perfil */}
          <div className={styles.filterPills}>
            <button
              type="button"
              className={`${styles.pillBtn} ${filtroPerfil === 'todos' ? styles.pillBtnActive : ''}`}
              onClick={() => setFiltroPerfil('todos')}
            >
              <span>Todos ({usuarios.length})</span>
            </button>
            <button
              type="button"
              className={`${styles.pillBtn} ${filtroPerfil === 'admin' ? styles.pillBtnActive : ''}`}
              onClick={() => setFiltroPerfil(filtroPerfil === 'admin' ? 'todos' : 'admin')}
            >
              <span>Administradores ({adminsCount})</span>
            </button>
            <button
              type="button"
              className={`${styles.pillBtn} ${filtroPerfil === 'usuario' ? styles.pillBtnActive : ''}`}
              onClick={() => setFiltroPerfil(filtroPerfil === 'usuario' ? 'todos' : 'usuario')}
            >
              <span>Colaboradores ({membrosCount})</span>
            </button>
          </div>
        </div>

        <FilterPanel
          open={filtrosAbertos}
          onClose={() => setFiltrosAbertos(false)}
          subtitle="Encontre colaboradores por perfil, setor de acesso e data de cadastro."
          activeCount={chipsEquipe.length}
          resultCount={usuariosFiltrados.length}
          totalCount={usuarios.length}
          resultNoun={['colaborador', 'colaboradores']}
          onClear={limparFiltrosEquipe}
        >
          <FilterField label="Perfil">
            <FilterSegment value={filtroPerfil} onChange={setFiltroPerfil} options={OPCOES_PERFIL} ariaLabel="Perfil" />
          </FilterField>
          <FilterField label="Setor de acesso">
            <FilterSelect
              value={filtros.setor}
              onChange={v => setFiltro('setor', v)}
              placeholder="Todos os setores"
              options={[
                { value: 'nenhum', label: 'Sem setor vinculado' },
                ...setoresDisponiveis.map(s => ({ value: String(s.id), label: s.nome })),
              ]}
              ariaLabel="Filtrar por setor"
            />
          </FilterField>
          <FilterField label="Cadastrados entre" wide>
            <FilterDateRange
              from={filtros.cadastroDe}
              to={filtros.cadastroAte}
              onChange={(de, ate) => setFiltros(f => ({ ...f, cadastroDe: de, cadastroAte: ate }))}
            />
          </FilterField>
          <FilterField label="Ordenar por">
            <FilterSelect
              value={filtros.ordenar}
              onChange={v => setFiltro('ordenar', v)}
              placeholder={null}
              options={OPCOES_ORDENAR_EQUIPE}
              ariaLabel="Ordenar colaboradores"
            />
          </FilterField>
        </FilterPanel>

        <ActiveFilters chips={chipsEquipe} onClearAll={limparFiltrosEquipe} />

        {/* Tabela Minimalista (Padrão Tabela Geral) */}
        <section className={styles.tableCard}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <span>Carregando equipe...</span>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhum colaborador encontrado para os filtros selecionados.</p>
            </div>
          ) : (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Colaborador</th>
                    <th>Email</th>
                    <th>Perfil</th>
                    <th>Setores de Acesso</th>
                    <th>Cadastro</th>
                    <th style={{ textAlign: 'right', width: '80px' }}>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {usuariosFiltrados.map((u) => {
                    const isCurrent = u.id === usuario?.id;
                    const isRootAdmin = u.email === 'admin@vinculum.com';
                    const inicial = u.nome ? u.nome.trim().charAt(0).toUpperCase() : 'U';

                    return (
                      <tr key={u.id} className={styles.tr}>
                        {/* Colaborador com Avatar */}
                        <td>
                          <div className={styles.userCell}>
                            <span className={styles.avatarMini}>{inicial}</span>
                            <span className={styles.userName}>{u.nome}</span>
                            {isCurrent && <span className={styles.badgeCurrent}>Você</span>}
                          </div>
                        </td>

                        {/* Email */}
                        <td>
                          <span className={styles.emailText}>{u.email}</span>
                        </td>

                        {/* Perfil */}
                        <td>
                          <span className={u.perfil === 'admin' ? styles.badgeAdmin : styles.badgeUsuario}>
                            {u.perfil === 'admin' ? 'Administrador' : 'Colaborador'}
                          </span>
                        </td>

                        {/* Setores de Acesso */}
                        <td>
                          <div className={styles.setoresList}>
                            {u.perfil === 'admin' ? (
                              <span className={styles.setorTagAdmin}>
                                <span className={styles.dotCyan}></span>
                                Acesso Geral (Admin)
                              </span>
                            ) : (u.setores || []).length > 0 ? (
                              u.setores.map(s => (
                                <span key={s.id} className={styles.setorTag}>
                                  <span
                                    className={styles.setorDot}
                                    style={{ backgroundColor: s.cor || '#45c4d6' }}
                                  />
                                  {s.nome}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '11.5px', color: 'var(--text-subtle, #64748b)' }}>
                                Nenhum setor atribuído
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Data */}
                        <td>
                          <span className={styles.dataText}>{formatarData(u.criado_em)}</span>
                        </td>

                        {/* Ações */}
                        <td className={styles.tdAcoes}>
                          <div className={styles.actionsWrap}>
                            <button
                              className={styles.btnActionEdit}
                              onClick={() => abrirModalEditar(u)}
                              title="Editar colaborador"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>

                            <button
                              className={`${styles.btnActionDelete} ${
                                isCurrent || isRootAdmin ? styles.btnActionDisabled : ''
                              }`}
                              onClick={() => handleExcluirUsuario(u)}
                              disabled={isCurrent || isRootAdmin}
                              title={
                                isCurrent
                                  ? 'Você não pode excluir sua própria conta'
                                  : isRootAdmin
                                  ? 'Administrador principal não pode ser excluído'
                                  : 'Excluir colaborador'
                              }
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6M14 11v6" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <footer className={styles.tableFooter}>
            <span>Exibindo {usuariosFiltrados.length} de {usuarios.length} membros</span>
          </footer>
        </section>

        {/* Modal de Criação / Edição de Usuário */}
        <Modal open={Boolean(modalAberto)} onClose={fecharModal} maxWidth={500}>
          {modalAberto && (
            <>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {usuarioEditando ? 'Editar Colaborador' : 'Novo Colaborador'}
                </h2>
              </div>

              <form onSubmit={handleSalvarUsuario}>
                <div className={styles.modalBody}>
                  {erro && <div className={styles.erroMsg}>{erro}</div>}
                  {sucesso && <div className={styles.sucessoMsg}>{sucesso}</div>}

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Nome Completo *</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      placeholder="Ex: Ana Souza"
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Email *</label>
                    <input
                      className={styles.formInput}
                      type="email"
                      placeholder="ana@empresa.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      {usuarioEditando ? 'Nova Senha (opcional)' : 'Senha Inicial *'}
                    </label>
                    <input
                      className={styles.formInput}
                      type="password"
                      placeholder={usuarioEditando ? 'Deixe em branco para manter a atual' : '••••••••'}
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      required={!usuarioEditando}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Nível de Acesso *</label>
                    <select
                      className={styles.formSelect}
                      value={perfil}
                      onChange={e => setPerfil(e.target.value)}
                      disabled={usuarioEditando?.email === 'admin@vinculum.com'}
                    >
                      <option value="usuario">Colaborador (Acesso restrito aos setores vinculados)</option>
                      <option value="admin">Administrador (Acesso total a todos os setores)</option>
                    </select>
                  </div>

                  {/* Multi-seleção de Setores de Acesso */}
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      Setores Permitidos {perfil === 'admin' ? '(Administradores têm acesso irrestrito)' : '*'}
                    </label>
                    <div className={styles.sectorsGrid}>
                      {setoresDisponiveis.map(s => {
                        const checked = setoresSelecionados.includes(s.id);
                        return (
                          <label
                            key={s.id}
                            className={`${styles.sectorCheckItem} ${checked ? styles.sectorCheckItemActive : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={perfil === 'admin'}
                              onChange={() => {
                                setSetoresSelecionados(prev =>
                                  prev.includes(s.id)
                                    ? prev.filter(id => id !== s.id)
                                    : [...prev, s.id]
                                );
                              }}
                              style={{ accentColor: s.cor || '#45c4d6', cursor: 'pointer' }}
                            />
                            <span
                              className={styles.setorDot}
                              style={{ backgroundColor: s.cor || '#45c4d6' }}
                            />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {s.nome}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button type="button" className={styles.btnCancel} onClick={fecharModal}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.btnSave} disabled={salvando}>
                    {salvando ? 'Salvando...' : usuarioEditando ? 'Salvar Alterações' : 'Cadastrar'}
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
