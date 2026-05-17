import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ZoneBadge, { ZONE_CONFIGS } from '../ZoneBadge';

describe('ZoneBadge', () => {
  it('renders the correct label for balanced zone', () => {
    render(<ZoneBadge zone="balanced" />);
    expect(screen.getByText('Balanced')).toBeInTheDocument();
  });

  it('renders the correct label for warning zone', () => {
    render(<ZoneBadge zone="warning" />);
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('renders the correct label for danger zone', () => {
    render(<ZoneBadge zone="danger" />);
    expect(screen.getByText('Danger')).toBeInTheDocument();
  });

  it('renders an SVG icon with aria-hidden for each zone', () => {
    const { container } = render(<ZoneBadge zone="balanced" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies the solid pattern class for balanced zone', () => {
    const { container } = render(<ZoneBadge zone="balanced" />);
    const badge = container.querySelector('[data-zone="balanced"]');
    expect(badge).toHaveAttribute('data-pattern', 'solid');
    expect(badge.className).toContain('zone-pattern-solid');
  });

  it('applies the dots pattern class for warning zone', () => {
    const { container } = render(<ZoneBadge zone="warning" />);
    const badge = container.querySelector('[data-zone="warning"]');
    expect(badge).toHaveAttribute('data-pattern', 'dots');
    expect(badge.className).toContain('zone-pattern-dots');
  });

  it('applies the stripes pattern class for danger zone', () => {
    const { container } = render(<ZoneBadge zone="danger" />);
    const badge = container.querySelector('[data-zone="danger"]');
    expect(badge).toHaveAttribute('data-pattern', 'stripes');
    expect(badge.className).toContain('zone-pattern-stripes');
  });

  it('applies the correct background color class for each zone', () => {
    const zones = ['balanced', 'warning', 'danger'];
    zones.forEach((zone) => {
      const { container } = render(<ZoneBadge zone={zone} />);
      const badge = container.querySelector(`[data-zone="${zone}"]`);
      expect(badge.className).toContain(`bg-${zone}-soft`);
    });
  });

  it('uses zone-specific text color tokens for WCAG contrast compliance', () => {
    const zones = ['balanced', 'warning', 'danger'];
    const expectedTextClasses = {
      balanced: 'text-balanced-text',
      warning: 'text-warning-text',
      danger: 'text-danger-text',
    };
    zones.forEach((zone) => {
      const { container } = render(<ZoneBadge zone={zone} />);
      const badge = container.querySelector(`[data-zone="${zone}"]`);
      expect(badge.className).toContain(expectedTextClasses[zone]);
    });
  });

  it('returns null for invalid zone', () => {
    const { container } = render(<ZoneBadge zone="invalid" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders distinct icons for each zone (different SVG paths)', () => {
    const { container: c1 } = render(<ZoneBadge zone="balanced" />);
    const { container: c2 } = render(<ZoneBadge zone="warning" />);
    const { container: c3 } = render(<ZoneBadge zone="danger" />);

    const svg1 = c1.querySelector('svg').innerHTML;
    const svg2 = c2.querySelector('svg').innerHTML;
    const svg3 = c3.querySelector('svg').innerHTML;

    // Each zone should have a different icon shape
    expect(svg1).not.toBe(svg2);
    expect(svg2).not.toBe(svg3);
    expect(svg1).not.toBe(svg3);
  });

  it('exports ZONE_CONFIGS with correct structure', () => {
    expect(ZONE_CONFIGS).toHaveProperty('balanced');
    expect(ZONE_CONFIGS).toHaveProperty('warning');
    expect(ZONE_CONFIGS).toHaveProperty('danger');

    Object.values(ZONE_CONFIGS).forEach((config) => {
      expect(config).toHaveProperty('icon');
      expect(config).toHaveProperty('label');
      expect(config).toHaveProperty('color');
      expect(config).toHaveProperty('pattern');
    });
  });
});
