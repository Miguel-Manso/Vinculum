import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { usuario, encerrarSessao } = useAuth();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  function handleLogout() {
    encerrarSessao();
    setMenuAberto(false);
    navigate('/login');
  }

  function handleNavClick() {
    setMenuAberto(false);
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

            {(usuario?.perfil === 'admin' || usuario?.email === 'admin@vinculum.com') && (
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
                  {usuario?.perfil === 'admin' || usuario?.email === 'admin@vinculum.com' ? 'Admin' : 'Membro'}
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
    </>
  );
}
