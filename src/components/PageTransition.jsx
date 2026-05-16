import { useEffect, useState, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * PageTransition wrapper — applies a fade-in (opacity 0→1 over 150ms) on tab change.
 * Skips transition when reduced motion is active.
 * Content is always in the DOM immediately (no conditional rendering).
 */
export default function PageTransition({ children, activeKey }) {
  const reducedMotion = useReducedMotion();
  const [animating, setAnimating] = useState(false);
  const prevKeyRef = useRef(activeKey);

  useEffect(() => {
    if (prevKeyRef.current !== activeKey) {
      prevKeyRef.current = activeKey;
      if (!reducedMotion) {
        setAnimating(true);
        // Remove the animating class after the transition completes
        const timer = setTimeout(() => setAnimating(false), 150);
        return () => clearTimeout(timer);
      }
    }
  }, [activeKey, reducedMotion]);

  return (
    <div
      className={animating ? 'page-transition-fade-in' : ''}
      style={animating ? { animation: 'page-fade-in 150ms ease-out forwards' } : undefined}
    >
      {children}
    </div>
  );
}
