import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FeelingCards, { PAIN_OPTIONS } from '../FeelingCards';

/**
 * Task 17.2: Multi-signal selected states in FeelingCards
 * Verifies checkmark, bold text, and stronger border when selected.
 */
describe('FeelingCards - multi-signal selected states', () => {
  it('renders a checkmark SVG when an option is selected', () => {
    const { container } = render(
      <FeelingCards
        options={PAIN_OPTIONS}
        selected="mild"
        onSelect={() => {}}
        label="Pain Level"
      />
    );
    const selectedButton = screen.getByRole('button', { name: /Mild/i });
    const checkmark = selectedButton.querySelector('svg');
    expect(checkmark).not.toBeNull();
    expect(checkmark).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not render a checkmark SVG when an option is not selected', () => {
    render(
      <FeelingCards
        options={PAIN_OPTIONS}
        selected="mild"
        onSelect={() => {}}
        label="Pain Level"
      />
    );
    const unselectedButton = screen.getByRole('button', { name: /None/i });
    const checkmark = unselectedButton.querySelector('svg');
    expect(checkmark).toBeNull();
  });

  it('applies font-semibold to the label text when selected', () => {
    render(
      <FeelingCards
        options={PAIN_OPTIONS}
        selected="moderate"
        onSelect={() => {}}
        label="Pain Level"
      />
    );
    const selectedButton = screen.getByRole('button', { name: /Moderate/i });
    const labelSpan = selectedButton.querySelector('span:last-child');
    expect(labelSpan.className).toContain('font-semibold');
  });

  it('applies font-medium to the label text when not selected', () => {
    render(
      <FeelingCards
        options={PAIN_OPTIONS}
        selected="moderate"
        onSelect={() => {}}
        label="Pain Level"
      />
    );
    const unselectedButton = screen.getByRole('button', { name: /None/i });
    const labelSpan = unselectedButton.querySelector('span:last-child');
    expect(labelSpan.className).toContain('font-medium');
    expect(labelSpan.className).not.toContain('font-semibold');
  });

  it('applies border-2 border-balanced classes when selected', () => {
    render(
      <FeelingCards
        options={PAIN_OPTIONS}
        selected="severe"
        onSelect={() => {}}
        label="Pain Level"
      />
    );
    const selectedButton = screen.getByRole('button', { name: /Severe/i });
    expect(selectedButton.className).toContain('border-2');
    expect(selectedButton.className).toContain('border-balanced');
  });

  it('applies border border-card-border classes when not selected', () => {
    render(
      <FeelingCards
        options={PAIN_OPTIONS}
        selected="severe"
        onSelect={() => {}}
        label="Pain Level"
      />
    );
    const unselectedButton = screen.getByRole('button', { name: /None/i });
    expect(unselectedButton.className).toContain('border-card-border');
    expect(unselectedButton.className).not.toContain('border-2');
  });
});
