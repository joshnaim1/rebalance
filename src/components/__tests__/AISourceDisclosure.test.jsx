import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AISourceDisclosure from '../AISourceDisclosure';

/**
 * Task 17.4: AISourceDisclosure component tests
 */
describe('AISourceDisclosure', () => {
  it('renders "Generated from:" with used sources', () => {
    render(
      <AISourceDisclosure
        usedSources={['balance scores', 'session duration']}
        notUsedSources={[]}
      />
    );
    expect(screen.getByText('Generated from:')).toBeInTheDocument();
    expect(screen.getByText(/balance scores, session duration/)).toBeInTheDocument();
  });

  it('renders "Not included:" with not-used sources', () => {
    render(
      <AISourceDisclosure
        usedSources={[]}
        notUsedSources={['dizziness', 'confidence']}
      />
    );
    expect(screen.getByText('Not included:')).toBeInTheDocument();
    expect(screen.getByText(/dizziness, confidence/)).toBeInTheDocument();
  });

  it('returns null when both arrays are empty', () => {
    const { container } = render(
      <AISourceDisclosure usedSources={[]} notUsedSources={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('has proper aria-label', () => {
    render(
      <AISourceDisclosure
        usedSources={['balance scores']}
        notUsedSources={['clinical observations']}
      />
    );
    const aside = screen.getByLabelText('AI note data sources');
    expect(aside).toBeInTheDocument();
  });
});
