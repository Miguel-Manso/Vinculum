import { useLayoutEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Processos from './pages/Processos';
import Fluxo     from './pages/Fluxo';
import Tarefa    from './pages/Tarefa';
import Tabela    from './pages/Tabela';
import Usuarios  from './pages/Usuarios';
import Chatbot   from './components/Chatbot';

/* Relógio das animações decorativas (estrelas da sidebar, onda do cabeçalho).
   Cada página remonta a Sidebar e o cabeçalho; sem isso as animações
   recomeçariam do zero a cada troca de tela. Gravamos o tempo decorrido
   como atraso negativo antes da pintura, e o CSS usa
   animation-delay: calc(var(--vc-clock) + ...) para continuar de onde estava. */
function useAnimationClock() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    document.documentElement.style.setProperty(
      '--vc-clock',
      `${(-performance.now() / 1000).toFixed(3)}s`
    );
  }, [pathname]);
}

function LayoutAutenticado() {
  const { token } = useAuth();
  useAnimationClock();
  if (!token) return <Navigate to="/login" replace />;

  return (
    <>
      <Outlet />
      <Chatbot />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Rotas protegidas com layout persistente: Chatbot não desmonta entre navegações */}
      <Route element={<LayoutAutenticado />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/processos" element={<Processos />} />
        <Route path="/processos/:id/fluxo" element={<Fluxo />} />
        <Route path="/tarefas/:id" element={<Tarefa />} />
        <Route path="/tabela" element={<Tabela />} />
        <Route path="/usuarios" element={<Usuarios />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
