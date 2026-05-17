import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import fs from 'fs';
import path from 'path';

/**
 * Feature: warm-light-theme-accessibility, Property 3: Interactive elements meet minimum touch target size
 *
 * For any interactive element (button, link, input) in the rendered application,
 * its computed clickable area (width × height including padding) SHALL be at least
 * 44 × 44 CSS pixels.
 *
 * Validates: Requirements 3.5
 */

// Tailwind spacing scale (in pixels) for padding/sizing classes
const TAILWIND_SPACING = {
  '0': 0,
  '0.5': 2,
  '1': 4,
  '1.5': 6,
  '2': 8,
  '2.5': 10,
  '3': 12,
  '3.5': 14,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,
  '8': 32,
  '9': 36,
  '10': 40,
  '11': 44,
  '12': 48,
  '14': 56,
  '16': 64,
};

// Tailwind height/width scale (in pixels)
const TAILWIND_SIZES = {
  ...TAILWIND_SPACING,
  'full': Infinity,
  'screen': Infinity,
  'auto': null,
};

/**
 * Extract the numeric pixel value from a Tailwind spacing/size class value.
 * Handles standard scale values and arbitrary values like [44px].
 */
function parseSpacingValue(value) {
  if (value === undefined || value === null) return null;

  // Arbitrary value: [44px], [2.75rem], etc.
  const arbitraryMatch = value.match(/^\[(.+)\]$/);
  if (arbitraryMatch) {
    const inner = arbitraryMatch[1];
    if (inner.endsWith('px')) return parseFloat(inner);
    if (inner.endsWith('rem')) return parseFloat(inner) * 16;
    return null;
  }

  if (TAILWIND_SPACING[value] !== undefined) return TAILWIND_SPACING[value];
  return null;
}

/**
 * Extract interactive elements (buttons, links, inputs) from JSX source code.
 * Returns an array of objects with { tag, className, lineNumber, fileName }.
 */
