import { useState, useEffect } from 'react';

const MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    try {
      return window.matchMedia(MEDIA_QUERY).matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let mql;
    try {
      mql = window.matchMedia(MEDIA_QUERY);
    } catch {
      return;
    }

    const handler = (event) => {
      setReduced(event.matches);
    };

    mql.addEventListener('change', handler);
    return () => {
      mql.removeEventListener('change', handler);
    };
  }, []);

  return reduced;
}
