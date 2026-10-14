import { useState } from 'react';
import { useSetor } from '../context/SetorContext';
import api from '../services/api';
import styles from './ModalGerenciarSetores.module.css';

const PALETA_CORES = [
  '#2fd9f4', // Cyan Stitch
  '#10b981', // Verde Esmeralda
  '#3b82f6', // Azul Cobalto
  '#8b5cf6', // Violeta
  '#f59e0b', // Âmbar Dourado
  '#ec4899', // Rosa Neon
  '#06b6d4', // Ciano Marinho
  '#ef4444', // Coral Alerta
];

export default function ModalGerenciarSetores({ isOpen, onClose }) {
  const { setoresDisponiveis, recarregarSetores, setorAtivo, selecionarSetor } = useSetor();

  const [editando, setEditando] = useState(null); // null = listagem/novo
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cor, setCor] = useState('#2fd9f4');
  const [icone, setIcone] = useState('folder');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  if (!isOpen) return null;

  function iniciarCriacao() {
    setEditando('novo');
    setNome('');
    setDescricao('');
    setCor('#2fd9f4');
    setIcone('folder');
    setErro('');
    setSucesso('');
  }

  function iniciarEdicao(setor) {
    setEditando(setor);
    setNome(setor.nome || '');
    setDescricao(setor.descricao || '');
    setCor(setor.cor || '#2fd9f4');
    setIcone(setor.icone || 'folder');
    setErro('');
    setSucesso('');
  }

  function cancelarFormulario() {
    setEditando(null);
    setNome('');
    setDescricao('');
    setErro('');
    setSucesso('');
  }

  async function handleSalvar(e) {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('O nome do setor é obrigatório.');
      return;
    }

    setSalvando(true);
    setErro('');
    setSucesso('');

    try {
      if (editando === 'novo') {
        await api.post('/setores', {
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          cor,
          icone,
        });
        setSucesso('Setor criado com sucesso!');
      } else {
        await api.put(`/setores/${editando.id}`, {
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          cor,
          icone,
        });
        setSucesso('Setor atualizado com sucesso!');
      }

      await recarregarSetores();
      setTimeout(() => {
        cancelarFormulario();
      }, 700);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao salvar setor.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(setor) {
    if (!window.confirm(`Tem certeza que deseja excluir o setor "${setor.nome}"?\nOs processos pertencentes a ele ficarão desvinculados.`)) {
      return;
    }

    try {
      await api.delete(`/setores/${setor.id}`);
      if (setorAtivo?.id === setor.id) {
        selecionarSetor(null);
      }
      await recarregarSetores();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao excluir setor.');
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitleRow}>
            <div className={styles.headerIconWrap}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h2 className={styles.title}>Gerenciamento de Setores</h2>
              <p className={styles.subtitle}>
                Organize processos e controle o isolamento de acessos por departamento.
              </p>
            </div>
          </div>
          <button type="button" className={styles.btnClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {erro && <div className={styles.alertError}>{erro}</div>}
          {sucesso && <div className={styles.alertSuccess}>{sucesso}</div>}

          {editando ? (
            /* Formulário de Criação/Edição */
            <form onSubmit={handleSalvar} className={styles.form}>
              <h3 className={styles.formTitle}>
                {editando === 'novo' ? 'Novo Setor' : `Editar: ${editando.nome}`}
              </h3>

              <div className={styles.field}>
                <label className={styles.label}>Nome do Setor *</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Ex: Comercial / Vendas, Financeiro, Logística..."
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Descrição do Setor</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Finalidade, escopo de processos e responsabilidades..."
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  rows={3}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Cor de Identificação</label>
                <div className={styles.colorPalette}>
                  {PALETA_CORES.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.colorChip} ${cor === c ? styles.colorChipActive : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setCor(c)}
                      title={c}
                    />
                  ))}
                  <input
                    type="color"
                    className={styles.colorPickerCustom}
                    value={cor}
                    onChange={e => setCor(e.target.value)}
                    title="Cor personalizada"
                  />
                </div>
              </div>

              <div className={styles.formFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={cancelarFormulario}
                  disabled={salvando}
                >
                  Voltar para Lista
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={salvando}
                >
                  {salvando ? 'Salvando...' : (editando === 'novo' ? 'Criar Setor' : 'Salvar Alterações')}
                </button>
              </div>
            </form>
          ) : (
            /* Listagem de Setores */
            <div className={styles.listContainer}>
              <div className={styles.listHeaderActions}>
                <span className={styles.listCounter}>
                  {setoresDisponiveis.length} {setoresDisponiveis.length === 1 ? 'setor ativo' : 'setores ativos'}
                </span>
                <button
                  type="button"
                  className={styles.btnNovoSetor}
                  onClick={iniciarCriacao}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Criar Novo Setor</span>
                </button>
              </div>

              <div className={styles.sectorCardsList}>
                {setoresDisponiveis.map(setor => (
                  <div key={setor.id} className={styles.sectorCard}>
                    <div className={styles.sectorColorStripe} style={{ backgroundColor: setor.cor || '#2fd9f4' }} />
                    <div className={styles.sectorCardContent}>
                      <div className={styles.sectorCardTop}>
                        <div className={styles.sectorTitleArea}>
                          <span
                            className={styles.sectorBadgePill}
                            style={{
                              borderColor: `${setor.cor || '#2fd9f4'}55`,
                              color: setor.cor || '#2fd9f4',
                              backgroundColor: `${setor.cor || '#2fd9f4'}15`
                            }}
                          >
                            <span
                              className={styles.sectorBadgeDot}
                              style={{ backgroundColor: setor.cor || '#2fd9f4' }}
                            />
                            {setor.nome}
                          </span>
                          {setorAtivo?.id === setor.id && (
                            <span className={styles.activeTag}>Ativo no filtro</span>
                          )}
                        </div>

                        <div className={styles.sectorActions}>
                          <button
                            type="button"
                            className={styles.btnActionIcon}
                            onClick={() => iniciarEdicao(setor)}
                            title="Editar setor"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className={styles.btnActionIconDanger}
                            onClick={() => handleExcluir(setor)}
                            title="Excluir setor"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <p className={styles.sectorDesc}>
                        {setor.descricao || 'Nenhuma descrição informada para este setor.'}
                      </p>

                      <div className={styles.sectorMetaRow}>
                        <span className={styles.sectorMetaItem}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span>{setor.total_processos || 0} processos</span>
                        </span>
                        <span className={styles.sectorMetaItem}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                          </svg>
                          <span>{setor.total_membros || 0} membros</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
