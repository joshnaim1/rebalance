import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: accessibility-interactive-ui, Property 3: Balance Puck Glow Matches Zone
 * For any zone value, puck glow color matches designated zone color.
 *
 * Validates: Requirements 2.2
 */

/**
 * Feature: accessibility-interactive-ui, Property 14: ARIA Live Regions for Dynamic Content
 * Zone status and score wrapped in aria-live="polite" element.
 *
 * Validates: Requirements 3.7, 15.1
 */

// Mock useReducedMotion hook
vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

// Mock useStreak hook
vi.mock('../../hooks/useStreak', () => ({
  useStreak: vi.fn(() => ({ seconds: 0, message: null })),
}));

// Mock ConfettiEffect to avoid canvas issues in tests
vi.mock('../ConfettiEffect', () => ({
  default: () => null,
}));

import BalanceMeter from '../BalanceMeter';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useStreak } from '../../hooks/useStreak';

// Zone arbitrary — generates valid zone values
const zoneArb = fc.constantFrom('balanced', 'warning', 'danger');

// Score arbitrary — integers from 0 to 100
const scoreArb = fc.integer({ min: 0, max: 100 });

// Ratio arbitrary — float between 0 and 1 for puck position
const ratioArb = fc.double({ min: 0, max: 1, noNaN: true });

// Helper to create a balance object for testing
function createBalance(zone, score = 75) {
  return {
    isActive: true,
    zone,
    score,
    ratio: 0.5,
    percentage: { left: 50, right: 50 },
  };
}

// Expected glow shadow classes per zone
const ZONE_GLOW_CLASSES = {
  balanced: 'shadow-[0_0_12px_rgba(74,222,128,0.6)]',
  warning: 'shadow-[0_0_12px_rgba(251,191,36,0.6)]',
  danger: 'shadow-[0_0_12px_rgba(248,113,113,0.6)]',
};

describe('Feature: accessibility-interactive-ui, Property 3: Balance Puck Glow Matches Zone', () => {
  beforeEach(() => {
    useReducedMotion.mockReturnValue(false);
    useStreak.mockReturnValue({ seconds: 0, message: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('for any zone value, puck glow color matches designated zone color', () => {
    fc.assert(
      fc.property(zoneArb, scoreArb, ratioArb, (zone, score, ratio) => {
        const balance = {
          isActive: true,
          zone,
          score,
          ratio,
          percentage: { left: Math.round(ratio * 100), right: Math.round((1 - ratio) * 100) },
        };

        const { container } = render(<BalanceMeter balance={balance} connected={true} />);

        // Find the puck element — it's the w-5 h-5 rounded-full element
        const puck = container.querySelector('.w-5.h-5.rounded-full');
        expect(puck).not.toBeNull();

        // Verify the puck has the correct glow shadow class for the zone
        const expectedGlow = ZONE_GLOW_CLASSES[zone];
        expect(puck.className).toContain(expectedGlow);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: accessibility-interactive-ui, Property 14: ARIA Live Regions for Dynamic Content', () => {
  beforeEach(() => {
    useReducedMotion.mockReturnValue(false);
    useStreak.mockReturnValue({ seconds: 0, message: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('zone status and score are wrapped in aria-live="polite" elements', () => {
    fc.assert(
      fc.property(zoneArb, scoreArb, (zone, score) => {
        const balance = createBalance(zone, score);

        const { container } = render(<BalanceMeter balance={balance} connected={true} />);

        // Find all aria-live="polite" regions
        const liveRegions = container.querySelectorAll('[aria-live="polite"]');
        expect(liveRegions.length).toBeGreaterThanOrEqual(2);

        // Verify aria-atomic="true" is set on live regions
        liveRegions.forEach((region) => {
          expect(region.getAttribute('aria-atomic')).toBe('true');
        });

        // Verify the score is contained within an aria-live region
        const scoreRegion = Array.from(liveRegions).find((region) =>
          region.textContent.includes('Balance Score')
        );
        expect(scoreRegion).not.toBeUndefined();

        // Verify the zone status is contained within an aria-live region
        const zoneRegion = Array.from(liveRegions).find((region) => {
          const text = region.textContent.toLowerCase();
          return text.includes('balanced') || text.includes('warning') || text.includes('danger');
        });
        expect(zoneRegion).not.toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });
});
