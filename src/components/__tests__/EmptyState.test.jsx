import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('renders heading and description', () => {
    render(
      <EmptyState
        heading="No sessions yet"
        description="Connect your board and let's get started!"
      />
    );
    expect(screen.getByRole('heading', { level: 3, name: 'No sessions yet' })).toBeInTheDocument();
    expect(screen.getByText("Connect your board and let's get started!")).toBeInTheDocument();
  });

  it('renders decorative icon with aria-hidden="true"', () => {
    const icon = <svg data-testid="empty-icon"><circle cx="12" cy="12" r="10" /></svg>;
    const { container } = render(
      <EmptyState
        icon={icon}
        heading="No data"
        description="Start a session to see your progress."
      />
    );
    const iconWrapper = container.querySelector('[aria-hidden="true"]');
    expect(iconWrapper).toBeInTheDocument();
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });

  it('does not render icon wrapper when icon prop is not provided', () => {
    const { container } = render(
      <EmptyState
        heading="No data"
        description="Nothing here yet."
      />
    );
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
  });

  it('renders CTA button when action prop is provided', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        heading="No sessions yet"
        description="Get started with your first session."
        action={{ label: 'Start Session', onClick: handleClick }}
      />
    );
    const button = screen.getByRole('button', { name: 'Start Session' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not render button when action prop is not provided', () => {
    render(
      <EmptyState
        heading="No data"
        description="Nothing here yet."
      />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('uses semantic h3 heading element', () => {
    render(
      <EmptyState
        heading="Empty"
        description="No content available."
      />
    );
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Empty');
  });

  it('applies balanced color styling to CTA button', () => {
    render(
      <EmptyState
        heading="No sessions"
        description="Start your first session."
        action={{ label: 'Get Started', onClick: () => {} }}
      />
    );
    const button = screen.getByRole('button', { name: 'Get Started' });
    expect(button.className).toContain('bg-balanced');
  });
});
