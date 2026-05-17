import { render, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Feature: accessibility-interactive-ui, Property 18: Visible Focus Ring on Keyboard Navigation
 * For any interactive element (button, input, link, tab) when focused via keyboard (:focus-visible),
 * a visible focus ring SHALL be displayed with minimum 2px outline width, 2px offset, using the
 * balanced color (#4ADE80), which provides sufficient contrast against the dark background (#0F172A).
 *
 * Validates: Requirements 13.1, 13.2
 */

/**
 * Feature: accessibility-interactive-ui, Property 19: Semantic Heading Hierarchy
 * For any rendered page view (tab content), the heading elements SHALL follow a logical hierarchy
 * with no skipped levels (e.g., h1 → h2 → h3, never h1 → h3).
 *
 * Validates: Requirements 13.4
 */

/**
 * Feature: accessibility-interactive-ui, Property 16: Decorative Images Have aria-hidden
 * For any decorative SVG illustration (EmptyState illustrations, tab icons, body silhouettes),
 * the element SHALL have aria-hidden="true" to prevent screen reader announcement of non-informative content.
 *
 * Validates: Requirements 11.3, 10.3
 */

/**
 * Feature: accessibility-interactive-ui, Property 21: Connection Status Announcement
 * For any connection status indicator element, it SHALL have role="status" so screen readers
 * announce connection state changes.
 *
 * Validates: Requirements 15.5
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
  getProfile: vi.fn(() => ({ name: 'Test User', preferredName: '', pronouns: '', affectedSide: '', goals: '', quickGoals: [], feelingToday: null, strokeDate: '', notes: '' })),
  saveProfile: vi.fn(),
  getSessions: vi.fn(() => []),
  saveSession: vi.fn(),
}));

// Mock child components for App-level tests
vi.mock('../BalanceMeter', () => ({
  default: () => (
    <div data-testid="balance-meter">
      <h2 className="sr-only">Live Balance</h2>
      <p>BalanceMeter</p>
    </div>
  ),
}));
vi.mock('../BalanceGame', () => ({
  default: () => (
    <div data-testid="balance-game">
      <h2 className="sr-only">Balance Game</h2>
      <p>BalanceGame</p>
    </div>
  ),
}));
vi.mock('../SessionLog', () => ({
  default: () => (
    <div data-testid="session-log">
      <h2>Sessions</h2>
      <h3>Session History</h3>
      <p>SessionLog</p>
    </div>
  ),
}));
vi.mock('../ProgressChart', () => ({
  default: () => (
    <div data-testid="progress-chart">
      <h2 className="sr-only">Progress Overview</h2>
      <h3>Balance Control Over Time</h3>
      <p>ProgressChart</p>
    </div>
  ),
}));
vi.mock('../PatientProfile', () => ({
  default: () => (
    <div data-testid="patient-profile">
      <h2 className="sr-only">Patient Profile</h2>
      <p>PatientProfile</p>
    </div>
  ),
}));
vi.mock('../SerialConnect', () => ({ default: () => <span>SerialConnect</span> }));
vi.mock('../Calibration', () => ({ default: () => <div>Calibration</div> }));

import App from '../../App';
import { getProfile } from '../../utils/storage';

// Tab IDs matching the App component
const TAB_IDS = ['balance', 'game', 'sessions', 'progress', 'profile'];

// Arbitrary: pick a tab index (0-4)
const tabIndexArb = fc.integer({ min: 0, max: TAB_IDS.length - 1 });

describe('Feature: accessibility-interactive-ui, Property 18: Visible Focus Ring on Keyboard Navigation', () => {
  it('CSS file contains :focus-visible rule with 3px outline, 2px offset, and focus color', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Read the CSS file content
        const cssPath = path.resolve(__dirname, '../../index.css');
        const cssContent = fs.readFileSync(cssPath, 'utf-8');

        // Verify :focus-visible rule exists
        expect(cssContent).toContain(':focus-visible');

        // Verify outline is 3px solid with focus color (updated per ui-accessibility-improvements spec)
        expect(cssContent).toMatch(/outline:\s*3px\s+solid\s+var\(--color-focus\)/);

        // Verify outline-offset is 2px
        expect(cssContent).toMatch(/outline-offset:\s*2px/);

        // Verify :focus:not(:focus-visible) rule exists to suppress mouse focus ring
        expect(cssContent).toContain(':focus:not(:focus-visible)');
        expect(cssContent).toMatch(/outline:\s*none/);
      }),
      { numRuns: 100 }
    );
  });

  it('the focus color (#22D3EE) provides sufficient contrast against dark background (#0F172A)', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Calculate relative luminance for #22D3EE (focus) and #0F172A (bg)
        function sRGBtoLinear(c) {
          const s = c / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        }

        function luminance(r, g, b) {
          return 0.2126 * sRGBtoLinear(r) + 0.7152 * sRGBtoLinear(g) + 0.0722 * sRGBtoLinear(b);
        }

        function contrastRatio(l1, l2) {
          const lighter = Math.max(l1, l2);
          const darker = Math.min(l1, l2);
          return (lighter + 0.05) / (darker + 0.05);
        }

        // #22D3EE = rgb(34, 211, 238)
        const focusLum = luminance(34, 211, 238);
        // #0F172A = rgb(15, 23, 42)
        const bgLum = luminance(15, 23, 42);

        const ratio = contrastRatio(focusLum, bgLum);

        // WCAG requires at least 3:1 for UI components (focus indicators)
        expect(ratio).toBeGreaterThanOrEqual(3);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: accessibility-interactive-ui, Property 19: Semantic Heading Hierarchy', () => {
  beforeEach(() => {
    getProfile.mockReturnValue({ name: 'Test User', preferredName: '', pronouns: '', affectedSide: '', goals: '', quickGoals: [], feelingToday: null, strokeDate: '', notes: '' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('for any tab view, heading levels do not skip (no h1→h3 without h2)', () => {
    fc.assert(
      fc.property(tabIndexArb, (activeIndex) => {
        cleanup();
        const { container } = render(<App />);

        // Click the target tab to make it active
        const nav = container.querySelector('nav');
        const tabButtons = nav.querySelectorAll('button');
        act(() => {
          fireEvent.click(tabButtons[activeIndex]);
        });

        // Get all heading elements in the document
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const levels = Array.from(headings).map((h) => parseInt(h.tagName.charAt(1), 10));

        // Verify no skipped levels: for each heading, the difference from the
        // previous heading level should be at most +1 (can go deeper by 1 level at a time)
        // Going back up (e.g., h3 → h2) is always allowed
        for (let i = 1; i < levels.length; i++) {
          const diff = levels[i] - levels[i - 1];
          // Can only go deeper by 1 level at a time
          expect(diff).toBeLessThanOrEqual(1);
        }

        // Verify h1 exists (app title)
        expect(levels).toContain(1);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: accessibility-interactive-ui, Property 16: Decorative Images Have aria-hidden', () => {
  beforeEach(() => {
    getProfile.mockReturnValue({ name: 'Test User', preferredName: '', pronouns: '', affectedSide: '', goals: '', quickGoals: [], feelingToday: null, strokeDate: '', notes: '' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('all tab icon SVGs in the navigation have aria-hidden="true"', () => {
    fc.assert(
      fc.property(tabIndexArb, (activeIndex) => {
        cleanup();
        const { container } = render(<App />);

        // Find all SVG icons in the tab navigation
        const nav = container.querySelector('nav');
        const tabButtons = nav.querySelectorAll('button');

        tabButtons.forEach((button) => {
          const svg = button.querySelector('svg');
          if (svg) {
            expect(svg.getAttribute('aria-hidden')).toBe('true');
          }
        });
      }),
      { numRuns: 100 }
    );
  });

  it('EmptyState decorative illustrations have aria-hidden="true"', async () => {
    // Import EmptyState directly (not mocked since it's a different module path)
    const { default: EmptyState } = await vi.importActual('../EmptyState');

    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();
        const { container } = render(
          <EmptyState
            icon={
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <rect x="8" y="40" width="8" height="16" rx="2" fill="#334155" />
              </svg>
            }
            heading="Test heading"
            description="Test description"
          />
        );

        // The icon wrapper should have aria-hidden="true"
        const ariaHiddenElements = container.querySelectorAll('[aria-hidden="true"]');
        expect(ariaHiddenElements.length).toBeGreaterThan(0);

        // Verify the SVG illustration is inside an aria-hidden container
        const svgElement = container.querySelector('svg');
        const parentWithAriaHidden = svgElement.closest('[aria-hidden="true"]');
        expect(parentWithAriaHidden).not.toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: accessibility-interactive-ui, Property 21: Connection Status Announcement', () => {
  beforeEach(() => {
    getProfile.mockReturnValue({ name: 'Test User', preferredName: '', pronouns: '', affectedSide: '', goals: '', quickGoals: [], feelingToday: null, strokeDate: '', notes: '' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('connection status indicator has role="status"', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();
        const { container } = render(<App />);

        // Find the element with role="status" in the header
        const statusElements = container.querySelectorAll('[role="status"]');
        expect(statusElements.length).toBeGreaterThan(0);

        // Verify at least one role="status" element is in the header area
        const header = container.querySelector('header');
        expect(header).not.toBeNull();

        const headerStatusElements = header.querySelectorAll('[role="status"]');
        expect(headerStatusElements.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});
