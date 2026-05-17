import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import fs from 'fs';
import path from 'path';

/**
 * Feature: warm-light-theme-accessibility, Property 4: Form inputs have associated visible labels
 *
 * For any text input, textarea, or select element in the rendered application,
 * there SHALL exist an associated visible <label> element (connected via htmlFor/id
 * or DOM nesting) that is not visually hidden.
 *
 * Validates: Requirements 5.3, 13.2
 */

// Get all component files from src/components/ and App.jsx
const componentsDir = path.resolve(process.cwd(), 'src/components');
const componentFiles = fs.readdirSync(componentsDir)
  .filter(f => f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.ts'))
  .filter(f => !f.endsWith('.test.jsx') && !f.endsWith('.test.tsx') && !f.endsWith('.test.js'))
  .map(f => ({ name: f, path: path.join(componentsDir, f) }));

/**
 * Extract form input elements (input, textarea, select) from JSX source code.
 * Returns an array of objects with { tag, id, lineNumber, fileName, fullMatch }.
 */
function extractFormInputs(source, fileName) {
  const inputs = [];

  // Match <input, <textarea, <select elements
  // Use a regex that captures the full opening tag (handles multi-line via dotAll)
  const tagRegex = /<(input|textarea|select)\b([^>]*?)(?:\/>|>)/gs;

  let match;
  while ((match = tagRegex.exec(source)) !== null) {
    const tag = match[1];
    const attrs = match[2];
    const lineNumber = source.substring(0, match.index).split('\n').length;

    // Extract id attribute if present
    const idMatch = attrs.match(/\bid\s*=\s*["']([^"']+)["']/);
    const id = idMatch ? idMatch[1] : null;

    // Check if the input has type="hidden" (skip hidden inputs)
    const typeMatch = attrs.match(/\btype\s*=\s*["']([^"']+)["']/);
    const type = typeMatch ? typeMatch[1] : null;
    if (type === 'hidden') continue;

    // Check if it's type="submit" or type="button" (these don't need labels)
    if (type === 'submit' || type === 'button') continue;

    inputs.push({
      tag,
      id,
      lineNumber,
      fileName,
      fullMatch: match[0],
    });
  }

  return inputs;
}

/**
 * Extract all label elements from JSX source code.
 * Returns an array of objects with { htmlFor, lineNumber, className, isVisible }.
 */
function extractLabels(source) {
  const labels = [];

  // Match <label elements with their attributes
  const labelRegex = /<label\b([^>]*)>/g;

  let match;
  while ((match = labelRegex.exec(source)) !== null) {
    const attrs = match[1];
    const lineNumber = source.substring(0, match.index).split('\n').length;

    // Extract htmlFor attribute
    const htmlForMatch = attrs.match(/\bhtmlFor\s*=\s*["']([^"']+)["']/);
    const htmlFor = htmlForMatch ? htmlForMatch[1] : null;

    // Extract className to check visibility
    const classMatch = attrs.match(/className\s*=\s*["']([^"']+)["']/);
    const className = classMatch ? classMatch[1] : '';

    // Check if label is visually hidden
    const isHidden = className.includes('sr-only') ||
                     className.includes('hidden') ||
                     className.includes('invisible') ||
                     className.includes('opacity-0');

    labels.push({
      htmlFor,
      lineNumber,
      className,
      isVisible: !isHidden,
    });
  }

  return labels;
}

/**
 * Check if an input element is nested inside a <label> element.
 * This is a simplified check that looks at the source structure.
 */
function isNestedInLabel(source, inputLineNumber) {
  const lines = source.split('\n');

  // Look backwards from the input line for an opening <label> tag
  // that hasn't been closed before the input
  let labelDepth = 0;
  for (let i = inputLineNumber - 1; i >= 0; i--) {
    const line = lines[i];

    // Count closing </label> tags (going backwards, these increase depth needed)
    const closingLabels = (line.match(/<\/label>/g) || []).length;
    labelDepth += closingLabels;

    // Count opening <label tags
    const openingLabels = (line.match(/<label\b/g) || []).length;
    if (openingLabels > 0) {
      labelDepth -= openingLabels;
      if (labelDepth < 0) {
        // This input is nested inside a label
        // Check if the label is visible (not sr-only or hidden)
        const classMatch = line.match(/className\s*=\s*["']([^"']+)["']/);
        const className = classMatch ? classMatch[1] : '';
        const isHidden = className.includes('sr-only') ||
                         className.includes('hidden') ||
                         className.includes('invisible') ||
                         className.includes('opacity-0');
        return !isHidden;
      }
    }
  }

  return false;
}

// Collect all form inputs from all component files
const allFormInputs = [];
const fileContents = new Map();

for (const file of componentFiles) {
  const source = fs.readFileSync(file.path, 'utf-8');
  fileContents.set(file.name, source);
  const inputs = extractFormInputs(source, file.name);
  allFormInputs.push(...inputs);
}

// Filter to only inputs that should have labels (text inputs, textareas, selects)
const labelableInputs = allFormInputs.filter(input => {
  // All textarea and select elements need labels
  if (input.tag === 'textarea' || input.tag === 'select') return true;
  // Input elements that are text-like need labels
  return true;
});

describe('Feature: warm-light-theme-accessibility, Property 4: Form inputs have associated visible labels', () => {
  it('found form inputs to test', () => {
    expect(labelableInputs.length).toBeGreaterThan(0);
  });

  it('every form input has an associated visible label via htmlFor/id or nesting', () => {
    const inputArb = fc.constantFrom(...labelableInputs);

    fc.assert(
      fc.property(inputArb, (input) => {
        const source = fileContents.get(input.fileName);
        const labels = extractLabels(source);

        // Strategy 1: Check if input has an id and a matching visible label with htmlFor
        if (input.id) {
          const matchingLabel = labels.find(
            label => label.htmlFor === input.id && label.isVisible
          );
          if (matchingLabel) return true;

          // Check if there's a matching label but it's hidden
          const hiddenLabel = labels.find(
            label => label.htmlFor === input.id && !label.isVisible
          );
          if (hiddenLabel) {
            throw new Error(
              `Form input <${input.tag}> with id="${input.id}" in ${input.fileName}:${input.lineNumber} ` +
              `has a label but it uses sr-only/hidden classes. Labels must be visible. ` +
              `Label className: "${hiddenLabel.className}"`
            );
          }
        }

        // Strategy 2: Check if input is nested inside a visible <label> element
        if (isNestedInLabel(source, input.lineNumber)) {
          return true;
        }

        // Strategy 3: Check if there's a label with matching htmlFor (for inputs with id)
        if (input.id) {
          throw new Error(
            `Form input <${input.tag}> with id="${input.id}" in ${input.fileName}:${input.lineNumber} ` +
            `has no associated visible <label htmlFor="${input.id}"> element.`
          );
        }

        // Input has no id and is not nested in a label
        throw new Error(
          `Form input <${input.tag}> in ${input.fileName}:${input.lineNumber} ` +
          `has no id attribute and is not nested inside a <label> element. ` +
          `Every form input must have an associated visible label.`
        );
      }),
      { numRuns: 100 }
    );
  });

  it('labels associated with form inputs are not using sr-only or hidden classes', () => {
    const inputArb = fc.constantFrom(...labelableInputs);

    fc.assert(
      fc.property(inputArb, (input) => {
        const source = fileContents.get(input.fileName);
        const labels = extractLabels(source);

        if (input.id) {
          const matchingLabel = labels.find(label => label.htmlFor === input.id);
          if (matchingLabel && !matchingLabel.isVisible) {
            throw new Error(
              `Label for input id="${input.id}" in ${input.fileName} ` +
              `uses visibility-hiding class: "${matchingLabel.className}". ` +
              `Form labels must be visible per Requirements 5.3, 13.2.`
            );
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
