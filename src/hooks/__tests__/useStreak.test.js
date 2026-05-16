import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { useStreak } from '../useStreak.js';

/**
 * Feature: accessibility-interactive-ui, Property 4: Streak Counter Accuracy
 * For any sequence of zone readings, streak equals consecutive seconds in 'balanced'
 * and resets on zone change.
 *
 * Validates: Requirements 3.1
 */

/**
 * Feature: accessibility-interactive-ui, Property 5: Encouragement Message Thresholds
 * For any streak duration, correct message is returned based on threshold rules.
 *
 * Validates: Requirements 3.2, 3.3
 */

// Extract getMessage logic for pure function testing
function getMessage(seconds) {
  if (seconds >= 15) return "Amazing focus!";
  if (seconds >= 5) return "Great balance!";
  return null;
}

// Zone arbitrary - generates valid zone values
const zoneArb = fc.constantFrom('balanced', 'warning', 'danger');

// Sequence of zone readings over time (each entry represents 1 second)
const zoneSequenceArb = fc.array(zoneArb, { minLength: 1, maxLength: 50 });

// Arbitrary for streak duration in seconds (non-negative integers)
const streakDurationArb = fc.nat({ max: 300 });

describe('Feature: accessibility-interactive-ui, Property 4: Streak Counter Accuracy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('streak equals consecutive seconds in balanced zone and resets on zone change', () => {
    fc.assert(
      fc.property(zoneSequenceArb, (zones) => {
        const { result, rerender } = renderHook(
          ({ zone }) => useStreak(zone),
          { initialProps: { zone: zones[0] } }
        );

        // Simulate the sequence of zone readings, each 1 second apart
        let expectedStreak = 0;

        for (let i = 0; i < zones.length; i++) {
          if (i > 0) {
            rerender({ zone: zones[i] });
          }

          if (zones[i] === 'balanced') {
            // Advance 1 second to tick the interval
            act(() => {
              vi.advanceTimersByTime(1000);
            });
            expectedStreak++;
          } else {
            // Zone is not balanced - streak resets
            expectedStreak = 0;
          }
        }

        expect(result.current.seconds).toBe(expectedStreak);
      }),
      { numRuns: 100 }
    );
  });

  it('streak resets to zero when zone changes away from balanced', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 20 }),
        fc.constantFrom('warning', 'danger'),
        (balancedSeconds, nonBalancedZone) => {
          const { result, rerender } = renderHook(
            ({ zone }) => useStreak(zone),
            { initialProps: { zone: 'balanced' } }
          );

          // Accumulate streak
          for (let i = 0; i < balancedSeconds; i++) {
            act(() => {
              vi.advanceTimersByTime(1000);
            });
          }

          // Change zone away from balanced
          rerender({ zone: nonBalancedZone });

          expect(result.current.seconds).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: accessibility-interactive-ui, Property 5: Encouragement Message Thresholds', () => {
  it('for any streak duration, correct message is returned based on threshold rules', () => {
    fc.assert(
      fc.property(streakDurationArb, (seconds) => {
        const message = getMessage(seconds);

        if (seconds >= 15) {
          expect(message).toBe("Amazing focus!");
        } else if (seconds >= 5) {
          expect(message).toBe("Great balance!");
        } else {
          expect(message).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });

  it('message thresholds are correctly applied via the hook', () => {
    vi.useFakeTimers();

    fc.assert(
      fc.property(
        fc.nat({ max: 30 }),
        (targetSeconds) => {
          const { result } = renderHook(
            ({ zone }) => useStreak(zone),
            { initialProps: { zone: 'balanced' } }
          );

          // Advance time to reach target seconds
          for (let i = 0; i < targetSeconds; i++) {
            act(() => {
              vi.advanceTimersByTime(1000);
            });
          }

          const { seconds, message } = result.current;
          expect(seconds).toBe(targetSeconds);

          if (targetSeconds >= 15) {
            expect(message).toBe("Amazing focus!");
          } else if (targetSeconds >= 5) {
            expect(message).toBe("Great balance!");
          } else {
            expect(message).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );

    vi.useRealTimers();
  });
});
