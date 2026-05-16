import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CircularProgress, { CIRCUMFERENCE, formatTime } from '../CircularProgress';

// Mock useReducedMotion hook
vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from '../../hooks/useReducedMotion';

describe('CircularProgress', () => {
  beforeEach(() => {
    useReducedMotion.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with role="progressbar" and correct ARIA attributes', () => {
    render(<CircularProgress elapsed={30} total={60} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveAttribute('aria-label', 'Session progress: 00:30 elapsed');
  });

  it('renders SVG with aria-hidden="true"', () => {
    const { container } = render(<CircularProgress elapsed={10} total={60} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('displays elapsed time in MM:SS format in the center', () => {
    const { container } = render(<CircularProgress elapsed={125} total={300} />);
    const text = container.querySelector('text');
    expect(text.textContent).toBe('02:05');
  });

  it('clamps progress to 0 when elapsed is negative', () => {
    render(<CircularProgress elapsed={-5} total={60} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '0');
  });

  it('clamps progress to 100 when elapsed exceeds total', () => {
    render(<CircularProgress elapsed={120} total={60} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '100');
  });

  it('handles total of 0 gracefully (no division by zero)', () => {
    render(<CircularProgress elapsed={10} total={0} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '0');
  });

  it('calculates correct stroke-dashoffset for progress', () => {
    const { container } = render(<CircularProgress elapsed={30} total={60} />);
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1]; // second circle is the progress ring
    const expectedOffset = CIRCUMFERENCE * (1 - 0.5);
    expect(progressCircle).toHaveAttribute('stroke-dashoffset', String(expectedOffset));
  });

  it('applies CSS transition on stroke-dashoffset when motion is allowed', () => {
    const { container } = render(<CircularProgress elapsed={30} total={60} />);
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    expect(progressCircle.style.transition).toBe('stroke-dashoffset 0.3s ease');
  });

  it('removes CSS transition when reduced motion is active', () => {
    useReducedMotion.mockReturnValue(true);
    const { container } = render(<CircularProgress elapsed={30} total={60} />);
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    expect(progressCircle.style.transition).toBe('');
  });

  it('uses balanced color (#4ADE80) for the progress stroke', () => {
    const { container } = render(<CircularProgress elapsed={30} total={60} />);
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    expect(progressCircle).toHaveAttribute('stroke', 'var(--color-balanced)');
  });

  it('uses muted color for the background track', () => {
    const { container } = render(<CircularProgress elapsed={30} total={60} />);
    const circles = container.querySelectorAll('circle');
    const trackCircle = circles[0];
    expect(trackCircle).toHaveAttribute('stroke', 'var(--color-text-muted)');
  });

  it('applies additional className when provided', () => {
    render(<CircularProgress elapsed={10} total={60} className="my-custom-class" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.className).toContain('my-custom-class');
  });

  it('renders without additional className when not provided', () => {
    render(<CircularProgress elapsed={10} total={60} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.className).not.toContain('undefined');
  });

  it('shows full ring (offset 0) when elapsed equals total', () => {
    const { container } = render(<CircularProgress elapsed={60} total={60} />);
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    expect(progressCircle).toHaveAttribute('stroke-dashoffset', '0');
  });

  it('shows empty ring (full offset) when elapsed is 0', () => {
    const { container } = render(<CircularProgress elapsed={0} total={60} />);
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    expect(progressCircle).toHaveAttribute('stroke-dashoffset', String(CIRCUMFERENCE));
  });
});

describe('formatTime', () => {
  it('formats 0 seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats 65 seconds as 01:05', () => {
    expect(formatTime(65)).toBe('01:05');
  });

  it('formats 3600 seconds as 60:00', () => {
    expect(formatTime(3600)).toBe('60:00');
  });

  it('handles negative values gracefully', () => {
    expect(formatTime(-10)).toBe('00:00');
  });
});
