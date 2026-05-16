import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import FeelingCards, { PAIN_OPTIONS, FATIGUE_OPTIONS } from '../FeelingCards';

/**
 * Feature: accessibility-interactive-ui, Property 22: Feeling Card Minimum Tap Target
 * For any rendered FeelingCard component, its interactive area SHALL have minimum
 * dimensions of 44×44 pixels, meeting WCAG touch target guidelines.
 *
 * Validates: Requirements 5.3
 */

// Arbitrary: pick an options set and a valid selected value (including null)
const feelingCardInputArb = fc
  .constantFrom(PAIN_OPTIONS, FATIGUE_OPTIONS)
  .chain((options) => {
    const selectedArb = fc.constantFrom(null, ...options.map((o) => o.value));
    const label = options === PAIN_OPTIONS ? 'Pain Level' : 'Fatigue Level';
    return selectedArb.map((selected) => ({ options, selected, label }));
  });

describe('Feature: accessibility-interactive-ui, Property 22: Feeling Card Minimum Tap Target', () => {
  it('every feeling card button has minimum 44x44px tap target classes', () => {
    fc.assert(
      fc.property(feelingCardInputArb, ({ options, selected, label }) => {
        const { container } = render(
          <FeelingCards
            options={options}
            selected={selected}
            onSelect={() => {}}
            label={label}
          />
        );

        const buttons = container.querySelectorAll('button');

        // There should be one button per option
        expect(buttons.length).toBe(options.length);

        // Each button must have the minimum 44x44px tap target size classes
        buttons.forEach((button) => {
          expect(button.className).toContain('min-w-[44px]');
          expect(button.className).toContain('min-h-[44px]');
        });
      }),
      { numRuns: 100 }
    );
  });
});
