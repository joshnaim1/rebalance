import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SummaryCard from '../SummaryCard';

describe('SummaryCard', () => {
  const mockStats = [
    { label: 'Avg Score', current: 78, previous: 73 },
    { label: 'Duration', current: 60, previous: 60 },
    { label: 'Time in Balance', current: 40, previous: 45 },
  ];

  const mockMessage =
    "You held steady balance for 70% of the session — that's 5% better than last time!";

  it('renders the summary card container', () => {
    render(<SummaryCard stats={mockStats} message={mockMessage} />);
    expect(screen.getByTestId('summary-card')).toBeInTheDocument();
  });

  it('displays all stat labels', () => {
    render(<SummaryCard stats={mockStats} message={mockMessage} />);
    expect(screen.getByText('Avg Score')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('Time in Balance')).toBeInTheDocument();
  });

  it('displays current values for each stat', () => {
    render(<SummaryCard stats={mockStats} message={mockMessage} />);
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
  });

  it('renders TrendArrow for each stat', () => {
    render(<SummaryCard stats={mockStats} message={mockMessage} />);
    const arrows = screen.getAllByTestId('trend-arrow');
    expect(arrows).toHaveLength(3);
  });

  it('displays 📈 emoji for improved stats', () => {
    const stats = [{ label: 'Score', current: 80, previous: 70 }];
    const { container } = render(<SummaryCard stats={stats} message="" />);
    expect(container.textContent).toContain('📈');
  });

  it('displays 📉 emoji for declined stats', () => {
    const stats = [{ label: 'Score', current: 60, previous: 70 }];
    const { container } = render(<SummaryCard stats={stats} message="" />);
    expect(container.textContent).toContain('📉');
  });

  it('displays ➡️ emoji for unchanged stats', () => {
    const stats = [{ label: 'Score', current: 70, previous: 70 }];
    const { container } = render(<SummaryCard stats={stats} message="" />);
    expect(container.textContent).toContain('➡️');
  });

  it('displays the plain-language interpretation message', () => {
    render(<SummaryCard stats={mockStats} message={mockMessage} />);
    expect(screen.getByText(mockMessage)).toBeInTheDocument();
  });

  it('does not render message paragraph when message is empty', () => {
    const { container } = render(<SummaryCard stats={mockStats} message="" />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(0);
  });

  it('marks emoji as aria-hidden to avoid screen reader noise', () => {
    const stats = [{ label: 'Score', current: 80, previous: 70 }];
    const { container } = render(<SummaryCard stats={stats} message="" />);
    const emojiSpan = container.querySelector('[aria-hidden="true"]');
    expect(emojiSpan).toBeInTheDocument();
  });

  it('applies card styling classes', () => {
    render(<SummaryCard stats={mockStats} message={mockMessage} />);
    const card = screen.getByTestId('summary-card');
    expect(card.className).toContain('bg-card');
    expect(card.className).toContain('border-card-border');
    expect(card.className).toContain('rounded-xl');
  });
});
