import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PrivacyBanner from '../PrivacyBanner';

describe('PrivacyBanner', () => {
  it('renders with privacy disclosure aria-label', () => {
    render(<PrivacyBanner />);
    const banner = screen.getByRole('note', { name: 'Privacy disclosure' });
    expect(banner).toBeInTheDocument();
  });

  it('renders the heading with shield icon', () => {
    render(<PrivacyBanner />);
    expect(screen.getByText('Privacy & Data Practices')).toBeInTheDocument();
  });

  it('renders "What we store" section with all stored items', () => {
    render(<PrivacyBanner />);
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
    render(<PrivacyBanner />);
    expect(screen.getByText('What we never store')).toBeInTheDocument();
    expect(screen.getByText('Legal sex')).toBeInTheDocument();
    expect(screen.getByText('Gender marker')).toBeInTheDocument();
    expect(screen.getByText('Gender-affirming care history')).toBeInTheDocument();
    expect(screen.getByText('Unrelated medical history')).toBeInTheDocument();
  });

  it('has a distinct background with colored left border', () => {
    render(<PrivacyBanner />);
    const banner = screen.getByTestId('privacy-banner');
    expect(banner.className).toContain('bg-card');
    expect(banner.className).toContain('border-l-4');
    expect(banner.className).toContain('border-l-focus');
  });

  it('uses accessible text colors for contrast compliance', () => {
    render(<PrivacyBanner />);
    const heading = screen.getByText('Privacy & Data Practices');
    expect(heading.className).toContain('text-text-primary');

    const subheadings = screen.getAllByRole('heading', { level: 3 });
    subheadings.forEach((h) => {
      expect(h.className).toContain('text-text-label');
    });
  });

  it('hides the shield icon from screen readers', () => {
    render(<PrivacyBanner />);
    const banner = screen.getByTestId('privacy-banner');
    const svg = banner.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});
