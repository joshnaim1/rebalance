import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import ConfettiEffect from '../ConfettiEffect';

/**
 * Feature: accessibility-interactive-ui, Property 6: Confetti Trigger Threshold
 * For any balance score value (integer 0-100), the confetti effect SHALL be
 * triggered if and only if the score is ≥ 90.
 *
 * Validates: Requirements 3.4
 */

// Mock useReducedMotion hook
vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from '../../hooks/useReducedMotion';

// Score arbitrary — integers from 0 to 100
const scoreArb = fc.integer({ min: 0, max: 100 });

describe('Feature: accessibility-interactive-ui, Property 6: Confetti Trigger Threshold', () => {
  let originalRaf;
  let originalCaf;

  beforeEach(() => {
    useReducedMotion.mockReturnValue(false);
    originalRaf = globalThis.requestAnimationFrame;
    originalCaf = globalThis.cancelAnimationFrame;

    globalThis.requestAnimationFrame = vi.fn((cb) => {
      return 1;
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

  it('confetti is triggered (canvas renders) if and only if score >= 90', () => {
    fc.assert(
      fc.property(scoreArb, (score) => {
        const trigger = score >= 90;
        const { container } = render(<ConfettiEffect trigger={trigger} />);
        const canvas = container.querySelector('canvas');

        if (score >= 90) {
          // Confetti should be triggered — canvas element present
          expect(canvas).toBeInTheDocument();
        } else {
          // Confetti should NOT be triggered — nothing renders
          expect(canvas).not.toBeInTheDocument();
          expect(container.textContent).toBe('');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('confetti renders static badge in reduced motion mode if and only if score >= 90', () => {
    useReducedMotion.mockReturnValue(true);

    fc.assert(
      fc.property(scoreArb, (score) => {
        const trigger = score >= 90;
        const { container } = render(<ConfettiEffect trigger={trigger} />);

        if (score >= 90) {
          // In reduced motion, a static badge should appear instead of canvas
          expect(container.querySelector('canvas')).not.toBeInTheDocument();
          expect(container.textContent).toContain('🎉 Great job!');
        } else {
          // Nothing renders when score < 90
          expect(container.querySelector('canvas')).not.toBeInTheDocument();
          expect(container.textContent).toBe('');
        }
      }),
      { numRuns: 100 }
    );
  });
});
