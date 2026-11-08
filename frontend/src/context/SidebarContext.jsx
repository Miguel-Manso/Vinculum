import { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext({
  collapsed: false,
  toggleSidebar: () => {},
  setCollapsed: () => {},
});

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsedState] = useState(() => {
    try {
      const saved = localStorage.getItem('vinculum_sidebar_collapsed');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vinculum_sidebar_collapsed', JSON.stringify(collapsed));
    } catch (e) {
      console.warn('Não foi possível persistir estado da sidebar:', e);
    }
  }, [collapsed]);

  const toggleSidebar = () => {
    setCollapsedState(prev => !prev);
  };

  const setCollapsed = (val) => {
    setCollapsedState(Boolean(val));
  };

  return (
    <SidebarContext.Provider value={{ collapsed, toggleSidebar, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar deve ser utilizado dentro de um SidebarProvider');
  }
  return context;
}

