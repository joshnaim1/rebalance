import { render, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: accessibility-interactive-ui, Property 15: Tab Navigation Accessibility
 * For any tab in the navigation bar, the tab SHALL render an SVG icon sized 16×16 pixels
 * with aria-hidden="true". When the tab is active, it SHALL have a background highlight
 * class applied. The text label SHALL serve as the accessible name.
 *
 * Validates: Requirements 10.1, 10.2, 10.3
 */

/**
 * Feature: accessibility-interactive-ui, Property 17: Modal Focus Trap and ARIA Attributes
 * For any open modal dialog (Getting_Started_Wizard), the dialog element SHALL have
 * aria-modal="true", and SHALL have aria-labelledby referencing a valid heading element
 * within the modal.
 *
 * Validates: Requirements 12.6, 12.7
 */

/**
 * Feature: accessibility-interactive-ui, Property 23: Wizard Progress Indicator Accuracy
 * For any step N in the Getting_Started_Wizard (total T steps), the progress indicator
 * SHALL display the correct current step number and total step count.
 *
 * Validates: Requirements 12.3
 */

// Mock useSerial hook
vi.mock('../../hooks/useSerial', () => ({
  useSerial: vi.fn(() => ({
    connected: false,
    demoMode: false,
    boardConnected: false,
    values: { left: 0, right: 0 },
    ready: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    enableDemo: vi.fn(),
    disableDemo: vi.fn(),
    toggleDemo: vi.fn(),
  })),
}));

// Mock useReducedMotion hook
vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

// Mock storage utilities
vi.mock('../../utils/storage', () => ({
  getCalibration: vi.fn(() => null),
  getProfile: vi.fn(() => ({ name: 'Test User' })),
  saveProfile: vi.fn(),
  getSessions: vi.fn(() => []),
  saveSession: vi.fn(),
}));

// Mock child components to simplify rendering
vi.mock('../BalanceMeter', () => ({ default: () => <div data-testid="balance-meter">BalanceMeter</div> }));
vi.mock('../BalanceGame', () => ({ default: () => <div data-testid="balance-game">BalanceGame</div> }));
vi.mock('../SessionLog', () => ({ default: () => <div data-testid="session-log">SessionLog</div> }));
vi.mock('../ProgressChart', () => ({ default: () => <div data-testid="progress-chart">ProgressChart</div> }));
vi.mock('../PatientProfile', () => ({ default: () => <div data-testid="patient-profile">PatientProfile</div> }));
vi.mock('../SerialConnect', () => ({ default: () => <span>SerialConnect</span> }));
vi.mock('../Calibration', () => ({ default: () => <div>Calibration</div> }));

import App from '../../App';
import GettingStartedWizard from '../GettingStartedWizard';
import { getProfile } from '../../utils/storage';

// Tab IDs matching the App component
const TAB_IDS = ['balance', 'game', 'sessions', 'progress', 'profile'];
const TAB_LABELS = ['Live Balance', 'Games', 'Sessions', 'Progress', 'Profile'];

// Arbitrary: pick a tab index (0-4)
const tabIndexArb = fc.integer({ min: 0, max: TAB_IDS.length - 1 });

describe('Feature: accessibility-interactive-ui, Property 15: Tab Navigation Accessibility', () => {
  beforeEach(() => {
    getProfile.mockReturnValue({ name: 'Test User' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('each tab has a 16x16 SVG icon with aria-hidden="true" and active tab has highlight class', () => {
    fc.assert(
      fc.property(tabIndexArb, (activeIndex) => {
        cleanup();
        const { container } = render(<App />);

        // Find all tab buttons in the nav
        const nav = container.querySelector('nav');
        expect(nav).not.toBeNull();

        const tabButtons = nav.querySelectorAll('button');
        expect(tabButtons.length).toBe(TAB_IDS.length);

        tabButtons.forEach((button, idx) => {
          // Each tab should have an SVG icon
          const svg = button.querySelector('svg');
          expect(svg).not.toBeNull();

          // SVG should be 16x16
          expect(svg.getAttribute('width')).toBe('16');
          expect(svg.getAttribute('height')).toBe('16');

          // SVG should have aria-hidden="true"
          expect(svg.getAttribute('aria-hidden')).toBe('true');

          // Text label should be present as accessible name
          expect(button.textContent).toContain(TAB_LABELS[idx]);
        });

        // The first tab (balance) is active by default — verify it has highlight class
        const firstTab = tabButtons[0];
        expect(firstTab.className).toContain('bg-balanced-soft');
      }),
      { numRuns: 100 }
    );
  });

  it('when a tab is active, it has the bg-balanced-soft highlight class', () => {
    fc.assert(
      fc.property(tabIndexArb, (activeIndex) => {
        cleanup();
        const { container } = render(<App />);

        const nav = container.querySelector('nav');
        const tabButtons = nav.querySelectorAll('button');

        // Click the target tab to make it active
        act(() => {
          fireEvent.click(tabButtons[activeIndex]);
        });

        // Re-query after state update
        const updatedNav = container.querySelector('nav');
        const updatedButtons = updatedNav.querySelectorAll('button');

        // The active tab should have the highlight class
        expect(updatedButtons[activeIndex].className).toContain('bg-balanced-soft');

        // Other tabs should NOT have the highlight class
        updatedButtons.forEach((button, idx) => {
          if (idx !== activeIndex) {
            expect(button.className).not.toContain('bg-balanced-soft');
          }
        });
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: accessibility-interactive-ui, Property 17: Modal Focus Trap and ARIA Attributes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('wizard has aria-modal="true" and aria-labelledby referencing a valid heading', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();
        const { container } = render(
          <GettingStartedWizard onComplete={vi.fn()} />
        );

        // Find the dialog element
        const dialog = container.querySelector('[role="dialog"]');
        expect(dialog).toBeTruthy();

        // Verify aria-modal="true"
        expect(dialog.getAttribute('aria-modal')).toBe('true');

        // Verify aria-labelledby is set
        const labelledBy = dialog.getAttribute('aria-labelledby');
        expect(labelledBy).toBeTruthy();

        // Verify the referenced heading element exists within the dialog
        const heading = dialog.querySelector(`#${labelledBy}`);
        expect(heading).toBeTruthy();

        // Verify it's actually a heading element
        expect(heading.tagName.toLowerCase()).toBe('h2');
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: accessibility-interactive-ui, Property 23: Wizard Progress Indicator Accuracy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('progress shows correct step N of T for any wizard step', () => {
    // Wizard has 5 steps (0-4), total is always 5
    const stepArb = fc.integer({ min: 0, max: 4 });
    const TOTAL_STEPS = 5;

    fc.assert(
      fc.property(stepArb, (stepIndex) => {
        cleanup();
        const { container } = render(
          <GettingStartedWizard onComplete={vi.fn()} />
        );

        // Navigate to the desired step by clicking Next
        for (let i = 0; i < stepIndex; i++) {
          const buttons = container.querySelectorAll('[role="dialog"] button');
          // Find the "Next" button (last button in the navigation area)
          const nextButton = Array.from(buttons).find(
            (btn) => btn.textContent === 'Next'
          );
          if (nextButton) {
            act(() => {
              fireEvent.click(nextButton);
            });
          }
        }

        // Verify the progress indicator shows the correct step
        const expectedText = `Step ${stepIndex + 1} of ${TOTAL_STEPS}`;
        // The progress indicator is the first <p> element in the dialog
        const dialog = container.querySelector('[role="dialog"]');
        const progressParagraphs = dialog.querySelectorAll('p');
        // Find the progress text that matches "Step X of Y" pattern
        const progressElement = Array.from(progressParagraphs).find(
          (p) => p.textContent.match(/Step \d+ of \d+/)
        );
        expect(progressElement).toBeTruthy();
        expect(progressElement.textContent).toBe(expectedText);
      }),
      { numRuns: 100 }
    );
  });
});
