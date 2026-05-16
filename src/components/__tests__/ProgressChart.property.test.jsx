import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, fireEvent } from '@testing-library/react';
import { act } from 'react';
import ProgressChart from '../ProgressChart';

/**
 * Feature: accessibility-interactive-ui, Property 13: Accessible Table Structure
 * For any set of sessions rendered in the Progress_Chart table view, the output SHALL
 * contain a semantic `<table>` element with `<th>` header cells for each column and
 * one data row per session, with row count matching the session count.
 *
 * Validates: Requirements 8.4
 */

// --- Arbitraries ---
const dateArb = fc.tuple(
  fc.integer({ min: 2024, max: 2025 }),
  fc.integer({ min: 1, max: 12 }),
  fc.integer({ min: 1, max: 28 }),
).map(([y, m, d]) => new Date(y, m - 1, d).toISOString());

const sessionArb = fc.record({
  id: fc.integer({ min: 1, max: 999999 }),
  date: dateArb,
  duration: fc.integer({ min: 10, max: 600 }),
  avgScore: fc.integer({ min: 0, max: 100 }),
  gameHighScore: fc.integer({ min: 0, max: 200 }),
});

// Generate arrays of at least 2 sessions (required for table view to appear)
const sessionsArb = fc.array(sessionArb, { minLength: 2, maxLength: 10 });

// Mock recharts to avoid rendering issues in test environment
vi.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="mock-line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ReferenceLine: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Legend: () => null,
}));

describe('Feature: accessibility-interactive-ui, Property 13: Accessible Table Structure', () => {
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

  it('table view contains semantic <table> with <th> headers and row count matching session count', () => {
    fc.assert(
      fc.property(sessionsArb, (sessions) => {
        // Set up mock storage with sessions
        mockStorage = {
          balanceback_sessions: JSON.stringify(sessions),
        };

        let container;
        let unmount;

        act(() => {
          const result = render(<ProgressChart />);
          container = result.container;
          unmount = result.unmount;
        });

        // Click the toggle button to switch to table view
        const toggleButton = container.querySelector('[data-testid="view-toggle"]');
        expect(toggleButton).not.toBeNull();

        act(() => {
          fireEvent.click(toggleButton);
        });

        // Verify semantic <table> element exists
        const table = container.querySelector('table');
        expect(table).not.toBeNull();

        // Verify <thead> with <th> header cells
        const thead = table.querySelector('thead');
        expect(thead).not.toBeNull();

        const headers = thead.querySelectorAll('th');
        expect(headers.length).toBe(4);

        // Verify header text content
        const headerTexts = Array.from(headers).map(th => th.textContent);
        expect(headerTexts).toContain('Session #');
        expect(headerTexts).toContain('Date');
        expect(headerTexts).toContain('Balance Score');
        expect(headerTexts).toContain('Game Score');

        // Verify <tbody> with correct number of rows
        const tbody = table.querySelector('tbody');
        expect(tbody).not.toBeNull();

        const rows = tbody.querySelectorAll('tr');
        expect(rows.length).toBe(sessions.length);

        // Verify each row has 4 <td> cells
        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          expect(cells.length).toBe(4);
        });

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('each table row contains correct session data', () => {
    fc.assert(
      fc.property(sessionsArb, (sessions) => {
        mockStorage = {
          balanceback_sessions: JSON.stringify(sessions),
        };

        let container;
        let unmount;

        act(() => {
          const result = render(<ProgressChart />);
          container = result.container;
          unmount = result.unmount;
        });

        // Switch to table view
        const toggleButton = container.querySelector('[data-testid="view-toggle"]');

        act(() => {
          fireEvent.click(toggleButton);
        });

        const tbody = container.querySelector('table tbody');
        const rows = tbody.querySelectorAll('tr');

        // Verify session numbers are sequential and data matches
        rows.forEach((row, index) => {
          const cells = row.querySelectorAll('td');
          // First cell should be session number
          expect(cells[0].textContent).toBe(String(index + 1));
          // Third cell should be the avgScore
          expect(cells[2].textContent).toBe(String(sessions[index].avgScore));
          // Fourth cell should be the gameHighScore (or 0 if missing)
          expect(cells[3].textContent).toBe(String(sessions[index].gameHighScore || 0));
        });

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});
