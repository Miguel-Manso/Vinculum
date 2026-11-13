import { useEffect, useRef } from 'react';

/**
 * Executa `handler` quando a tecla ESC é pressionada enquanto `ativo` for true.
 * Usado para fechar modais e popovers de forma previsível.
 */
export default function useEscapeKey(ativo, handler) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    if (!ativo) return;
    function onKey(e) {
      if (e.key === 'Escape') ref.current?.(e);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ativo]);
}
