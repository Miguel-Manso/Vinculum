import { useSidebar } from '../context/SidebarContext';
import styles from './SidebarTrigger.module.css';

/**
 * Botão para Minimizar / Expandir a Sidebar (idêntico ao PanelLeft do Mediator)
 */
export default function SidebarTrigger({ className = '', title }) {
  const { collapsed, toggleSidebar } = useSidebar();
  const labelText = title || (collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral');

  return (
    <button
      type="button"
      className={`${styles.triggerBtn} ${className}`}
      onClick={toggleSidebar}
      title={labelText}
      aria-label={labelText}
      aria-expanded={!collapsed}
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
        className={styles.icon}
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 3v18" />
      </svg>
    </button>
  );
}

