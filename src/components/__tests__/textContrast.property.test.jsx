import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Feature: warm-light-theme-accessibility, Property 6: Text contrast meets WCAG thresholds
 *
 * For any text element in the rendered application, if the text is normal-size
 * (below 18pt or below 14pt bold), its foreground color SHALL achieve a minimum
 * 4.5:1 contrast ratio against its background color. If the text is large-size
 * (≥18pt or ≥14pt bold), its foreground color SHALL achieve a minimum 3:1
 * contrast ratio against its background color.
 *
 * Validates: Requirements 11.1, 11.2
 */

/**
 * Compute WCAG 2.1 relative luminance for an sRGB color.
 * @param {number} r - Red channel (0-255)
 * @param {number} g - Green channel (0-255)
 * @param {number} b - Blue channel (0-255)
 * @returns {number} Relative luminance (0-1)
 */
function relativeLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Compute WCAG 2.1 contrast ratio between two colors.
 * @param {[number, number, number]} color1 - RGB tuple
 * @param {[number, number, number]} color2 - RGB tuple
 * @returns {number} Contrast ratio (1-21)
 */
function contrastRatio(color1, color2) {
  const l1 = relativeLuminance(...color1);
  const l2 = relativeLuminance(...color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse a hex color string to an RGB tuple.
 * @param {string} hex - Hex color (e.g., "#1E293B")
 * @returns {[number, number, number]} RGB tuple
 */
function hexToRgb(hex) {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return [r, g, b];
}

// Token color pairs from the design document
// Each entry: { foreground, background, label, type }
// type: 'normal' requires ≥4.5:1, 'large' requires ≥3:1
const TOKEN_COLOR_PAIRS = [
  // Normal text pairs (≥4.5:1 required)
  { foreground: '#1E293B', background: '#FAF8F5', label: 'Text primary on page background', type: 'normal' },
  { foreground: '#1E293B', background: '#FFFFFF', label: 'Text primary on card background', type: 'normal' },
  { foreground: '#374151', background: '#FAF8F5', label: 'Text secondary on page background', type: 'normal' },
  { foreground: '#374151', background: '#FFFFFF', label: 'Text secondary on card background', type: 'normal' },
  { foreground: '#6B7280', background: '#FAF8F5', label: 'Text muted on page background', type: 'normal' },
  { foreground: '#6B7280', background: '#FFFFFF', label: 'Text muted on card background', type: 'normal' },
  { foreground: '#1A5C42', background: '#E8F8EF', label: 'Balanced text on balanced soft', type: 'normal' },
  { foreground: '#1A5C42', background: '#FFFFFF', label: 'Balanced text on card background', type: 'normal' },
  { foreground: '#92400E', background: '#FFF8E1', label: 'Warning text on warning soft', type: 'normal' },
  { foreground: '#92400E', background: '#FFFFFF', label: 'Warning text on card background', type: 'normal' },
  { foreground: '#991B1B', background: '#FEE2E2', label: 'Danger text on danger soft', type: 'normal' },
  { foreground: '#991B1B', background: '#FFFFFF', label: 'Danger text on card background', type: 'normal' },
  { foreground: '#1D4ED8', background: '#EFF6FF', label: 'Blue text on blue soft', type: 'normal' },
  { foreground: '#1D4ED8', background: '#FFFFFF', label: 'Blue text on card background', type: 'normal' },
  // Large text / UI component pairs (≥3:1 required)
  { foreground: '#2D9C6F', background: '#FFFFFF', label: 'Green accent on card background', type: 'large' },
  { foreground: '#D97706', background: '#FFFFFF', label: 'Warning accent on card background', type: 'large' },
  { foreground: '#DC2626', background: '#FFFFFF', label: 'Danger accent on card background', type: 'large' },
];

describe('Feature: warm-light-theme-accessibility, Property 6: Text contrast meets WCAG thresholds', () => {
  it('all token foreground/background pairs meet WCAG contrast thresholds', () => {
    // Create an arbitrary that picks from all defined token pairs
    const pairArb = fc.constantFrom(...TOKEN_COLOR_PAIRS);

    fc.assert(
      fc.property(pairArb, (pair) => {
        const fgRgb = hexToRgb(pair.foreground);
        const bgRgb = hexToRgb(pair.background);
        const ratio = contrastRatio(fgRgb, bgRgb);
        const threshold = pair.type === 'normal' ? 4.5 : 3.0;

        if (ratio < threshold) {
          throw new Error(
            `${pair.label}: contrast ratio ${ratio.toFixed(2)}:1 is below the ${threshold}:1 threshold ` +
            `(foreground: ${pair.foreground}, background: ${pair.background})`
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  it('relativeLuminance computes correct values for known colors', () => {
    // Black should have luminance 0
    expect(relativeLuminance(0, 0, 0)).toBeCloseTo(0, 5);
    // White should have luminance 1
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1, 5);
    // Mid-gray should be approximately 0.2
    expect(relativeLuminance(128, 128, 128)).toBeCloseTo(0.2158, 3);
  });

  it('contrastRatio computes correct values for known pairs', () => {
    // Black on white should be 21:1
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 0);
    // Same color should be 1:1
    expect(contrastRatio([128, 128, 128], [128, 128, 128])).toBeCloseTo(1, 5);
  });

  it('hexToRgb correctly parses hex color strings', () => {
    expect(hexToRgb('#FFFFFF')).toEqual([255, 255, 255]);
    expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
    expect(hexToRgb('#1E293B')).toEqual([30, 41, 59]);
    expect(hexToRgb('#FAF8F5')).toEqual([250, 248, 245]);
  });
});
