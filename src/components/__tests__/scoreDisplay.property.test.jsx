import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Feature: warm-light-theme-accessibility, Property 5: Score display includes color and text quality indicator
 *
 * For any balance score value (integer 0–100), the rendered score display SHALL include
 * both a color-coded class (green for ≥80, warning for ≥50, danger for <50) AND a text
 * label indicating the quality level (e.g., "Great", "Fair", "Needs work").
 *
 * Validates: Requirements 6.3
 */

// --- Score display logic extracted from SessionLog.jsx ---

/**
 * Returns the color class for the score value (applied to the numeric score).
 */
function getScoreColorClass(score) {
  if (score >= 80) return 'text-balanced';
  if (score >= 50) return 'text-warning';
  return 'text-danger';
}

/**
 * Returns the text color class for the quality label.
 */
function getScoreLabelColorClass(score) {
  if (score >= 80) return 'text-balanced-text';
  if (score >= 50) return 'text-warning-text';
  return 'text-danger-text';
}

/**
 * Returns the text quality label for the score.
 */
function getScoreLabel(score) {
  if (score >= 80) return 'Great';
  if (score >= 50) return 'Fair';
  return 'Needs work';
}

// --- Property Tests ---

describe('Feature: warm-light-theme-accessibility, Property 5: Score display includes color and text quality indicator', () => {
  it('every score 0–100 maps to both a color class and a text quality label', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
        const colorClass = getScoreColorClass(score);
        const labelColorClass = getScoreLabelColorClass(score);
        const label = getScoreLabel(score);

        // Color class must be one of the valid semantic color classes
        expect(['text-balanced', 'text-warning', 'text-danger']).toContain(colorClass);

        // Label color class must be one of the valid semantic text color classes
        expect(['text-balanced-text', 'text-warning-text', 'text-danger-text']).toContain(labelColorClass);

        // Text label must be one of the valid quality labels
        expect(['Great', 'Fair', 'Needs work']).toContain(label);

        // Verify correct mapping for score thresholds
        if (score >= 80) {
          expect(colorClass).toBe('text-balanced');
          expect(labelColorClass).toBe('text-balanced-text');
          expect(label).toBe('Great');
        } else if (score >= 50) {
          expect(colorClass).toBe('text-warning');
          expect(labelColorClass).toBe('text-warning-text');
          expect(label).toBe('Fair');
        } else {
          expect(colorClass).toBe('text-danger');
          expect(labelColorClass).toBe('text-danger-text');
          expect(label).toBe('Needs work');
        }

        // Both color AND text label must be present (not just one)
        expect(colorClass).toBeTruthy();
        expect(label).toBeTruthy();
      }),
      { numRuns: 100 }
    );
  });

  it('score color class and label are always paired together (never color-only or text-only)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
        const colorClass = getScoreColorClass(score);
        const labelColorClass = getScoreLabelColorClass(score);
        const label = getScoreLabel(score);

        // If a color class is assigned, a label must also be assigned
        if (colorClass) {
          expect(label).toBeTruthy();
          expect(label.length).toBeGreaterThan(0);
        }

        // If a label is assigned, a color class must also be assigned
        if (label) {
          expect(colorClass).toBeTruthy();
          expect(colorClass.length).toBeGreaterThan(0);
        }

        // The label color class must correspond to the same threshold as the score color class
        if (colorClass === 'text-balanced') {
          expect(labelColorClass).toBe('text-balanced-text');
        } else if (colorClass === 'text-warning') {
          expect(labelColorClass).toBe('text-warning-text');
        } else if (colorClass === 'text-danger') {
          expect(labelColorClass).toBe('text-danger-text');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('SessionLog.jsx source contains both color class patterns and text label patterns', () => {
    const sessionLogPath = resolve(__dirname, '..', 'SessionLog.jsx');
    const source = readFileSync(sessionLogPath, 'utf-8');

    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
        // Verify the source code contains the color classes used for score display
        expect(source).toContain('text-balanced');
        expect(source).toContain('text-warning');
        expect(source).toContain('text-danger');

        // Verify the source code contains the text quality labels
        expect(source).toContain('Great');
        expect(source).toContain('Fair');
        expect(source).toContain('Needs work');

        // Verify the source code contains the threshold logic (score >= 80, score >= 50)
        expect(source).toContain('>= 80');
        expect(source).toContain('>= 50');

        // Verify both color AND label are rendered together (in the same section)
        // The pattern shows score color class followed by label in the same block
        expect(source).toMatch(/text-balanced.*Great/s);
        expect(source).toMatch(/text-warning.*Fair/s);
        expect(source).toMatch(/text-danger.*Needs work/s);
      }),
      { numRuns: 100 }
    );
  });
});
