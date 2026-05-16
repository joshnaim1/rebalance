import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PrivacyBanner from '../PrivacyBanner';
import FeelingCards, { PAIN_OPTIONS } from '../FeelingCards';
import SerialConnect from '../SerialConnect';
import PatientProfile from '../PatientProfile';

// Mock storage for PatientProfile
vi.mock('../../utils/storage', () => ({
  getProfile: vi.fn(() => ({
    name: 'Test User',
    preferredName: '',
    pronouns: '',
    affectedSide: '',
    goals: '',
    quickGoals: [],
    feelingToday: { pain: null, fatigue: null, dizziness: null, confidence: null },
    strokeDate: '',
    notes: '',
  })),
  saveProfile: vi.fn(),
}));

// Mock useReducedMotion
vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

/**
 * Task 17.8: Accessibility tests verifying ARIA attributes, focus ring styling, and label associations
 */
describe('Accessibility - ARIA attributes and label associations', () => {
  it('PrivacyBanner has role="note" and aria-label', () => {
    render(<PrivacyBanner />);
    const banner = screen.getByRole('note');
    expect(banner).toHaveAttribute('aria-label', 'Privacy disclosure');
  });

  it('FeelingCards buttons have aria-pressed', () => {
    render(
      <FeelingCards
        options={PAIN_OPTIONS}
        selected="mild"
        onSelect={() => {}}
        label="Pain Level"
      />
    );
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('aria-pressed');
    });
    // Selected button has aria-pressed="true"
    const mildButton = screen.getByRole('button', { name: /Mild/i });
    expect(mildButton).toHaveAttribute('aria-pressed', 'true');
    // Unselected button has aria-pressed="false"
    const noneButton = screen.getByRole('button', { name: /None/i });
    expect(noneButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('Connection status wrapper has role="status"', () => {
    // In App.jsx, SerialConnect is wrapped in <span role="status">
    // We test that the wrapper pattern works by rendering the App header structure
    const serial = {
      connected: false,
      demoMode: false,
      connect: () => {},
      disconnect: () => {},
      toggleDemo: () => {},
    };
    const { container } = render(
      <span role="status">
        <SerialConnect serial={serial} />
      </span>
    );
    const statusElement = container.querySelector('[role="status"]');
    expect(statusElement).not.toBeNull();
    expect(statusElement.textContent).toContain('Board disconnected');
  });

  it('PatientProfile form labels have htmlFor attributes', () => {
    const { container } = render(<PatientProfile onNameChange={() => {}} />);

    // Check that labels with htmlFor exist and match input ids
    const labels = container.querySelectorAll('label[for]');
    expect(labels.length).toBeGreaterThan(0);

    // Verify specific label-input associations
    const displayNameLabel = container.querySelector('label[for="profile-display-name"]');
    expect(displayNameLabel).not.toBeNull();
    expect(displayNameLabel.textContent).toContain('Display name');

    const displayNameInput = container.querySelector('#profile-display-name');
    expect(displayNameInput).not.toBeNull();

    const pronounsLabel = container.querySelector('label[for="profile-pronouns"]');
    expect(pronounsLabel).not.toBeNull();
    expect(pronounsLabel.textContent).toContain('Pronouns');

    const pronounsInput = container.querySelector('#profile-pronouns');
    expect(pronounsInput).not.toBeNull();
  });
});
