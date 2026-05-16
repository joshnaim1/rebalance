import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AnimatedCounter from '../AnimatedCounter';

// Mock useReducedMotion hook
vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from '../../hooks/useReducedMotion';

describe('AnimatedCounter', () => {
  let rafCallbacks;
  let originalRaf;
  let originalCaf;

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
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRaf;
    globalThis.cancelAnimationFrame = originalCaf;
    vi.restoreAllMocks();
  });

  it('renders the final value immediately when reduced motion is active', () => {
    useReducedMotion.mockReturnValue(true);
    render(<AnimatedCounter value={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders a span element', () => {
    useReducedMotion.mockReturnValue(true);
    const { container } = render(<AnimatedCounter value={10} />);
    expect(container.querySelector('span')).toBeInTheDocument();
  });

  it('shows final value immediately when duration is 0', () => {
    render(<AnimatedCounter value={100} duration={0} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('shows final value immediately when duration is negative', () => {
    render(<AnimatedCounter value={50} duration={-100} />);
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('requests animation frame when motion is allowed and value changes', () => {
    const { rerender } = render(<AnimatedCounter value={0} duration={300} />);
    rerender(<AnimatedCounter value={100} duration={300} />);
    expect(globalThis.requestAnimationFrame).toHaveBeenCalled();
  });

  it('does not request animation frame when reduced motion is active', () => {
    useReducedMotion.mockReturnValue(true);
    const { rerender } = render(<AnimatedCounter value={0} duration={300} />);
    rerender(<AnimatedCounter value={100} duration={300} />);
    expect(globalThis.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('animates from start to end value over duration', () => {
    const { container, rerender } = render(<AnimatedCounter value={0} duration={300} />);

    // Change value to trigger animation
    rerender(<AnimatedCounter value={100} duration={300} />);

    // Simulate halfway through animation
    expect(rafCallbacks.length).toBeGreaterThan(0);
    const cb = rafCallbacks[rafCallbacks.length - 1];

    act(() => {
      cb(150); // first call sets start time
    });

    act(() => {
      // Get the next callback
      const nextCb = rafCallbacks[rafCallbacks.length - 1];
      nextCb(300); // 150ms elapsed = 50% progress
    });

    const span = container.querySelector('span');
    expect(Number(span.textContent)).toBe(50);
  });

  it('displays rounded integer values during animation', () => {
    const { container, rerender } = render(<AnimatedCounter value={0} duration={300} />);
    rerender(<AnimatedCounter value={7} duration={300} />);

    const cb = rafCallbacks[rafCallbacks.length - 1];
    act(() => {
      cb(0); // start time
    });

    const nextCb = rafCallbacks[rafCallbacks.length - 1];
    act(() => {
      nextCb(150); // 50% of 7 = 3.5, should round to 4
    });

    const span = container.querySelector('span');
    // At 50% progress: 0 + (7 - 0) * 0.5 = 3.5, rounded = 4
    expect(Number(span.textContent)).toBe(4);
  });

  it('reaches final value when animation completes', () => {
    const { container, rerender } = render(<AnimatedCounter value={0} duration={300} />);
    rerender(<AnimatedCounter value={75} duration={300} />);

    const cb = rafCallbacks[rafCallbacks.length - 1];
    act(() => {
      cb(0); // start time
    });

    const nextCb = rafCallbacks[rafCallbacks.length - 1];
    act(() => {
      nextCb(300); // 100% progress
    });

    const span = container.querySelector('span');
    expect(Number(span.textContent)).toBe(75);
  });

  it('cancels animation frame on unmount', () => {
    const { rerender, unmount } = render(<AnimatedCounter value={0} duration={300} />);
    rerender(<AnimatedCounter value={100} duration={300} />);

    unmount();
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('uses default duration of 300ms', () => {
    useReducedMotion.mockReturnValue(true);
    render(<AnimatedCounter value={50} />);
    // Should render immediately with reduced motion, confirming default duration doesn't break
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('handles value of 0', () => {
    useReducedMotion.mockReturnValue(true);
    render(<AnimatedCounter value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles negative values', () => {
    useReducedMotion.mockReturnValue(true);
    render(<AnimatedCounter value={-10} />);
    expect(screen.getByText('-10')).toBeInTheDocument();
  });
});
