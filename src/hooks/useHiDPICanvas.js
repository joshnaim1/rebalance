import { useEffect, useRef, useCallback } from 'react';

export function useHiDPICanvas(canvasRef, logicalW, logicalH) {
  const containerRef = useRef(null);
  const onResizeRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      if (onResizeRef.current) onResizeRef.current();
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [canvasRef, logicalW, logicalH]);

  const setOnResize = useCallback((fn) => { onResizeRef.current = fn; }, []);

  return { containerRef, setOnResize };
}
