import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ConfettiEffect from '../ConfettiEffect';

// Mock useReducedMotion hook
vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from '../../hooks/useReducedMotion';

describe('ConfettiEffect', () => {
  let originalRaf;
  let originalCaf;
  let rafCallbacks;

  beforeEach(() => {
    useReducedMotion.mockReturnValue(false);
    rafCallbacks = [];
    originalRaf = globalThis.requestAnimationFrame;
    originalCaf = globalThis.cancelAnimationFrame;

    globalThis.requestAnimationFrame = vi.fn((cb) => {
      const id = rafCallbacks.length + 1;
      rafCallbacks.push(cb);
      return id;
    });
    globalThis.cancelAnimationFrame = vi.fn();

    // Mock canvas getContext since jsdom doesn't support it
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      globalAlpha: 1,
    }));
    // Mock getBoundingClientRect for canvas sizing
    HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
    }));
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRaf;
    globalThis.cancelAnimationFrame = originalCaf;
    vi.restoreAllMocks();
  });

  it('renders nothing when trigger is false', () => {
    const { container } = render(<ConfettiEffect trigger={false} />);
    expect(container.querySelector('canvas')).not.toBeInTheDocument();
    expect(container.textContent).toBe('');
  });

  it('renders a canvas element when trigger is true and motion is allowed', () => {
    const { container } = render(<ConfettiEffect trigger={true} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
  });

  it('canvas has fixed positioning as an overlay', () => {
    const { container } = render(<ConfettiEffect trigger={true} />);
    const canvas = container.querySelector('canvas');
    expect(canvas.className).toContain('fixed');
    expect(canvas.className).toContain('inset-0');
    expect(canvas.className).toContain('pointer-events-none');
    expect(canvas.className).toContain('z-50');
  });

  it('starts animation with requestAnimationFrame when triggered', () => {
    render(<ConfettiEffect trigger={true} />);
    expect(globalThis.requestAnimationFrame).toHaveBeenCalled();
  });

  it('shows static congratulatory badge in reduced motion mode', () => {
    useReducedMotion.mockReturnValue(true);
    const { container } = render(<ConfettiEffect trigger={true} />);
    expect(container.querySelector('canvas')).not.toBeInTheDocument();
    expect(container.textContent).toContain('🎉 Great job!');
  });

  it('static badge is aria-hidden', () => {
    useReducedMotion.mockReturnValue(true);
    const { container } = render(<ConfettiEffect trigger={true} />);
    const badge = container.firstChild;
    expect(badge).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not render badge in reduced motion mode when trigger is false', () => {
    useReducedMotion.mockReturnValue(true);
    const { container } = render(<ConfettiEffect trigger={false} />);
    expect(container.textContent).toBe('');
  });

  it('does not call requestAnimationFrame in reduced motion mode', () => {
    useReducedMotion.mockReturnValue(true);
    render(<ConfettiEffect trigger={true} />);
    expect(globalThis.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('cancels animation frame on unmount', () => {
    const { unmount } = render(<ConfettiEffect trigger={true} />);
    unmount();
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('skips silently when requestAnimationFrame is unavailable', () => {
    globalThis.requestAnimationFrame = undefined;
    const { container } = render(<ConfettiEffect trigger={true} />);
    // Should render nothing (no canvas, no badge)
    expect(container.querySelector('canvas')).not.toBeInTheDocument();
    expect(container.textContent).toBe('');
  });

  it('shows badge even when requestAnimationFrame is unavailable in reduced motion mode', () => {
    globalThis.requestAnimationFrame = undefined;
    useReducedMotion.mockReturnValue(true);
    const { container } = render(<ConfettiEffect trigger={true} />);
    expect(container.textContent).toContain('🎉 Great job!');
  });
});
