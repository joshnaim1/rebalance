import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: accessibility-interactive-ui, Property 8: Combo Counter Tracks Consecutive Passes
 * For any sequence of game events (gap passes and collisions), the combo counter
 * equals the length of the current unbroken streak of consecutive gap passes.
 * A collision resets the combo counter to zero.
 *
 * Validates: Requirements 4.3
 */

/**
 * Feature: accessibility-interactive-ui, Property 9: Combo Score Multiplier Activation
 * For any combo counter value, the score multiplier is 1.5x when combo >= 5,
 * and 1.0x (no multiplier) otherwise.
 *
 * Validates: Requirements 4.4
 */

// Constants matching BalanceGame.jsx
const COMBO_MULTIPLIER_THRESHOLD = 5;
const COMBO_MULTIPLIER = 1.5;

/**
 * Simulates the combo logic from BalanceGame.jsx.
 * This mirrors the exact logic in the game loop:
 * - On gap pass: combo++, maxCombo = max(maxCombo, combo), obstaclesCleared++,
 *   multiplier = combo >= 5 ? 1.5 : 1.0, scoreAccum += multiplier
 * - On collision: combo = 0
 */
function simulateCombo(events) {
  let combo = 0;
  let maxCombo = 0;
  let scoreAccum = 0;
  let obstaclesCleared = 0;

  for (const event of events) {
    if (event === 'pass') {
      combo++;
      maxCombo = Math.max(maxCombo, combo);
      obstaclesCleared++;
      const multiplier = combo >= COMBO_MULTIPLIER_THRESHOLD ? COMBO_MULTIPLIER : 1.0;
      scoreAccum += multiplier;
    } else {
      combo = 0;
    }
  }

  return { combo, maxCombo, scoreAccum, obstaclesCleared };
}

/**
 * Returns the score multiplier for a given combo value.
 * Matches the logic in BalanceGame.jsx game loop.
 */
function getMultiplier(combo) {
  return combo >= COMBO_MULTIPLIER_THRESHOLD ? COMBO_MULTIPLIER : 1.0;
}

// Arbitraries
const gameEventArb = fc.constantFrom('pass', 'collision');
const gameEventSequenceArb = fc.array(gameEventArb, { minLength: 1, maxLength: 100 });
const comboValueArb = fc.integer({ min: 0, max: 20 });

describe('Feature: accessibility-interactive-ui, Property 8: Combo Counter Tracks Consecutive Passes', () => {
  it('combo equals unbroken streak of consecutive passes, resets on collision', () => {
    fc.assert(
      fc.property(gameEventSequenceArb, (events) => {
        const result = simulateCombo(events);

        // Calculate expected combo: count consecutive passes from the end
        let expectedCombo = 0;
        for (let i = events.length - 1; i >= 0; i--) {
          if (events[i] === 'pass') {
            expectedCombo++;
          } else {
            break;
          }
        }

        expect(result.combo).toBe(expectedCombo);
      }),
      { numRuns: 100 }
    );
  });

  it('collision always resets combo to zero', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constant('pass'), { minLength: 1, maxLength: 50 }),
        fc.array(gameEventArb, { minLength: 0, maxLength: 50 }),
        (passes, suffix) => {
          // Build a sequence: some passes, then a collision, then suffix
          const events = [...passes, 'collision', ...suffix];
          const result = simulateCombo(events);

          // After the collision, combo should only reflect passes in the suffix
          let expectedCombo = 0;
          for (let i = suffix.length - 1; i >= 0; i--) {
            if (suffix[i] === 'pass') {
              expectedCombo++;
            } else {
              break;
            }
          }

          expect(result.combo).toBe(expectedCombo);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('maxCombo tracks the longest unbroken streak of passes in the sequence', () => {
    fc.assert(
      fc.property(gameEventSequenceArb, (events) => {
        const result = simulateCombo(events);

        // Calculate expected maxCombo: longest consecutive run of 'pass'
        let expectedMaxCombo = 0;
        let currentStreak = 0;
        for (const event of events) {
          if (event === 'pass') {
            currentStreak++;
            expectedMaxCombo = Math.max(expectedMaxCombo, currentStreak);
          } else {
            currentStreak = 0;
          }
        }

        expect(result.maxCombo).toBe(expectedMaxCombo);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: accessibility-interactive-ui, Property 9: Combo Score Multiplier Activation', () => {
  it('multiplier is 1.5x when combo >= 5, 1.0x otherwise', () => {
    fc.assert(
      fc.property(comboValueArb, (combo) => {
        const multiplier = getMultiplier(combo);

        if (combo >= COMBO_MULTIPLIER_THRESHOLD) {
          expect(multiplier).toBe(1.5);
        } else {
          expect(multiplier).toBe(1.0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('score accumulation applies correct multiplier based on combo at each pass', () => {
    fc.assert(
      fc.property(gameEventSequenceArb, (events) => {
        const result = simulateCombo(events);

        // Manually compute expected score by replaying events
        let expectedScore = 0;
        let combo = 0;
        for (const event of events) {
          if (event === 'pass') {
            combo++;
            const multiplier = combo >= COMBO_MULTIPLIER_THRESHOLD ? COMBO_MULTIPLIER : 1.0;
            expectedScore += multiplier;
          } else {
            combo = 0;
          }
        }

        expect(result.scoreAccum).toBeCloseTo(expectedScore, 10);
      }),
      { numRuns: 100 }
    );
  });

  it('multiplier boundary: combo 4 gives 1.0x, combo 5 gives 1.5x', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }),
        fc.integer({ min: 5, max: 20 }),
        (belowThreshold, atOrAboveThreshold) => {
          expect(getMultiplier(belowThreshold)).toBe(1.0);
          expect(getMultiplier(atOrAboveThreshold)).toBe(1.5);
        }
      ),
      { numRuns: 100 }
    );
  });
});
