import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';

/**
 * Feature: warm-light-theme-accessibility, Property 1: No hardcoded hex colors in component files
 *
 * For any component file in src/components/, the file content SHALL NOT contain
 * hardcoded hex color values used as Tailwind classes or inline styles for theming
 * purposes, excluding canvas drawing code and SVG path data.
 *
 * Validates: Requirements 1.3
 */

// Dark-theme hex values that should no longer appear in component files
const BANNED_HEX_COLORS = [
  '#0F172A',
  '#1E293B',
  '#334155',
  '#F1F5F9',
  '#94A3B8',
  '#CBD5E1',
];

// Get all component files from src/components/
const componentsDir = path.resolve(process.cwd(), 'src/components');
const componentFiles = fs.readdirSync(componentsDir)
  .filter(f => f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.ts'))
  .filter(f => !f.endsWith('.test.jsx') && !f.endsWith('.test.tsx') && !f.endsWith('.test.js'))
  .map(f => path.join(componentsDir, f));

/**
 * Determines if a line is canvas drawing code.
 * Canvas drawing code uses ctx methods like fillStyle, strokeStyle, fillRect, etc.
 */
function isCanvasDrawingCode(line) {
  const trimmed = line.trim();
  return (
    trimmed.includes('ctx.fillStyle') ||
    trimmed.includes('ctx.strokeStyle') ||
    trimmed.includes('ctx.fillRect') ||
    trimmed.includes('ctx.strokeRect') ||
    trimmed.includes('ctx.clearRect') ||
    trimmed.includes('ctx.beginPath') ||
    trimmed.includes('ctx.arc') ||
    trimmed.includes('ctx.fill()') ||
    trimmed.includes('ctx.stroke()') ||
    trimmed.includes('fillStyle =') ||
    trimmed.includes('strokeStyle =')
  );
}

/**
 * Determines if a line is SVG path data.
 * SVG path data contains d="..." attributes or fill/stroke on SVG elements.
 */
function isSvgPathData(line) {
  const trimmed = line.trim();
  return (
    trimmed.includes('<path') ||
    trimmed.includes('<circle') ||
    trimmed.includes('<rect') ||
    trimmed.includes('<polygon') ||
    trimmed.includes('<line') ||
    trimmed.includes('<polyline') ||
    trimmed.includes('<ellipse') ||
    (trimmed.startsWith('d=') || trimmed.includes(' d="'))
  );
}

/**
 * Checks if a hex color appears in a Tailwind class context.
 * Tailwind arbitrary values use patterns like bg-[#hex], text-[#hex], border-[#hex], etc.
 */
function isInTailwindClassContext(line, hexColor) {
  const hexLower = hexColor.toLowerCase();
  const lineLower = line.toLowerCase();

  // Check for Tailwind arbitrary value patterns: bg-[#...], text-[#...], border-[#...], etc.
  const tailwindPatterns = [
    `bg-[${hexLower}]`,
    `text-[${hexLower}]`,
    `border-[${hexLower}]`,
    `ring-[${hexLower}]`,
    `outline-[${hexLower}]`,
    `shadow-[${hexLower}]`,
    `from-[${hexLower}]`,
    `to-[${hexLower}]`,
    `via-[${hexLower}]`,
    `fill-[${hexLower}]`,
    `stroke-[${hexLower}]`,
    `accent-[${hexLower}]`,
    `caret-[${hexLower}]`,
    `decoration-[${hexLower}]`,
    `divide-[${hexLower}]`,
    `placeholder-[${hexLower}]`,
  ];

  return tailwindPatterns.some(pattern => lineLower.includes(pattern));
}

describe('Feature: warm-light-theme-accessibility, Property 1: No hardcoded hex colors in component files', () => {
  it('no component file contains banned dark-theme hex colors in Tailwind class contexts', () => {
    // Ensure we have component files to test
    expect(componentFiles.length).toBeGreaterThan(0);

    // Create an arbitrary that selects random component files
    const componentFileArb = fc.constantFrom(...componentFiles);

    fc.assert(
      fc.property(componentFileArb, (filePath) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const fileName = path.basename(filePath);

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Skip canvas drawing code
          if (isCanvasDrawingCode(line)) continue;

          // Skip SVG path data
          if (isSvgPathData(line)) continue;

          // Check each banned hex color
          for (const hexColor of BANNED_HEX_COLORS) {
            if (isInTailwindClassContext(line, hexColor)) {
              throw new Error(
                `Found banned hex color ${hexColor} in Tailwind class context in ${fileName} at line ${i + 1}: "${line.trim()}"`
              );
            }
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
