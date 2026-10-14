import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSetor } from '../context/SetorContext';
import Logo from './Logo';
import ModalGerenciarSetores from './ModalGerenciarSetores';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { usuario, encerrarSessao } = useAuth();
  const {
    setoresDisponiveis,
    setorAtivo,
    selecionarSetor,
    modalGerenciarAberto,
    setModalGerenciarAberto,
  } = useSetor();

  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const [dropdownSetorAberto, setDropdownSetorAberto] = useState(false);
  const dropdownRef = useRef(null);

  const isAdmin = usuario?.perfil === 'admin' || usuario?.email === 'admin@vinculum.com';

  // Fecha o dropdown de setor se clicar fora
  useEffect(() => {
    function handleClickFora(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownSetorAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  function handleLogout() {
    encerrarSessao();
    setMenuAberto(false);
    navigate('/login');
  }

  function handleNavClick() {
    setMenuAberto(false);
  }

  function handleEscolherSetor(setor) {
    selecionarSetor(setor);
    setDropdownSetorAberto(false);
  }

  const inicial = usuario?.nome ? usuario.nome.charAt(0).toUpperCase() : 'U';

  return (
    <>
      {/* Header superior fixo exclusivo para dispositivos móveis com Menu Hambúrguer */}
      <header className={styles.mobileHeader}>
        <div className={styles.mobileLogo}>
          <Logo variant="horizontal" size={24} showImage={true} showSubtitle={false} />
        </div>
        <button
          type="button"
          className={styles.btnHamburger}
          onClick={() => setMenuAberto(prev => !prev)}
          aria-label={menuAberto ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
          title="Menu de navegação"
        >
          {menuAberto ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </header>

      {/* Backdrop para fechar o menu no mobile ao clicar fora */}
      {menuAberto && (
        <div
          className={styles.mobileBackdrop}
          onClick={() => setMenuAberto(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop fixa / Mobile gaveta deslizante) */}
      <aside className={`${styles.aside} ${menuAberto ? styles.asideOpenMobile : ''}`}>
        <div>
          <div className={styles.asideLogo}>
            <Logo variant="horizontal" size={26} showImage={true} showSubtitle={false} />
            <button
              type="button"
              className={styles.btnCloseMobile}
              onClick={() => setMenuAberto(false)}
              aria-label="Fechar menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* ======================================================== */}
          {/* SELETOR DE SETOR (WORKSPACE SWITCHER)                    */}
          {/* ======================================================== */}
          <div className={styles.workspaceSection} ref={dropdownRef}>
            <div className={styles.workspaceHeaderRow}>
              <span className={styles.workspaceLabel}>SETOR ATIVO</span>
              {isAdmin && (
                <button
                  type="button"
                  className={styles.btnGerenciarSetoresMini}
                  onClick={() => setModalGerenciarAberto(true)}
                  title="Configurar Setores"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>Gerenciar</span>
                </button>
              )}
            </div>

            <button
              type="button"
              className={`${styles.workspaceSelector} ${dropdownSetorAberto ? styles.workspaceSelectorOpen : ''}`}
              onClick={() => setDropdownSetorAberto(prev => !prev)}
              aria-expanded={dropdownSetorAberto}
            >
              <div className={styles.workspaceSelectorLeft}>
                <span
                  className={styles.workspaceDot}
                  style={{ backgroundColor: setorAtivo ? (setorAtivo.cor || '#2fd9f4') : '#2fd9f4' }}
                />
                <div className={styles.workspaceNameCol}>
                  <span className={styles.workspaceName}>
                    {setorAtivo ? setorAtivo.nome : 'Todos os Setores'}
                  </span>
                  <span className={styles.workspaceScope}>
                    {setorAtivo
                      ? `${setorAtivo.total_processos || 0} processos`
                      : `${setoresDisponiveis.length} setores visíveis`}
                  </span>
                </div>
              </div>
              <svg
                className={`${styles.chevronIcon} ${dropdownSetorAberto ? styles.chevronIconRotate : ''}`}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Menu Dropdown de Setores */}
            {dropdownSetorAberto && (
              <div className={styles.workspaceDropdown}>
                <div className={styles.dropdownHeader}>
                  <span>ALTERAR CONTEXTO</span>
                </div>

                {/* Opção Todos os Setores */}
                <button
                  type="button"
                  className={`${styles.dropdownItem} ${!setorAtivo ? styles.dropdownItemActive : ''}`}
                  onClick={() => handleEscolherSetor(null)}
                >
                  <div className={styles.dropdownItemLeft}>
                    <div className={styles.dropdownItemIconGeneral}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      </svg>
                    </div>
                    <div className={styles.dropdownItemText}>
                      <span className={styles.dropdownItemTitle}>Todos os Setores</span>
                      <span className={styles.dropdownItemSub}>Visão consolidada</span>
                    </div>
                  </div>
                  {!setorAtivo && (
                    <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                <div className={styles.dropdownDivider} />

                {/* Lista de Setores */}
                <div className={styles.dropdownListScroll}>
                  {setoresDisponiveis.map(setor => (
                    <button
                      key={setor.id}
                      type="button"
                      className={`${styles.dropdownItem} ${setorAtivo?.id === setor.id ? styles.dropdownItemActive : ''}`}
                      onClick={() => handleEscolherSetor(setor)}
                    >
                      <div className={styles.dropdownItemLeft}>
                        <span
                          className={styles.dropdownItemDot}
                          style={{ backgroundColor: setor.cor || '#2fd9f4' }}
                        />
                        <div className={styles.dropdownItemText}>
                          <span className={styles.dropdownItemTitle}>{setor.nome}</span>
                          <span className={styles.dropdownItemSub}>
                            {setor.total_processos || 0} processos
                          </span>
                        </div>
                      </div>
                      {setorAtivo?.id === setor.id && (
                        <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>

                {isAdmin && (
                  <>
                    <div className={styles.dropdownDivider} />
                    <button
                      type="button"
                      className={styles.dropdownBtnGerenciar}
                      onClick={() => {
                        setDropdownSetorAberto(false);
                        setModalGerenciarAberto(true);
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Gerenciar Setores</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className={styles.navSectionHeader}>
            <span className={styles.navSectionLabel}>MÓDULOS OPERACIONAIS</span>
          </div>

          <nav className={styles.asideNav}>
            <NavLink
              to="/dashboard"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/processos"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>Processos</span>
            </NavLink>

            <NavLink
              to="/tabela"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              <span>Tabela Geral</span>
            </NavLink>

            {isAdmin && (
              <NavLink
                to="/usuarios"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Equipe / Usuários</span>
              </NavLink>
            )}

            {isAdmin && (
              <button
                type="button"
                className={styles.navLinkButton}
                onClick={() => {
                  setMenuAberto(false);
                  setModalGerenciarAberto(true);
                }}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <span>Gerenciar Setores</span>
              </button>
            )}
          </nav>
        </div>

        <div className={styles.userFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {inicial}
            </div>
            <div className={styles.userText}>
              <div className={styles.userNameRow}>
                <span className={styles.userName}>{usuario?.nome || 'Usuário'}</span>
                <span className={styles.userBadge}>
                  {isAdmin ? 'Admin' : 'Membro'}
                </span>
              </div>
              <span className={styles.userEmail}>{usuario?.email || ''}</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.btnLogout}
            onClick={handleLogout}
            title="Encerrar sessão"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Modal de Gestão de Setores (para Administrador) */}
      <ModalGerenciarSetores
        isOpen={modalGerenciarAberto}
        onClose={() => setModalGerenciarAberto(false)}
      />
    </>
  );
}
