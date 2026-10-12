import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import styles from './Usuarios.module.css';

export default function Usuarios() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  // Form
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState('usuario');
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

  function abrirModalCriar() {
    setUsuarioEditando(null);
    setNome('');
    setEmail('');
    setSenha('');
    setPerfil('usuario');
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
    setErro('');
    setSucesso('');
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setUsuarioEditando(null);
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
          nome,
          email,
          senha: senha.trim() ? senha : undefined,
          perfil
        });
        setSucesso('Usuário atualizado com sucesso!');
      } else {
        await api.post('/usuarios', { nome, email, senha, perfil });
        setSucesso('Usuário criado com sucesso!');
      }
      await carregarUsuarios();
      setTimeout(() => {
        fecharModal();
      }, 900);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao salvar usuário');
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluirUsuario(u) {
    if (u.id === usuario?.id) {
      alert('Você não pode excluir sua própria conta conectada.');
      return;
    }
    if (u.email === 'admin@vinculum.com') {
      alert('O administrador principal do sistema não pode ser excluído.');
      return;
    }
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${u.nome}" (${u.email})?\n\nTarefas e histórico associados a ele continuarão existindo sem responsável.`)) {
      return;
    }

    try {
      await api.delete(`/usuarios/${u.id}`);
      await carregarUsuarios();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao excluir usuário');
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
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderText}>
            <h1 className={styles.pageTitle}>Gerenciar Usuários</h1>
            <p className={styles.pageSubtitle}>Área administrativa para cadastro, edição e exclusão de acessos da equipe</p>
          </div>

          <button className={styles.btnPrimary} onClick={abrirModalCriar}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo Usuário
          </button>
        </div>

        <div className={styles.tableWrap}>
          {loading ? (
            <div className={styles.empty}>Carregando usuários...</div>
          ) : usuarios.length === 0 ? (
            <div className={styles.empty}>Nenhum usuário cadastrado.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Nome</th>
                  <th className={styles.th}>Email</th>
                  <th className={styles.th}>Perfil</th>
                  <th className={styles.th}>Data de Cadastro</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => {
                  const isCurrent = u.id === usuario?.id;
                  const isRootAdmin = u.email === 'admin@vinculum.com';

                  return (
                    <tr key={u.id} className={i % 2 === 0 ? styles.trPar : styles.trImpar}>
                      <td className={styles.td} style={{ fontWeight: 600 }}>
                        {u.nome} {isCurrent && <span style={{ fontSize: '11px', color: 'var(--turquesa-400)', marginLeft: '6px' }}>(Você)</span>}
                      </td>
                      <td className={styles.td}>{u.email}</td>
                      <td className={styles.td}>
                        <span className={u.perfil === 'admin' ? styles.badgeAdmin : styles.badgeUsuario}>
                          {u.perfil === 'admin' ? 'Administrador' : 'Usuário'}
                        </span>
                      </td>
                      <td className={styles.td}>{formatarData(u.criado_em)}</td>
                      <td className={styles.td} style={{ textAlign: 'right' }}>
                        <div className={styles.actionsWrap}>
                          <button
                            className={styles.btnActionEdit}
                            onClick={() => abrirModalEditar(u)}
                            title="Editar usuário"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                                : 'Excluir usuário'
                            }
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal de Criação / Edição de Usuário */}
        {modalAberto && (
          <div className={styles.modalOverlay} onClick={fecharModal}>
            <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {usuarioEditando ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
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
                      placeholder="Ex: João da Silva"
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
                      placeholder="joao@empresa.com"
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
                      placeholder={usuarioEditando ? 'Deixe em branco para não alterar' : '••••••••'}
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
                      <option value="usuario">Usuário (Operacional)</option>
                      <option value="admin">Administrador (Controle Total)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button type="button" className={styles.btnCancel} onClick={fecharModal}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.btnSave} disabled={salvando}>
                    {salvando ? 'Salvando...' : usuarioEditando ? 'Salvar Alterações' : 'Cadastrar Usuário'}
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
