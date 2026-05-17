import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SessionLog from '../SessionLog';

// Mock storage utilities
const mockSessions = [
  {
    id: 'session-1',
    date: '2024-01-15T10:00:00Z',
    duration: 300,
    avgScore: 75,
    gameHighScore: 12,
    timeInBalanced: 180,
  },
  {
    id: 'session-2',
    date: '2024-01-16T10:00:00Z',
    duration: 240,
    avgScore: 80,
    gameHighScore: 15,
    timeInBalanced: 160,
  },
];

vi.mock('../../utils/storage', () => ({
  getSessions: vi.fn(() => mockSessions),
  loadAndCleanSessions: vi.fn(() => mockSessions),
  saveSession: vi.fn((session) => []),
  upsertSession: vi.fn((session) => [...mockSessions, session]),
  deleteSession: vi.fn((id) => []),
  deleteSessionById: vi.fn((id) => mockSessions.filter((s) => s.id !== id)),
  updateSessionById: vi.fn((id, patch) => mockSessions),
  generateSessionId: vi.fn(() => 'test-uuid-123'),
  getProfile: vi.fn(() => ({ name: 'Test User' })),
}));

/**
 * Task 17.6: Session export and delete confirmation
 */
describe('SessionLog - export and delete confirmation', () => {
  const defaultProps = {
    balance: { ratio: 0.5, score: 75, zone: 'balanced', isActive: true },
    gameHighScore: 15,
    connected: true,
  };

  it('export button is present when sessions exist', () => {
    render(<SessionLog {...defaultProps} />);
    expect(screen.getByText('Export Sessions')).toBeInTheDocument();
  });

  it('delete button is present on session items', () => {
    render(<SessionLog {...defaultProps} />);
    const deleteButtons = screen.getAllByRole('button', { name: /Delete session/i });
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('confirmation dialog appears when delete is clicked', () => {
    render(<SessionLog {...defaultProps} />);
    const deleteButtons = screen.getAllByRole('button', { name: /Delete session/i });
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByText('Delete Session?')).toBeInTheDocument();
    expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });
});
