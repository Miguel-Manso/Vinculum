import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const SetorContext = createContext(null);

export function SetorProvider({ children }) {
  const { token, usuario } = useAuth();
  const [setoresDisponiveis, setSetoresDisponiveis] = useState([]);
  const [loadingSetores, setLoadingSetores] = useState(false);
  const [modalGerenciarAberto, setModalGerenciarAberto] = useState(false);

  const [setorAtivo, setSetorAtivo] = useState(() => {
    try {
      const salvo = localStorage.getItem('vinculum_setor_ativo');
      return salvo ? JSON.parse(salvo) : null;
    } catch {
      return null;
    }
  });

  const carregarSetores = useCallback(async () => {
    if (!token) {
      setSetoresDisponiveis([]);
      return;
    }

    setLoadingSetores(true);
    try {
      const res = await api.get('/setores');
      const lista = res.data || [];
      setSetoresDisponiveis(lista);

      // Se o setor ativo salvo não existir mais na lista retornada, reseta para Todos
      setSetorAtivo(atual => {
        if (!atual) return null;
        const aindaExiste = lista.some(s => s.id === atual.id);
        if (!aindaExiste) {
          localStorage.removeItem('vinculum_setor_ativo');
          return null;
        }
        // Atualiza com dados frescos (nome, cor, contadores)
        const atualizado = lista.find(s => s.id === atual.id);
        localStorage.setItem('vinculum_setor_ativo', JSON.stringify(atualizado));
        return atualizado;
      });
    } catch (err) {
      console.error('Erro ao carregar setores:', err);
    } finally {
      setLoadingSetores(false);
    }
  }, [token]);

  useEffect(() => {
    carregarSetores();
  }, [carregarSetores]);

  function selecionarSetor(setor) {
    if (!setor) {
      localStorage.removeItem('vinculum_setor_ativo');
      setSetorAtivo(null);
    } else {
      localStorage.setItem('vinculum_setor_ativo', JSON.stringify(setor));
      setSetorAtivo(setor);
    }
  }

  return (
    <SetorContext.Provider
      value={{
        setoresDisponiveis,
        setorAtivo,
        loadingSetores,
        selecionarSetor,
        recarregarSetores: carregarSetores,
        modalGerenciarAberto,
        setModalGerenciarAberto,
      }}
    >
      {children}
    </SetorContext.Provider>
  );
}

export function useSetor() {
  const context = useContext(SetorContext);
  if (!context) {
    throw new Error('useSetor deve ser utilizado dentro de um SetorProvider');
  }
  return context;
}

export default SetorContext;
