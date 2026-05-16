/**
 * AnimatedCounter — Counts up to a target value over a specified duration.
 * Respects reduced motion (shows final value immediately).
 *
 * @param {{ value: number, duration?: number }} props
 * - value: target number to count up to
 * - duration: animation duration in milliseconds (default 300)
 */

import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export default function AnimatedCounter({ value, duration = 300 }) {
  const reducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const startValueRef = useRef(value);

  useEffect(() => {
    // Cancel any in-progress animation
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // If reduced motion is active or duration is 0, show final value immediately
    if (reducedMotion || duration <= 0) {
      setDisplayValue(value);
      return;
    }

    const from = startValueRef.current;
    const to = value;

    // No animation needed if value hasn't changed
    if (from === to) {
      setDisplayValue(to);
      return;
    }

    startTimeRef.current = null;

    const animate = (timestamp) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      const current = from + (to - from) * progress;
      setDisplayValue(Math.round(current));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rafRef.current = null;
        startValueRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [value, duration, reducedMotion]);

  // Update startValueRef when animation completes or on immediate set
  useEffect(() => {
    if (reducedMotion || duration <= 0) {
      startValueRef.current = value;
    }
  }, [value, reducedMotion, duration]);

  return <span>{displayValue}</span>;
}
