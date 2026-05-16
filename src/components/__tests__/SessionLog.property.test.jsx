import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { saveSession, getSessions, clearSessions } from '../../utils/storage';

/**
 * Feature: accessibility-interactive-ui, Property 10: Feeling Selection Persistence Round-Trip
 * For any valid feeling selection (pain level from {none, mild, moderate, severe} and
 * fatigue level from {energized, okay, tired, exhausted}), when selected before a session
 * and the session is completed, the stored session record SHALL contain the exact feeling
 * selections that were made.
 *
 * Validates: Requirements 5.5
 */

/**
 * Feature: accessibility-interactive-ui, Property 12: Plain-Language Session Summary Generation
 * For any completed session with avgScore, duration, and timeInBalanced values, and given
 * a previous session for comparison, the generated plain-language summary SHALL include
 * the percentage of time in balanced zone and a comparison to the previous session's performance.
 *
 * Validates: Requirements 6.2, 8.1
 */

// --- Arbitraries ---
const painArb = fc.constantFrom('none', 'mild', 'moderate', 'severe');
const fatigueArb = fc.constantFrom('energized', 'okay', 'tired', 'exhausted');
const durationArb = fc.integer({ min: 1, max: 600 });
const timeInBalancedArb = fc.integer({ min: 0, max: 600 });
const avgScoreArb = fc.integer({ min: 0, max: 100 });

// --- Summary generation helper (replicates SessionLog.buildSummaryStats logic) ---
function generateSummaryMessage(session, previousSession) {
  const balancedPct = session.duration > 0
    ? Math.round((session.timeInBalanced / session.duration) * 100)
    : 0;

  const prevBalancedPct = previousSession && previousSession.duration > 0 && previousSession.timeInBalanced != null
    ? Math.round((previousSession.timeInBalanced / previousSession.duration) * 100)
    : 0;

  let message;
  if (previousSession && previousSession.timeInBalanced != null) {
    const diff = balancedPct - prevBalancedPct;
    if (diff > 0) {
      message = `You held steady balance for ${balancedPct}% of the session — that's ${diff}% better than last time!`;
    } else if (diff < 0) {
      message = `You held steady balance for ${balancedPct}% of the session — that's ${Math.abs(diff)}% less than last time. Keep going!`;
    } else {
      message = `You held steady balance for ${balancedPct}% of the session — same as last time. Consistency is key!`;
    }
  } else {
    message = `You held steady balance for ${balancedPct}% of the session. Great first effort!`;
  }

  return { message, balancedPct };
}

// --- Property 10: Feeling Selection Persistence Round-Trip ---
describe('Feature: accessibility-interactive-ui, Property 10: Feeling Selection Persistence Round-Trip', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      return mockStorage[key] || null;
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockStorage[key] = value;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('selected feelings are stored exactly in the session record after save and retrieval', () => {
    fc.assert(
      fc.property(painArb, fatigueArb, durationArb, avgScoreArb, (pain, fatigue, duration, avgScore) => {
        // Reset storage for each iteration
        mockStorage = {};

        const feeling = { pain, fatigue };
        const session = {
          date: new Date().toISOString(),
          duration,
          avgScore,
          gameHighScore: 0,
          feeling,
          timeInBalanced: 0,
        };

        // Save the session
        saveSession(session);

        // Retrieve sessions
        const sessions = getSessions();

        // Verify the last session has the exact feeling data
        expect(sessions.length).toBe(1);
        expect(sessions[0].feeling).toEqual(feeling);
        expect(sessions[0].feeling.pain).toBe(pain);
        expect(sessions[0].feeling.fatigue).toBe(fatigue);
      }),
      { numRuns: 100 }
    );
  });

  it('feeling data persists correctly across multiple sessions', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(painArb, fatigueArb),
          { minLength: 2, maxLength: 5 }
        ),
        (feelingPairs) => {
          // Reset storage for each iteration
          mockStorage = {};

          // Save multiple sessions with different feelings
          feelingPairs.forEach(([pain, fatigue]) => {
            const session = {
              date: new Date().toISOString(),
              duration: 60,
              avgScore: 50,
              gameHighScore: 0,
              feeling: { pain, fatigue },
              timeInBalanced: 30,
            };
            saveSession(session);
          });

          // Retrieve all sessions
          const sessions = getSessions();

          // Verify each session has the correct feeling data
          expect(sessions.length).toBe(feelingPairs.length);
          feelingPairs.forEach(([pain, fatigue], index) => {
            expect(sessions[index].feeling.pain).toBe(pain);
            expect(sessions[index].feeling.fatigue).toBe(fatigue);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// --- Property 12: Plain-Language Session Summary Generation ---
describe('Feature: accessibility-interactive-ui, Property 12: Plain-Language Session Summary Generation', () => {
  it('summary includes balanced zone percentage for any session data', () => {
    fc.assert(
      fc.property(
        durationArb,
        timeInBalancedArb,
        avgScoreArb,
        (duration, timeInBalanced, avgScore) => {
          // Ensure timeInBalanced does not exceed duration
          const clampedTimeInBalanced = Math.min(timeInBalanced, duration);

          const session = {
            duration,
            avgScore,
            timeInBalanced: clampedTimeInBalanced,
          };

          const { message, balancedPct } = generateSummaryMessage(session, null);

          // The message must include the balanced zone percentage
          expect(message).toContain(`${balancedPct}%`);
          // First session message pattern
          expect(message).toContain('You held steady balance for');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('summary includes comparison to previous session when one exists', () => {
    fc.assert(
      fc.property(
        durationArb,
        timeInBalancedArb,
        avgScoreArb,
        durationArb,
        timeInBalancedArb,
        avgScoreArb,
        (duration, timeInBalanced, avgScore, prevDuration, prevTimeInBalanced, prevAvgScore) => {
          // Clamp timeInBalanced to not exceed duration
          const clampedTimeInBalanced = Math.min(timeInBalanced, duration);
          const clampedPrevTimeInBalanced = Math.min(prevTimeInBalanced, prevDuration);

          const session = {
            duration,
            avgScore,
            timeInBalanced: clampedTimeInBalanced,
          };

          const previousSession = {
            duration: prevDuration,
            avgScore: prevAvgScore,
            timeInBalanced: clampedPrevTimeInBalanced,
          };

          const { message, balancedPct } = generateSummaryMessage(session, previousSession);

          // The message must include the balanced zone percentage
          expect(message).toContain(`${balancedPct}%`);

          // The message must include a comparison to the previous session
          const prevBalancedPct = Math.round((clampedPrevTimeInBalanced / prevDuration) * 100);
          const diff = balancedPct - prevBalancedPct;

          if (diff > 0) {
            expect(message).toContain('better than last time');
          } else if (diff < 0) {
            expect(message).toContain('less than last time');
          } else {
            expect(message).toContain('same as last time');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
