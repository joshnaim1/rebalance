import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FeelingCards, { PAIN_OPTIONS, FATIGUE_OPTIONS } from '../FeelingCards';

describe('FeelingCards', () => {
  it('renders all pain level options with icons and labels', () => {
    render(
      <FeelingCards
        options={PAIN_OPTIONS}
        selected={null}
        onSelect={() => {}}
        label="Pain Level"
      />
    );
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.getByText('Mild')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText('Severe')).toBeInTheDocument();
  });

  it('renders all fatigue level options with icons and labels', () => {
    render(
      <FeelingCards
        options={FATIGUE_OPTIONS}
        selected={null}
        onSelect={() => {}}
        label="Fatigue Level"
      />
    );
    expect(screen.getByText('Energized')).toBeInTheDocument();
    expect(screen.getByText('Okay')).toBeInTheDocument();
    expect(screen.getByText('Tired')).toBeInTheDocument();
    expect(screen.getByText('Exhausted')).toBeInTheDocument();
  });

  it('renders a group with the provided aria-label', () => {
    render(
      <FeelingCards
        options={PAIN_OPTIONS}
        selected={null}
        onSelect={() => {}}
        label="Pain Level"
      />
    );
    expect(screen.getByRole('group', { name: 'Pain Level' })).toBeInTheDocument();
  });

  it('renders buttons for each option (no typing required)', () => {
    render(
      <FeelingCards
        options={PAIN_OPTIONS}
        selected={null}
        onSelect={() => {}}
        label="Pain Level"
      />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
  });

  it('calls onSelect with the option value on click', () => {
    const handleSelect = vi.fn();
    render(
      <FeelingCards
        options={PAIN_OPTIONS}
        selected={null}
        onSelect={handleSelect}
        label="Pain Level"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Moderate/i }));
    expect(handleSelect).toHaveBeenCalledWith('moderate');
  });

  it('marks the selected card with aria-pressed="true"', () => {
    render(
      <FeelingCards
        options={PAIN_OPTIONS}
        selected="mild"
        onSelect={() => {}}
        label="Pain Level"
      />
    );
    const mildButton = screen.getByRole('button', { name: /Mild/i });
    expect(mildButton).toHaveAttribute('aria-pressed', 'true');

    const noneButton = screen.getByRole('button', { name: /None/i });
    expect(noneButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('applies distinct visual styling to the selected card', () => {
    render(
      <FeelingCards
        options={FATIGUE_OPTIONS}
        selected="tired"
        onSelect={() => {}}
        label="Fatigue Level"
      />
    );
    const tiredButton = screen.getByRole('button', { name: /Tired/i });
    expect(tiredButton.className).toContain('border-balanced');
    expect(tiredButton.className).toContain('ring-2');
  });

  it('renders cards with minimum 44x44px tap target', () => {
    render(
      <FeelingCards
        options={PAIN_OPTIONS}
        selected={null}
        onSelect={() => {}}
        label="Pain Level"
      />
    );
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button.className).toContain('min-w-[44px]');
      expect(button.className).toContain('min-h-[44px]');
    });
  });

  it('marks icons as aria-hidden', () => {
    const { container } = render(
      <FeelingCards
        options={PAIN_OPTIONS}
        selected={null}
        onSelect={() => {}}
        label="Pain Level"
      />
    );
    const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenIcons.length).toBe(4);
  });

  it('exports PAIN_OPTIONS with correct values', () => {
    expect(PAIN_OPTIONS).toHaveLength(4);
    expect(PAIN_OPTIONS.map((o) => o.value)).toEqual(['none', 'mild', 'moderate', 'severe']);
  });

  it('exports FATIGUE_OPTIONS with correct values', () => {
    expect(FATIGUE_OPTIONS).toHaveLength(4);
    expect(FATIGUE_OPTIONS.map((o) => o.value)).toEqual(['energized', 'okay', 'tired', 'exhausted']);
  });
});
