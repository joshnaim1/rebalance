import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import ZoneBadge, { ZONE_CONFIGS } from '../ZoneBadge';

/**
 * Feature: accessibility-interactive-ui, Property 1: Zone Badge Completeness
 * For any valid zone value, renders correct icon, text label, and pattern class.
 *
 * Validates: Requirements 1.1, 1.2, 1.3
 */

/**
 * Feature: accessibility-interactive-ui, Property 2: Zone Badge Contrast Compliance
 * For any zone config, contrast ratio ≥ 4.5:1.
 *
 * Validates: Requirements 1.5
 */

// Zone arbitrary — generates valid zone values
const zoneArb = fc.constantFrom('balanced', 'warning', 'danger');

// Expected icon identifiers per zone (maps to SVG component rendered)
const EXPECTED_ICONS = {
  balanced: 'check-circle',
  warning: 'exclamation-triangle',
  danger: 'x-circle',
};

// Expected labels per zone
const EXPECTED_LABELS = {
  balanced: 'Balanced',
  warning: 'Warning',
  danger: 'Danger',
};

// Expected pattern classes per zone
const EXPECTED_PATTERNS = {
  balanced: 'zone-pattern-solid',
  warning: 'zone-pattern-dots',
  danger: 'zone-pattern-stripes',
};

// Zone background colors (soft backgrounds) and zone-specific text colors for contrast calculation
const ZONE_COLORS = {
  balanced: { bg: '#E8F8EF', text: '#1A5C42' },
  warning: { bg: '#FFF8E1', text: '#92400E' },
  danger: { bg: '#FEE2E2', text: '#991B1B' },
};

/**
 * Computes relative luminance of a hex color per WCAG 2.1 formula.
 * @param {string} hex - Color in #RRGGBB format
 * @returns {number} Relative luminance (0–1)
 */
function relativeLuminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const linearize = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  const R = linearize(r);
  const G = linearize(g);
  const B = linearize(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Computes WCAG contrast ratio between two colors.
 * @param {string} hex1 - First color in #RRGGBB format
 * @param {string} hex2 - Second color in #RRGGBB format
 * @returns {number} Contrast ratio (1–21)
 */
function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Feature: accessibility-interactive-ui, Property 1: Zone Badge Completeness', () => {
  it('for any valid zone value, renders correct icon, text label, and pattern class', () => {
    fc.assert(
      fc.property(zoneArb, (zone) => {
        const { container } = render(<ZoneBadge zone={zone} />);

        // 1. Correct text label is rendered
        const badge = container.querySelector(`[data-zone="${zone}"]`);
        expect(badge).not.toBeNull();
        const labelSpan = badge.querySelector('span.font-semibold');
        expect(labelSpan).not.toBeNull();
        expect(labelSpan.textContent).toBe(EXPECTED_LABELS[zone]);

        // 2. Correct icon is rendered (SVG with aria-hidden="true")
        const svg = badge.querySelector('svg');
        expect(svg).not.toBeNull();
        expect(svg.getAttribute('aria-hidden')).toBe('true');

        // Verify the icon config matches expected
        const config = ZONE_CONFIGS[zone];
        expect(config.icon).toBe(EXPECTED_ICONS[zone]);

        // 3. Correct pattern class is applied
        expect(badge.className).toContain(EXPECTED_PATTERNS[zone]);
        expect(badge.getAttribute('data-pattern')).toBe(config.pattern);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: accessibility-interactive-ui, Property 2: Zone Badge Contrast Compliance', () => {
  it('for any zone config, contrast ratio between text and background is at least 4.5:1', () => {
    fc.assert(
      fc.property(zoneArb, (zone) => {
        const { bg, text } = ZONE_COLORS[zone];
        const ratio = contrastRatio(bg, text);

        // WCAG AA requires at least 4.5:1 for normal text
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }),
      { numRuns: 100 }
    );
  });

  it('verifies the component uses zone-specific text color tokens', () => {
    const expectedTextClasses = {
      balanced: 'text-balanced-text',
      warning: 'text-warning-text',
      danger: 'text-danger-text',
    };

    fc.assert(
      fc.property(zoneArb, (zone) => {
        const { container } = render(<ZoneBadge zone={zone} />);
        const badge = container.querySelector(`[data-zone="${zone}"]`);

        // Badge uses zone-specific text color token
        expect(badge.className).toContain(expectedTextClasses[zone]);

        // Icon inherits color via text-current
        const svg = badge.querySelector('svg');
        expect(svg.className.baseVal || svg.getAttribute('class')).toContain('text-current');
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: warm-light-theme-accessibility, Property 7: Zone badge displays color, text, and icon for any zone
 * For any valid zone value (balanced, warning, danger), the rendered ZoneBadge component SHALL
 * simultaneously display a colored background, a text label matching the zone name, and an SVG icon —
 * ensuring the zone is identifiable without relying on color alone.
 *
 * Validates: Requirements 8.1
 */

// Expected soft background classes per zone (warm light theme)
const EXPECTED_BG_CLASSES = {
  balanced: 'bg-balanced-soft',
  warning: 'bg-warning-soft',
  danger: 'bg-danger-soft',
};

describe('Feature: warm-light-theme-accessibility, Property 7: Zone badge displays color, text, and icon for any zone', () => {
  it('for any zone, renders colored soft background, text label, and SVG icon simultaneously', () => {
    fc.assert(
      fc.property(zoneArb, (zone) => {
        const { container } = render(<ZoneBadge zone={zone} />);
        const badge = container.querySelector(`[data-zone="${zone}"]`);
        expect(badge).not.toBeNull();

        // 1. Colored background: zone-specific soft background class is present
        expect(badge.className).toContain(EXPECTED_BG_CLASSES[zone]);

        // 2. Text label: correct zone name is rendered
        const labelSpan = badge.querySelector('span.font-semibold');
        expect(labelSpan).not.toBeNull();
        expect(labelSpan.textContent).toBe(EXPECTED_LABELS[zone]);

        // 3. SVG icon: present with aria-hidden="true" (decorative, info conveyed by text)
        const svg = badge.querySelector('svg');
        expect(svg).not.toBeNull();
        expect(svg.getAttribute('aria-hidden')).toBe('true');
      }),
      { numRuns: 100 }
    );
  });
});
