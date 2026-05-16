import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Calibration from '../Calibration';

// Mock storage
vi.mock('../../utils/storage', () => ({
  saveCalibration: vi.fn(),
}));

/**
 * Task 17.7: Calibration progress text and countdown
 */
describe('Calibration - progress text and countdown', () => {
  const createValuesRef = () => ({ current: { left: 500, right: 500 } });

  it('shows progress percentage text during capture', () => {
    vi.useFakeTimers();
    const valuesRef = createValuesRef();
    render(
      <Calibration
        valuesRef={valuesRef}
        onComplete={() => {}}
        onCancel={() => {}}
      />
    );

    // Start calibration
    fireEvent.click(screen.getByText('Start Calibration'));

    // After starting, the capturing phase should show progress text
    expect(screen.getByText(/% complete/)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('shows countdown timer text during capture', () => {
    vi.useFakeTimers();
    const valuesRef = createValuesRef();
    render(
      <Calibration
        valuesRef={valuesRef}
        onComplete={() => {}}
        onCancel={() => {}}
      />
    );

    // Start calibration
    fireEvent.click(screen.getByText('Start Calibration'));

    // Should show seconds remaining
    expect(screen.getByText(/seconds remaining/)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('cancel button text says "Cancel"', () => {
    const valuesRef = createValuesRef();
    render(
      <Calibration
        valuesRef={valuesRef}
        onComplete={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    // Ensure it does NOT say "Skip"
    expect(screen.queryByText('Skip')).not.toBeInTheDocument();
  });
});
