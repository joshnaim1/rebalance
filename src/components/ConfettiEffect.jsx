/**
 * ConfettiEffect — Canvas-based confetti burst animation.
 * Triggered when score ≥ 90 (via `trigger` prop).
 * Replaced with static congratulatory badge in reduced motion mode.
 * Skips silently if requestAnimationFrame is unavailable.
 *
 * @param {{ trigger: boolean }} props
 * - trigger: when true, fires the confetti burst
 */

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

const PARTICLE_COUNT = 60;
const GRAVITY = 0.3;
const FRICTION = 0.99;
const COLORS = ['#4ADE80', '#FACC15', '#F87171', '#60A5FA', '#A78BFA', '#FB923C'];

function createParticle(canvasWidth, canvasHeight) {
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * 6 + 3;
  return {
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 4 + 2,
    life: 1,
    decay: Math.random() * 0.015 + 0.01,
  };
}

export default function ConfettiEffect({ trigger }) {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const particlesRef = useRef([]);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    if (!trigger) {
      setShowBadge(false);
      return;
    }

    // In reduced motion mode, show static badge instead
    if (reducedMotion) {
      setShowBadge(true);
      return;
    }

    // Skip silently if requestAnimationFrame is unavailable
    if (typeof requestAnimationFrame === 'undefined') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match its display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Create particles
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(canvas.width, canvas.height)
    );

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;

      for (const p of particlesRef.current) {
        if (p.life <= 0) continue;

        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += GRAVITY;
        p.vx *= FRICTION;
        p.life -= p.decay;

        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      ctx.globalAlpha = 1;

      if (alive) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [trigger, reducedMotion]);

  // Skip rendering entirely if requestAnimationFrame is unavailable and not reduced motion
  if (typeof requestAnimationFrame === 'undefined' && !reducedMotion) {
    return null;
  }

  // Reduced motion: show static badge
  if (reducedMotion && trigger && showBadge) {
    return (
      <div
        className="fixed inset-0 pointer-events-none flex items-center justify-center z-50"
        aria-hidden="true"
      >
        <span className="text-4xl bg-slate-800/90 rounded-xl px-6 py-4 shadow-lg border border-balanced/30">
          🎉 Great job!
        </span>
      </div>
    );
  }

  // No trigger or reduced motion without trigger — render nothing
  if (!trigger || reducedMotion) {
    return null;
  }

  // Full animation mode: render canvas overlay
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      aria-hidden="true"
    />
  );
}
