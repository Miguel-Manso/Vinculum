import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSetor } from '../context/SetorContext';
import { useSidebar } from '../context/SidebarContext';
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
  const { collapsed } = useSidebar();

  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const [dropdownSetorAberto, setDropdownSetorAberto] = useState(false);
  const dropdownRef = useRef(null);

  const isAdmin = usuario?.perfil === 'admin' || usuario?.email === 'admin@vinculum.com';
  const nomeExibicao = usuario?.nome || 'Administrador';
  const emailExibicao = usuario?.email || 'admin@vinculum.com';
  const cargoBadge = isAdmin ? 'ADMIN' : (usuario?.perfil ? usuario.perfil.toUpperCase() : 'MEMBRO');
  const inicial = nomeExibicao.charAt(0).toUpperCase() || 'A';

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

      {/* Sidebar Desktop Fixa / Mobile Gaveta Deslizante */}
      <aside
        className={`${styles.aside} ${collapsed ? styles.asideCollapsed : ''} ${
          menuAberto ? styles.asideOpenMobile : ''
        }`}
        aria-label="Navegação Vinculum"
      >
        {/* Cabeçalho da Sidebar (Logo posicionada exatamente como antes) */}
        <div className={styles.asideLogo}>
          {collapsed ? (
            <Logo variant="icon" size={26} showImage={true} showSubtitle={false} />
          ) : (
            <Logo variant="horizontal" size={26} showImage={true} showSubtitle={false} />
          )}

          {/* Botão fechar apenas no mobile */}
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

        {/* Conteúdo com rolagem independente */}
        <div className={styles.asideContent}>
          {/* ======================================================== */}
          {/* SELETOR DE CONTEXTO / SETOR (REWORK VISUAL MODERNO)      */}
          {/* ======================================================== */}
          <div className={styles.workspaceWrapper} ref={dropdownRef}>
            <button
              type="button"
              className={`${styles.sectorCard} ${dropdownSetorAberto ? styles.sectorCardOpen : ''} ${
                collapsed ? styles.sectorCardCollapsed : ''
              }`}
              onClick={() => setDropdownSetorAberto(prev => !prev)}
              aria-expanded={dropdownSetorAberto}
              title={setorAtivo ? `Setor ativo: ${setorAtivo.nome}` : 'Todos os Setores (Consolidado)'}
            >
              <div className={styles.sectorBadgeBox}>
                {setorAtivo ? (
                  <span
                    className={styles.sectorColorBadge}
                    style={{
                      backgroundColor: setorAtivo.cor || '#2fd9f4',
                      boxShadow: `0 0 10px ${setorAtivo.cor || '#2fd9f4'}55`
                    }}
                  >
                    {setorAtivo.nome.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <span className={styles.sectorGeneralBadge}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                  </span>
                )}
              </div>

              {!collapsed && (
                <div className={styles.sectorInfo}>
                  <div className={styles.sectorTitleRow}>
                    <span className={styles.sectorTitle}>
                      {setorAtivo ? setorAtivo.nome : 'Todos os Setores'}
                    </span>
                  </div>
                  <span className={styles.sectorSubtitle}>
                    {setorAtivo
                      ? `${setorAtivo.total_processos || 0} processos`
                      : 'Visão consolidada'}
                  </span>
                </div>
              )}

              {!collapsed && (
                <div className={styles.sectorChevronWrap}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={styles.chevronsUpDownIcon}
                  >
                    <path d="m7 15 5 5 5-5" />
                    <path d="m7 9 5-5 5 5" />
                  </svg>
                </div>
              )}
            </button>

            {/* Dropdown Popover de Setores */}
            {dropdownSetorAberto && (
              <div
                className={`${styles.sectorDropdownPopover} ${
                  collapsed ? styles.sectorDropdownFloating : ''
                }`}
              >
                <div className={styles.dropdownHeaderLabel}>
                  <span>ALTERNAR SETOR</span>
                </div>

                {/* Opção Todos os Setores */}
                <button
                  type="button"
                  className={`${styles.dropdownOption} ${!setorAtivo ? styles.dropdownOptionActive : ''}`}
                  onClick={() => handleEscolherSetor(null)}
                >
                  <div className={styles.dropdownOptionLeft}>
                    <div className={styles.dropdownOptionIconGrid}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      </svg>
                    </div>
                    <div className={styles.dropdownOptionText}>
                      <span className={styles.dropdownOptionName}>Todos os Setores</span>
                      <span className={styles.dropdownOptionMeta}>Visão geral consolidada</span>
                    </div>
                  </div>
                  {!setorAtivo && (
                    <svg className={styles.activeCheckIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                <div className={styles.dropdownDivider} />

                {/* Lista rolável de setores */}
                <div className={styles.dropdownScrollArea}>
                  {setoresDisponiveis.map(setor => {
                    const isSelected = setorAtivo?.id === setor.id;
                    return (
                      <button
                        key={setor.id}
                        type="button"
                        className={`${styles.dropdownOption} ${isSelected ? styles.dropdownOptionActive : ''}`}
                        onClick={() => handleEscolherSetor(setor)}
                      >
                        <div className={styles.dropdownOptionLeft}>
                          <span
                            className={styles.dropdownSectorBadge}
                            style={{
                              backgroundColor: `${setor.cor || '#2fd9f4'}22`,
                              color: setor.cor || '#2fd9f4',
                              borderColor: `${setor.cor || '#2fd9f4'}55`,
                            }}
                          >
                            {setor.nome.charAt(0).toUpperCase()}
                          </span>
                          <div className={styles.dropdownOptionText}>
                            <span className={styles.dropdownOptionName}>{setor.nome}</span>
                            <span className={styles.dropdownOptionMeta}>
                              {setor.total_processos || 0} processos
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <svg className={styles.activeCheckIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Ação de Configuração / Gestão de Setores */}
                {isAdmin && (
                  <>
                    <div className={styles.dropdownDivider} />
                    <button
                      type="button"
                      className={styles.dropdownFooterBtn}
                      onClick={() => {
                        setDropdownSetorAberto(false);
                        setModalGerenciarAberto(true);
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      <span>Gerenciar Setores</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* GRUPO 1: OPERACIONAL                                     */}
          {/* ======================================================== */}
          <div className={styles.navGroup}>
            {!collapsed ? (
              <span className={styles.navGroupLabel}>OPERACIONAL</span>
            ) : (
              <div className={styles.navGroupDivider} />
            )}
            <nav className={styles.navGroupMenu}>
              <NavLink
                to="/dashboard"
                onClick={handleNavClick}
                title="Dashboard"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''} ${
                    collapsed ? styles.navLinkCollapsed : ''
                  }`
                }
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
                {!collapsed && <span>Dashboard</span>}
              </NavLink>

              <NavLink
                to="/processos"
                onClick={handleNavClick}
                title="Processos"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''} ${
                    collapsed ? styles.navLinkCollapsed : ''
                  }`
                }
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                {!collapsed && <span>Processos</span>}
              </NavLink>

              <NavLink
                to="/tabela"
                onClick={handleNavClick}
                title="Tabela Geral"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''} ${
                    collapsed ? styles.navLinkCollapsed : ''
                  }`
                }
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
                {!collapsed && <span>Tabela Geral</span>}
              </NavLink>
            </nav>
          </div>

          {/* ======================================================== */}
          {/* GRUPO 2: GESTÃO & CONTROLE (Apenas ADMIN)                */}
          {/* ======================================================== */}
          {isAdmin && (
            <div className={styles.navGroup}>
              {!collapsed ? (
                <span className={styles.navGroupLabel}>GESTÃO & CONTROLE</span>
              ) : (
                <div className={styles.navGroupDivider} />
              )}
              <nav className={styles.navGroupMenu}>
                <NavLink
                  to="/usuarios"
                  onClick={handleNavClick}
                  title="Equipe / Usuários"
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''} ${
                      collapsed ? styles.navLinkCollapsed : ''
                    }`
                  }
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  {!collapsed && <span>Equipe / Usuários</span>}
                </NavLink>

                <button
                  type="button"
                  className={`${styles.navLinkButton} ${collapsed ? styles.navLinkCollapsed : ''}`}
                  title="Gerenciar Setores"
                  onClick={() => {
                    setMenuAberto(false);
                    setModalGerenciarAberto(true);
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  {!collapsed && <span>Gerenciar Setores</span>}
                </button>
              </nav>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* RODAPÉ FIXO PERMANENTE: CARD DO USUÁRIO OPERADOR         */}
        {/* ======================================================== */}
        <div className={styles.userFooter}>
          <div className={`${styles.userCard} ${collapsed ? styles.userCardCollapsed : ''}`}>
            <div
              className={styles.userAvatar}
              aria-hidden="true"
              title={collapsed ? `${nomeExibicao} (${cargoBadge})` : undefined}
            >
              {inicial}
            </div>

            {!collapsed && (
              <div className={styles.userText}>
                <div className={styles.userNameRow}>
                  <span className={styles.userName} title={nomeExibicao}>
                    {nomeExibicao}
                  </span>
                  <span className={styles.userBadge}>
                    {cargoBadge}
                  </span>
                </div>
                <span className={styles.userEmail} title={emailExibicao}>
                  {emailExibicao}
                </span>
              </div>
            )}

            <button
              type="button"
              className={styles.btnLogout}
              onClick={handleLogout}
              title="Encerrar sessão"
              aria-label="Sair do sistema"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
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