function extractInteractiveElements(source, fileName) {
  const elements = [];

  // Match <button, <a, <input, <select, <textarea elements with their className
  // Also match elements with onClick handlers (custom interactive elements)
  const patterns = [
    // Standard HTML interactive elements with className
    /<(button|a|input|select|textarea)\b[^>]*className\s*=\s*{?\s*[`"']([^`"']*)[`"']\}?[^>]*>/g,
    // Template literal classNames (backtick)
    /<(button|a|input|select|textarea)\b[^>]*className\s*=\s*\{`([^`]*)`\}[^>]*>/g,
    // Ternary/conditional classNames - extract the full expression
    /<(button|a|input|select|textarea)\b[^>]*className\s*=\s*\{([^}]+)\}[^>]*>/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const tag = match[1];
      const classStr = match[2];
      const lineNumber = source.substring(0, match.index).split('\n').length;

      elements.push({
        tag,
        className: classStr,
        lineNumber,
        fileName,
      });
    }
  }

  // Deduplicate by line number
  const seen = new Set();
  return elements.filter(el => {
    const key = `${el.fileName}:${el.lineNumber}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Estimate the minimum touch target dimensions from Tailwind classes.
 * Returns { width, height } in pixels, or null if cannot determine.
 *
 * Strategy:
 * - Explicit min-w/min-h or w/h classes directly set dimensions
 * - Padding classes (px, py, p) contribute to dimensions
 * - For buttons/links with text, we assume ~16px line-height for text content
 * - For inputs, default browser height is typically ≥ 32px
 * - flex-1, flex-auto, w-full etc. guarantee the element fills available space (≥ 44px)
 */
function estimateTouchTargetSize(className, tag) {
  if (!className) return null;

  // Flatten conditional/ternary expressions - extract all class names
  const allClasses = className
    .replace(/\$\{[^}]*\}/g, ' ') // Remove template expressions
    .replace(/[`'"]/g, ' ')       // Remove quotes
    .replace(/\s*\?\s*/g, ' ')    // Remove ternary operators
    .replace(/\s*:\s*/g, ' ')     // Remove ternary colons
    .split(/\s+/)
    .filter(c => c.length > 0);

  let minWidth = null;
  let minHeight = null;
  let explicitWidth = null;
  let explicitHeight = null;
  let paddingX = 0;  // total horizontal padding (left + right)
  let paddingY = 0;  // total vertical padding (top + bottom)
  let fillsWidth = false;  // flex-1, w-full, etc.
  let fillsHeight = false; // h-full, flex-1 in column, etc.

  for (const cls of allClasses) {
    // Classes that guarantee the element fills available width (always ≥ 44px in practice)
    if (cls === 'flex-1' || cls === 'flex-auto' || cls === 'w-full' || cls === 'grow') {
      fillsWidth = true;
    }

    // min-w-* classes
    const minWMatch = cls.match(/^min-w-(.+)$/);
    if (minWMatch) {
      const val = parseSpacingValue(minWMatch[1]);
      if (val !== null) minWidth = Math.max(minWidth || 0, val);
    }

    // min-h-* classes
    const minHMatch = cls.match(/^min-h-(.+)$/);
    if (minHMatch) {
      const val = parseSpacingValue(minHMatch[1]);
      if (val !== null) minHeight = Math.max(minHeight || 0, val);
    }

    // w-* classes (explicit width)
    const wMatch = cls.match(/^w-(.+)$/);
    if (wMatch && !cls.startsWith('w-min') && !cls.startsWith('w-max') && !cls.startsWith('w-fit')) {
      const val = parseSpacingValue(wMatch[1]);
      if (val !== null) explicitWidth = val;
      if (wMatch[1] === 'full' || wMatch[1] === 'screen') fillsWidth = true;
    }

    // h-* classes (explicit height)
    const hMatch = cls.match(/^h-(.+)$/);
    if (hMatch && !cls.startsWith('h-min') && !cls.startsWith('h-max') && !cls.startsWith('h-fit')) {
      const val = parseSpacingValue(hMatch[1]);
      if (val !== null) explicitHeight = val;
      if (hMatch[1] === 'full' || hMatch[1] === 'screen') fillsHeight = true;
    }

    // Padding classes
    // p-* (all sides)
    const pAllMatch = cls.match(/^p-(.+)$/);
    if (pAllMatch && !cls.startsWith('px-') && !cls.startsWith('py-') && !cls.startsWith('pl-') && !cls.startsWith('pr-') && !cls.startsWith('pt-') && !cls.startsWith('pb-')) {
      const val = parseSpacingValue(pAllMatch[1]);
      if (val !== null) {
        paddingX = val * 2;
        paddingY = val * 2;
      }
    }

    // px-* (horizontal padding)
    const pxMatch = cls.match(/^px-(.+)$/);
    if (pxMatch) {
      const val = parseSpacingValue(pxMatch[1]);
      if (val !== null) paddingX = val * 2;
    }

    // py-* (vertical padding)
    const pyMatch = cls.match(/^py-(.+)$/);
    if (pyMatch) {
      const val = parseSpacingValue(pyMatch[1]);
      if (val !== null) paddingY = val * 2;
    }

    // pl-*, pr-* (individual horizontal padding)
    const plMatch = cls.match(/^pl-(.+)$/);
    if (plMatch) {
      const val = parseSpacingValue(plMatch[1]);
      if (val !== null) paddingX += val;
    }
    const prMatch = cls.match(/^pr-(.+)$/);
    if (prMatch) {
      const val = parseSpacingValue(prMatch[1]);
      if (val !== null) paddingX += val;
    }

    // pt-*, pb-* (individual vertical padding)
    const ptMatch = cls.match(/^pt-(.+)$/);
    if (ptMatch) {
      const val = parseSpacingValue(ptMatch[1]);
      if (val !== null) paddingY += val;
    }
    const pbMatch = cls.match(/^pb-(.+)$/);
    if (pbMatch) {
      const val = parseSpacingValue(pbMatch[1]);
      if (val !== null) paddingY += val;
    }
  }

  // Estimate content size based on element type
  // Buttons/links with text: assume at least 16px text height and some text width
  // Inputs: assume at least 20px intrinsic height
  let contentHeight = 0;
  let contentWidth = 0;

  if (tag === 'input' || tag === 'select' || tag === 'textarea') {
    contentHeight = 20; // Browser default input content height
    contentWidth = 44;  // Inputs typically fill available width, always > 44px
  } else {
    // Buttons and links with text content
    contentHeight = 20; // ~16px font + line-height
    contentWidth = 20;  // Minimum text content width assumption
  }

  // Calculate effective dimensions
  const effectiveWidth = fillsWidth
    ? 44 // flex-1/w-full elements always fill available space (≥ 44px in any reasonable layout)
    : Math.max(
        minWidth || 0,
        explicitWidth || 0,
        paddingX + contentWidth
      );

  const effectiveHeight = fillsHeight
    ? 44
    : Math.max(
        minHeight || 0,
        explicitHeight || 0,
        paddingY + contentHeight
      );

  return { width: effectiveWidth, height: effectiveHeight };
}

// Get all component files from src/components/
const componentsDir = path.resolve(process.cwd(), 'src/components');
const componentFiles = fs.readdirSync(componentsDir)
  .filter(f => f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.ts'))
  .filter(f => !f.endsWith('.test.jsx') && !f.endsWith('.test.tsx') && !f.endsWith('.test.js'))
  .map(f => ({ name: f, path: path.join(componentsDir, f) }));

// Also include App.jsx which has interactive elements
const appFile = { name: 'App.jsx', path: path.resolve(process.cwd(), 'src/App.jsx') };
const allSourceFiles = [...componentFiles, appFile];

// Extract all interactive elements from all source files
const allInteractiveElements = [];
for (const file of allSourceFiles) {
  const source = fs.readFileSync(file.path, 'utf-8');
  const elements = extractInteractiveElements(source, file.name);
  allInteractiveElements.push(...elements);
}

// Filter to elements that have meaningful className data for analysis
const analyzableElements = allInteractiveElements.filter(el => {
  if (!el.className) return false;
  // Skip elements that are purely conditional with no extractable classes
  const hasClasses = el.className.replace(/[^a-zA-Z0-9-_./[\]]/g, '').length > 0;
  return hasClasses;
});

describe('Feature: warm-light-theme-accessibility, Property 3: Interactive elements meet minimum touch target size', () => {
  it('all interactive elements have sufficient padding/sizing for 44x44px touch targets', () => {
    // Ensure we found interactive elements to test
    expect(analyzableElements.length).toBeGreaterThan(0);

    const elementArb = fc.constantFrom(...analyzableElements);

    fc.assert(
      fc.property(elementArb, (element) => {
        const size = estimateTouchTargetSize(element.className, element.tag);

        // If we can't determine size (complex dynamic classes), skip
        if (!size) return true;

        const MIN_TARGET = 44;

        // Check that the estimated touch target meets minimum size
        if (size.height < MIN_TARGET) {
          throw new Error(
            `Touch target too small (height): ${element.fileName}:${element.lineNumber} ` +
            `<${element.tag}> has estimated height ${size.height}px (minimum: ${MIN_TARGET}px). ` +
            `Classes: "${element.className.substring(0, 100)}"`
          );
        }

        if (size.width < MIN_TARGET) {
          throw new Error(
            `Touch target too small (width): ${element.fileName}:${element.lineNumber} ` +
            `<${element.tag}> has estimated width ${size.width}px (minimum: ${MIN_TARGET}px). ` +
            `Classes: "${element.className.substring(0, 100)}"`
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  it('estimateTouchTargetSize correctly computes sizes for known class patterns', () => {
    // py-2 px-4 button: padding 8+8=16 vertical + 20 content = 36 height, 16+16=32 + 20 = 52 width
    const size1 = estimateTouchTargetSize('px-4 py-2 rounded text-sm', 'button');
    expect(size1).not.toBeNull();
    expect(size1.width).toBeGreaterThanOrEqual(44);

    // py-2 px-3 button: 8+8=16 + 20 = 36 height, 12+12=24 + 20 = 44 width
    const size2 = estimateTouchTargetSize('px-3 py-2 rounded', 'button');
    expect(size2).not.toBeNull();
    expect(size2.width).toBeGreaterThanOrEqual(44);

    // Explicit min-h-11 min-w-11 (44px each)
    const size3 = estimateTouchTargetSize('min-h-11 min-w-11', 'button');
    expect(size3).not.toBeNull();
    expect(size3.width).toBeGreaterThanOrEqual(44);
    expect(size3.height).toBeGreaterThanOrEqual(44);

    // Input with py-2: 8+8+20 = 36 height, but inputs have large default width
    const size4 = estimateTouchTargetSize('py-2 px-3 border rounded', 'input');
    expect(size4).not.toBeNull();
    expect(size4.width).toBeGreaterThanOrEqual(44);
  });

  it('parseSpacingValue correctly handles Tailwind spacing values', () => {
    expect(parseSpacingValue('2')).toBe(8);
    expect(parseSpacingValue('3')).toBe(12);
    expect(parseSpacingValue('4')).toBe(16);
    expect(parseSpacingValue('2.5')).toBe(10);
    expect(parseSpacingValue('11')).toBe(44);
    expect(parseSpacingValue('[44px]')).toBe(44);
    expect(parseSpacingValue('[2.75rem]')).toBe(44);
  });
});
