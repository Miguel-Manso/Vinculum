import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Processos from './pages/Processos';
import Fluxo     from './pages/Fluxo';
import Tarefa    from './pages/Tarefa';
import Tabela    from './pages/Tabela';
import Usuarios  from './pages/Usuarios';
import Chatbot   from './components/Chatbot';

function LayoutAutenticado() {
  const { token } = useAuth();
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
