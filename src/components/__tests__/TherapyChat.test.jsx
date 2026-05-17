import { describe, it, expect } from 'vitest';
import { filterBalanceSessions } from '../TherapyChat';

describe('filterBalanceSessions', () => {
  it('excludes game_session entries', () => {
    const sessions = [
      { id: '1', type: 'game_session', avgScore: 0, date: '2026-05-17' },
      { id: '2', avgScore: 90, date: '2026-05-17' },
      { id: '3', type: 'game_session', avgScore: 0, date: '2026-05-16' },
      { id: '4', avgScore: 93, date: '2026-05-16' },
    ];
    const balance = filterBalanceSessions(sessions);
    expect(balance).toHaveLength(2);
    expect(balance.map((s) => s.id)).toEqual(['2', '4']);
  });

  it('uses last balance session for ordering, not last game', () => {
    const sessions = [
      { id: 'balance', avgScore: 90 },
      { id: 'game', type: 'game_session', avgScore: 0 },
    ];
    const balance = filterBalanceSessions(sessions);
    expect(balance[balance.length - 1].avgScore).toBe(90);
  });

  it('returns empty array for non-arrays', () => {
    expect(filterBalanceSessions(null)).toEqual([]);
    expect(filterBalanceSessions(undefined)).toEqual([]);
  });
});
