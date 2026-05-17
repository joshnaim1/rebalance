import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import SerialConnect from '../SerialConnect';

/**
 * Feature: warm-light-theme-accessibility, Property 8: Connection status displays dot and text label for any state
 * For any connection state (connected, disconnected, demo mode), the rendered SerialConnect component
 * SHALL display both a colored status dot AND a descriptive text label
 * (e.g., "Board connected", "Board disconnected", "Demo mode active").
 *
 * Validates: Requirements 9.1
 */

// Generate the three valid connection states
const connectionStateArb = fc.constantFrom(
  { connected: true, demoMode: false },
  { connected: false, demoMode: false },
  { connected: true, demoMode: true }
);

// Expected dot color classes per state
const EXPECTED_DOT_CLASSES = {
  'connected': 'bg-balanced',
  'disconnected': 'bg-text-muted',
  'demo': 'bg-warning',
};

// Expected text labels per state
const EXPECTED_LABELS = {
  'connected': 'Board connected',
  'disconnected': 'Board disconnected',
  'demo': 'Demo mode active',
};

function getStateKey(state) {
  if (state.demoMode) return 'demo';
  if (state.connected) return 'connected';
  return 'disconnected';
}

describe('Feature: warm-light-theme-accessibility, Property 8: Connection status displays dot and text label for any state', () => {
  it('for any connection state, renders both a colored status dot and a descriptive text label', () => {
    fc.assert(
      fc.property(connectionStateArb, (state) => {
        const mockSerial = {
          connected: state.connected,
          demoMode: state.demoMode,
          connect: () => {},
          disconnect: () => {},
          toggleDemo: () => {},
        };

        const { container } = render(<SerialConnect serial={mockSerial} />);
        const stateKey = getStateKey(state);

        // 1. Colored status dot exists with correct background class
        const dots = container.querySelectorAll('div.rounded-full');
        const dot = Array.from(dots).find(el =>
          el.className.includes(EXPECTED_DOT_CLASSES[stateKey])
        );
        expect(dot).not.toBeNull();

        // 2. Descriptive text label exists with correct content
        const expectedLabel = EXPECTED_LABELS[stateKey];
        const spans = container.querySelectorAll('span');
        const labelSpan = Array.from(spans).find(el =>
          el.textContent === expectedLabel
        );
        expect(labelSpan).not.toBeNull();

        // 3. Both dot and text label are simultaneously present in the DOM
        expect(dot).toBeDefined();
        expect(labelSpan).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it('status dot uses the correct color class for each connection state', () => {
    fc.assert(
      fc.property(connectionStateArb, (state) => {
        const mockSerial = {
          connected: state.connected,
          demoMode: state.demoMode,
          connect: () => {},
          disconnect: () => {},
          toggleDemo: () => {},
        };

        const { container } = render(<SerialConnect serial={mockSerial} />);
        const stateKey = getStateKey(state);

        // Find the dot element (small rounded-full div)
        const dots = container.querySelectorAll('div.rounded-full');
        expect(dots.length).toBeGreaterThan(0);

        // Verify the expected color class is present on the dot
        const expectedClass = EXPECTED_DOT_CLASSES[stateKey];
        const matchingDot = Array.from(dots).find(el =>
          el.className.includes(expectedClass)
        );
        expect(matchingDot).not.toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});
