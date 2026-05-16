import { useRef, useEffect } from 'react';

export function useGameLoop(callback, running = false) {
  const rafRef = useRef(null);
  const prevTimeRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!running) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      prevTimeRef.current = null;
      return;
    }

    prevTimeRef.current = null;

    function loop(timestamp) {
      if (prevTimeRef.current === null) {
        prevTimeRef.current = timestamp;
      }
      const dt = (timestamp - prevTimeRef.current) / 1000;
      prevTimeRef.current = timestamp;

      callbackRef.current(dt, timestamp);
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [running]);
}
