import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import TrendArrow from '../TrendArrow';

/**
 * Feature: accessibility-interactive-ui, Property 11: Trend Arrow Direction Logic
 * For any pair of numeric values (current, previous), the TrendArrow SHALL display
 * the correct arrow direction, color class, and screen-reader-only text.
 *
 * Validates: Requirements 6.3, 7.1, 7.2, 7.3
 */

describe('Feature: accessibility-interactive-ui, Property 11: Trend Arrow Direction Logic', () => {
  it('displays upward arrow with balanced color and correct sr-only text when current > previous', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        // Ensure current > previous
        const current = Math.max(a, b) + 1;
        const previous = Math.min(a, b);

        const { container } = render(<TrendArrow current={current} previous={previous} />);
        const wrapper = container.querySelector('[data-testid="trend-arrow"]');

        // Arrow direction: upward
        const arrowSpan = wrapper.querySelector('[aria-hidden="true"]');
        expect(arrowSpan.textContent).toBe('↑');

        // Color class: text-balanced (green)
        expect(wrapper.className).toContain('text-balanced');

        // Screen-reader text: "improved by X points" (or "point" for 1)
        const srOnly = wrapper.querySelector('.sr-only');
        const diff = current - previous;
        const expectedText = `improved by ${diff} point${diff === 1 ? '' : 's'}`;
        expect(srOnly.textContent).toBe(expectedText);
      }),
      { numRuns: 100 }
    );
  });

  it('displays downward arrow with danger color and correct sr-only text when current < previous', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        // Ensure current < previous
        const current = Math.min(a, b);
        const previous = Math.max(a, b) + 1;

        const { container } = render(<TrendArrow current={current} previous={previous} />);
        const wrapper = container.querySelector('[data-testid="trend-arrow"]');

        // Arrow direction: downward
        const arrowSpan = wrapper.querySelector('[aria-hidden="true"]');
        expect(arrowSpan.textContent).toBe('↓');

        // Color class: text-danger (red)
        expect(wrapper.className).toContain('text-danger');

        // Screen-reader text: "declined by X points" (or "point" for 1)
        const srOnly = wrapper.querySelector('.sr-only');
        const absDiff = Math.abs(current - previous);
        const expectedText = `declined by ${absDiff} point${absDiff === 1 ? '' : 's'}`;
        expect(srOnly.textContent).toBe(expectedText);
      }),
      { numRuns: 100 }
    );
  });

  it('displays horizontal arrow with muted color and "no change" sr-only text when current === previous', () => {
    fc.assert(
      fc.property(fc.integer(), (value) => {
        const { container } = render(<TrendArrow current={value} previous={value} />);
        const wrapper = container.querySelector('[data-testid="trend-arrow"]');

        // Arrow direction: horizontal
        const arrowSpan = wrapper.querySelector('[aria-hidden="true"]');
        expect(arrowSpan.textContent).toBe('→');

        // Color class: text-text-muted
        expect(wrapper.className).toContain('text-text-muted');

        // Screen-reader text: "no change"
        const srOnly = wrapper.querySelector('.sr-only');
        expect(srOnly.textContent).toBe('no change');
      }),
      { numRuns: 100 }
    );
  });
});
