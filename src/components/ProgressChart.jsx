import { useState } from 'react';
import { getSessions } from '../utils/storage';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';
import TrendArrow from './TrendArrow';
import EmptyState from './EmptyState';

/**
 * Interprets a balance score into a brief label.
 */
function interpretScore(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Great';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs work';
}

/**
 * Custom tooltip for the chart showing value, date, and interpretation.
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="bg-card border border-card-border rounded-lg p-3 text-text-primary text-sm"
      role="tooltip"
    >
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry) => {
        const interpretation = entry.dataKey === 'avgScore'
          ? ` — ${interpretScore(entry.value)}`
          : '';
        return (
          <p key={entry.dataKey} style={{ color: entry.color }}>
            {entry.name}: {entry.value}{interpretation}
          </p>
        );
      })}
    </div>
  );
}

export default function ProgressChart() {
  const sessions = getSessions();
  const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'table'
  const [dateRange, setDateRange] = useState('all'); // '7d' | '30d' | 'all'

  // Filter sessions based on selected date range
  const filteredSessions = sessions.filter((s) => {
    if (dateRange === 'all') return true;
    const sessionDate = new Date(s.date);
    const now = new Date();
    const daysAgo = dateRange === '7d' ? 7 : 30;
    const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return sessionDate >= cutoff;
  });

  const chartData = filteredSessions.map((s, i) => {
    const d = new Date(s.date);
    return {
      name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      session: i + 1,
      avgScore: s.avgScore,
      gameScore: s.gameHighScore || 0,
      date: s.date,
    };
  });

  const totalSessions = filteredSessions.length;
  const totalTime = filteredSessions.reduce((sum, s) => sum + s.duration, 0);
  const bestScore = filteredSessions.reduce((max, s) => Math.max(max, s.avgScore), 0);
  const bestGame = filteredSessions.reduce((max, s) => Math.max(max, s.gameHighScore || 0), 0);

  // Calculate previous period stats for TrendArrows
  const midpoint = Math.floor(filteredSessions.length / 2);
  const currentPeriod = filteredSessions.slice(midpoint);
  const previousPeriod = filteredSessions.slice(0, midpoint);

  const currentSessions = currentPeriod.length;
  const previousSessions = previousPeriod.length;

  const currentTime = currentPeriod.reduce((sum, s) => sum + s.duration, 0);
  const previousTime = previousPeriod.reduce((sum, s) => sum + s.duration, 0);

  const currentBestBalance = currentPeriod.reduce((max, s) => Math.max(max, s.avgScore), 0);
  const previousBestBalance = previousPeriod.length > 0
    ? previousPeriod.reduce((max, s) => Math.max(max, s.avgScore), 0)
    : 0;

  const currentBestGame = currentPeriod.reduce((max, s) => Math.max(max, s.gameHighScore || 0), 0);
  const previousBestGame = previousPeriod.length > 0
    ? previousPeriod.reduce((max, s) => Math.max(max, s.gameHighScore || 0), 0)
    : 0;

  const formatTotalTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Generate plain-language summary
  const generateSummary = () => {
    if (filteredSessions.length < 2) return null;
    const first = filteredSessions[0];
    const last = filteredSessions[filteredSessions.length - 1];
    const improvement = last.avgScore - first.avgScore;
    const direction = improvement > 0 ? 'improved' : improvement < 0 ? 'declined' : 'stayed the same';
    const absImprovement = Math.abs(improvement);

    if (improvement === 0) {
      return `Your balance has ${direction} over the last ${filteredSessions.length} sessions. Keep working toward your goal of 80.`;
    }
    return `Your balance has ${direction} by ${absImprovement} point${absImprovement === 1 ? '' : 's'} over the last ${filteredSessions.length} sessions. ${
      last.avgScore >= 80
        ? "You've reached your goal of 80!"
        : "You're on track to reach your goal of 80."
    }`;
  };

  return (
    <div className="space-y-6">
      <h2 className="sr-only">Progress Overview</h2>

      {/* Plain-language summary */}
      {filteredSessions.length >= 2 && (
        <div className="bg-card border border-card-border rounded-xl p-4">
          <p className="text-text-secondary text-sm leading-relaxed" data-testid="progress-summary">
            {generateSummary()}
          </p>
        </div>
      )}

      {/* Summary stats with TrendArrows */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Sessions',
            value: totalSessions,
            color: 'text-text-primary',
            current: currentSessions,
            previous: previousSessions,
          },
          {
            label: 'Practice Time',
            value: formatTotalTime(totalTime),
            color: 'text-text-primary',
            current: currentTime,
            previous: previousTime,
          },
          {
            label: 'Best Balance',
            value: bestScore,
            color: 'text-balanced',
            current: currentBestBalance,
            previous: previousBestBalance,
          },
          {
            label: 'Best Game',
            value: bestGame,
            color: 'text-balanced',
            current: currentBestGame,
            previous: previousBestGame,
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-card-border rounded-xl p-4 text-center">
            <div className={`text-3xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
            <div className="text-text-label text-sm mt-1 flex items-center justify-center gap-1">
              {stat.label}
              {filteredSessions.length >= 2 && (
                <TrendArrow current={stat.current} previous={stat.previous} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chart / Table area */}
      {chartData.length < 2 ? (
        <EmptyState
          icon={
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <rect x="8" y="40" width="8" height="16" rx="2" fill="#D8D3CC" />
              <rect x="20" y="32" width="8" height="24" rx="2" fill="#D8D3CC" />
              <rect x="32" y="24" width="8" height="32" rx="2" fill="#D8D3CC" />
              <rect x="44" y="16" width="8" height="40" rx="2" fill="#D8D3CC" />
              <path d="M8 12 L56 12" stroke="#2D9C6F" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
            </svg>
          }
          heading="Not enough data yet"
          description="Complete at least 2 sessions to see your progress chart. Each session helps build a picture of your improvement over time."
        />
      ) : (
        <div className="bg-card border border-card-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Balance Score Over Time</h2>
            <div className="flex items-center gap-2">
              {/* Date range filter buttons */}
              <div className="flex items-center gap-1" role="group" aria-label="Date range filter">
                {[
                  { key: '7d', label: 'Last 7 days' },
                  { key: '30d', label: 'Last 30 days' },
                  { key: 'all', label: 'All time' },
                ].map((range) => (
                  <button
                    key={range.key}
                    type="button"
                    onClick={() => setDateRange(range.key)}
                    className={`px-2.5 py-2.5 text-xs rounded-md border transition-colors min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-balanced focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                      dateRange === range.key
                        ? 'bg-balanced/20 border-balanced text-balanced font-medium'
                        : 'border-card-border text-text-secondary hover:text-text-primary hover:border-balanced'
                    }`}
                    aria-pressed={dateRange === range.key}
                    data-testid={`filter-${range.key}`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
                className="px-3 py-2.5 text-sm rounded-lg border border-card-border text-text-secondary hover:text-text-primary hover:border-balanced transition-colors min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-balanced focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                aria-pressed={viewMode === 'table'}
                data-testid="view-toggle"
              >
                {viewMode === 'chart' ? 'Show Table' : 'Show Chart'}
              </button>
            </div>
          </div>

          {viewMode === 'chart' ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E5E0" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#6B7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <ReferenceLine y={80} stroke="#2D9C6F60" strokeDasharray="6 4" label={{
                  value: 'Goal: 80', fill: '#2D9C6F', fontSize: 12, position: 'right',
                }} />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  name="Balance Score"
                  stroke="#2D9C6F"
                  strokeWidth={2}
                  dot={{ fill: '#2D9C6F', r: 4 }}
                  activeDot={{ r: 6 }}
                  label={{ position: 'top', fill: '#2D9C6F', fontSize: 11 }}
                />
                <Line
                  type="monotone"
                  dataKey="gameScore"
                  name="Game Score"
                  stroke="#D97706"
                  strokeWidth={2}
                  dot={{ fill: '#D97706', r: 4 }}
                  activeDot={{ r: 6 }}
                  label={{ position: 'bottom', fill: '#D97706', fontSize: 11 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="overflow-x-auto" data-testid="table-view">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="py-2 px-3 text-text-label font-medium">Session #</th>
                    <th className="py-2 px-3 text-text-label font-medium">Date</th>
                    <th className="py-2 px-3 text-text-label font-medium">Balance Score</th>
                    <th className="py-2 px-3 text-text-label font-medium">Game Score</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row) => (
                    <tr key={row.session} className="border-b border-card-border/50">
                      <td className="py-2 px-3 text-text-primary">{row.session}</td>
                      <td className="py-2 px-3 text-text-secondary">{row.name}</td>
                      <td className="py-2 px-3 text-text-primary">{row.avgScore}</td>
                      <td className="py-2 px-3 text-text-primary">{row.gameScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
