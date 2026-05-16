import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TrendArrow from '../TrendArrow';

describe('TrendArrow', () => {
  it('renders upward arrow with balanced color when current > previous', () => {
    const { container } = render(<TrendArrow current={80} previous={75} />);
    const wrapper = container.querySelector('[data-testid="trend-arrow"]');

    expect(wrapper).toHaveClass('text-balanced');
    expect(wrapper.querySelector('[aria-hidden="true"]')).toHaveTextContent('↑');
    expect(wrapper.querySelector('.sr-only')).toHaveTextContent('improved by 5 points');
  });

  it('renders downward arrow with danger color when current < previous', () => {
    const { container } = render(<TrendArrow current={60} previous={63} />);
    const wrapper = container.querySelector('[data-testid="trend-arrow"]');

    expect(wrapper).toHaveClass('text-danger');
    expect(wrapper.querySelector('[aria-hidden="true"]')).toHaveTextContent('↓');
    expect(wrapper.querySelector('.sr-only')).toHaveTextContent('declined by 3 points');
  });

  it('renders horizontal arrow with muted color when current equals previous', () => {
    const { container } = render(<TrendArrow current={70} previous={70} />);
    const wrapper = container.querySelector('[data-testid="trend-arrow"]');

    expect(wrapper).toHaveClass('text-text-muted');
    expect(wrapper.querySelector('[aria-hidden="true"]')).toHaveTextContent('→');
    expect(wrapper.querySelector('.sr-only')).toHaveTextContent('no change');
  });

  it('uses singular "point" when difference is 1', () => {
    const { container } = render(<TrendArrow current={76} previous={75} />);
    const srOnly = container.querySelector('.sr-only');
    expect(srOnly).toHaveTextContent('improved by 1 point');
  });

  it('uses singular "point" when decline is 1', () => {
    const { container } = render(<TrendArrow current={74} previous={75} />);
    const srOnly = container.querySelector('.sr-only');
    expect(srOnly).toHaveTextContent('declined by 1 point');
  });
});
