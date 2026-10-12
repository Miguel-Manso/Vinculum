import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Processos from './pages/Processos';
import Fluxo     from './pages/Fluxo';
import Tarefa    from './pages/Tarefa';
import Tabela    from './pages/Tabela';
import Usuarios  from './pages/Usuarios';
import Chatbot   from './components/Chatbot';

function RotaProtegida({ children }) {
  const { token } = useAuth();
  return token ? (
    <>
      {children}
      <Chatbot />
    </>
  ) : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={
        <RotaProtegida><Dashboard /></RotaProtegida>
      } />
      <Route path="/processos" element={
        <RotaProtegida><Processos /></RotaProtegida>
      } />
      <Route path="/processos/:id/fluxo" element={
        <RotaProtegida><Fluxo /></RotaProtegida>
      } />
      <Route path="/tarefas/:id" element={
        <RotaProtegida><Tarefa /></RotaProtegida>
      } />
      <Route path="/tabela" element={
        <RotaProtegida><Tabela /></RotaProtegida>
      } />
      <Route path="/usuarios" element={
        <RotaProtegida><Usuarios /></RotaProtegida>
      } />

      {/* Próximas: chatbot (out/nov) */}

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
