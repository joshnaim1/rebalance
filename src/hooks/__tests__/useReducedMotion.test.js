import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { useReducedMotion } from '../useReducedMotion.js';

/**
 * Feature: accessibility-interactive-ui, Property 7: Reduced Motion Disables All Non-Essential Animations
 * For any boolean state of the prefers-reduced-motion media query (true or false),
 * the hook should return that exact boolean value. When the media query changes,
 * the hook should update to reflect the new state.
 *
 * Validates: Requirements 14.1, 14.3
 */

// Helper to create a mock matchMedia object with controllable state
function createMockMatchMedia(initialMatches) {
  const listeners = [];
  const mql = {
    matches: initialMatches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: vi.fn((event, handler) => {
      if (event === 'change') {
        listeners.push(handler);
      }
    }),
    removeEventListener: vi.fn((event, handler) => {
      if (event === 'change') {
        const idx = listeners.indexOf(handler);
        if (idx !== -1) listeners.splice(idx, 1);
      }
    }),
    // Helper to simulate a media query change
    _triggerChange(newMatches) {
      mql.matches = newMatches;
      listeners.forEach((handler) => handler({ matches: newMatches }));
    },
    _listeners: listeners,
  };
  return mql;
}

// Arbitrary for boolean media query state
const matchesArb = fc.boolean();

// Arbitrary for a sequence of boolean state changes (simulating user toggling reduced motion)
const stateSequenceArb = fc.array(fc.boolean(), { minLength: 1, maxLength: 20 });

describe('Feature: accessibility-interactive-ui, Property 7: Reduced Motion Disables All Non-Essential Animations', () => {
  let originalMatchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('hook returns correct boolean matching the initial media query state', () => {
    fc.assert(
      fc.property(matchesArb, (initialMatches) => {
        const mockMql = createMockMatchMedia(initialMatches);
        window.matchMedia = vi.fn(() => mockMql);

        const { result } = renderHook(() => useReducedMotion());

        expect(result.current).toBe(initialMatches);
      }),
      { numRuns: 100 }
    );
  });

  it('hook updates to reflect media query state changes', () => {
    fc.assert(
      fc.property(matchesArb, stateSequenceArb, (initialMatches, stateChanges) => {
        const mockMql = createMockMatchMedia(initialMatches);
        window.matchMedia = vi.fn(() => mockMql);

        const { result } = renderHook(() => useReducedMotion());

        // Verify initial state
        expect(result.current).toBe(initialMatches);

        // Apply each state change and verify the hook updates
        let expectedState = initialMatches;
        for (const newState of stateChanges) {
          act(() => {
            mockMql._triggerChange(newState);
          });
          expectedState = newState;
          expect(result.current).toBe(expectedState);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('hook defaults to false when matchMedia is unavailable', () => {
    fc.assert(
      fc.property(fc.constant(undefined), () => {
        window.matchMedia = undefined;

        const { result } = renderHook(() => useReducedMotion());

        expect(result.current).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('hook cleans up event listener on unmount', () => {
    fc.assert(
      fc.property(matchesArb, (initialMatches) => {
        const mockMql = createMockMatchMedia(initialMatches);
        window.matchMedia = vi.fn(() => mockMql);

        const { unmount } = renderHook(() => useReducedMotion());

        unmount();

        expect(mockMql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      }),
      { numRuns: 100 }
    );
  });
});
