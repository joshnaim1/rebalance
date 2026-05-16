import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PrivacyPanel from '../PrivacyPanel';

describe('PrivacyPanel', () => {
  it('renders with privacy disclosure aria-label', () => {
    render(<PrivacyPanel />);
    const panel = screen.getByRole('note', { name: 'Privacy disclosure' });
    expect(panel).toBeInTheDocument();
  });

  it('renders the heading with shield icon', () => {
    render(<PrivacyPanel />);
    expect(screen.getByText('Privacy & Data Practices')).toBeInTheDocument();
  });

  it('renders "What we store" section with all stored items', () => {
    render(<PrivacyPanel />);
    expect(screen.getByText('What we store')).toBeInTheDocument();
    expect(screen.getByText('Display name')).toBeInTheDocument();
    expect(screen.getByText('Pronouns')).toBeInTheDocument();
    expect(screen.getByText('Stroke/injury date')).toBeInTheDocument();
    expect(screen.getByText('Affected side')).toBeInTheDocument();
    expect(screen.getByText('Therapy goals')).toBeInTheDocument();
    expect(screen.getByText('Self-reported pain, fatigue, dizziness, and confidence')).toBeInTheDocument();
    expect(screen.getByText('Session balance data')).toBeInTheDocument();
  });

  it('renders "What we never store" section with all excluded items', () => {
    render(<PrivacyPanel />);
    expect(screen.getByText('What we never store')).toBeInTheDocument();
    expect(screen.getByText('Legal sex')).toBeInTheDocument();
    expect(screen.getByText('Gender marker')).toBeInTheDocument();
    expect(screen.getByText('Gender-affirming care history')).toBeInTheDocument();
    expect(screen.getByText('Unrelated medical history')).toBeInTheDocument();
  });

  it('is styled as a sticky sidebar panel for desktop', () => {
    render(<PrivacyPanel />);
    const panel = screen.getByTestId('privacy-panel');
    expect(panel.className).toContain('lg:sticky');
    expect(panel.className).toContain('lg:top-4');
  });

  it('uses card background styling', () => {
    render(<PrivacyPanel />);
    const panel = screen.getByTestId('privacy-panel');
    expect(panel.className).toContain('bg-card');
    expect(panel.className).toContain('border-card-border');
  });

  it('uses accessible text colors for contrast compliance', () => {
    render(<PrivacyPanel />);
    const heading = screen.getByText('Privacy & Data Practices');
    expect(heading.className).toContain('text-text-primary');

    const subheadings = screen.getAllByRole('heading', { level: 3 });
    subheadings.forEach((h) => {
      expect(h.className).toContain('text-text-label');
    });
  });

  it('hides the shield icon from screen readers', () => {
    render(<PrivacyPanel />);
    const panel = screen.getByTestId('privacy-panel');
    const svg = panel.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});
