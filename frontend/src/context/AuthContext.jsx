import { createContext, useContext, useState } from 'react';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token,   setToken]   = useState(() => localStorage.getItem('token'));
  const [usuario, setUsuario] = useState(() => {
    try {
      const u = localStorage.getItem('usuario');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  function salvarSessao(t, u) {
    localStorage.setItem('token', t);
    localStorage.setItem('usuario', JSON.stringify(u));
    setToken(t);
    setUsuario(u);
  }

  function encerrarSessao() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ token, usuario, salvarSessao, encerrarSessao }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
