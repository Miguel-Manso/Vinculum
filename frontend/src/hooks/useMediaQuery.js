import { useEffect, useState } from 'react';

/** Retorna true enquanto a media query informada corresponder à viewport. */
export default function useMediaQuery(query) {
  const [match, setMatch] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = e => setMatch(e.matches);
    setMatch(mql.matches);
    mql.addEventListener ? mql.addEventListener('change', onChange) : mql.addListener(onChange);
    return () => {
      mql.removeEventListener ? mql.removeEventListener('change', onChange) : mql.removeListener(onChange);
    };
  }, [query]);

  return match;
}
