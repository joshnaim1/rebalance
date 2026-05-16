import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SerialConnect from '../SerialConnect';

/**
 * Task 17.3: Board connection status text labels
 */
describe('SerialConnect - connection status text labels', () => {
  it('shows "Board disconnected" when not connected and not demo', () => {
    const serial = {
      connected: false,
      demoMode: false,
      connect: () => {},
      disconnect: () => {},
      toggleDemo: () => {},
    };
    render(<SerialConnect serial={serial} />);
    expect(screen.getByText('Board disconnected')).toBeInTheDocument();
  });

  it('shows "Board connected" when connected and not demo', () => {
    const serial = {
      connected: true,
      demoMode: false,
      connect: () => {},
      disconnect: () => {},
      toggleDemo: () => {},
    };
    render(<SerialConnect serial={serial} />);
    expect(screen.getByText('Board connected')).toBeInTheDocument();
  });

  it('shows "Demo mode active" when in demo mode', () => {
    const serial = {
      connected: true,
      demoMode: true,
      connect: () => {},
      disconnect: () => {},
      toggleDemo: () => {},
    };
    render(<SerialConnect serial={serial} />);
    expect(screen.getByText('Demo mode active')).toBeInTheDocument();
  });
});
