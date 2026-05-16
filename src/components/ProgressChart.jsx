import { getSessions } from '../utils/storage';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';

export default function ProgressChart() {
  const sessions = getSessions();

  const chartData = sessions.map((s, i) => {
    const d = new Date(s.date);
    return {
      name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      session: i + 1,
      avgScore: s.avgScore,
      gameScore: s.gameHighScore || 0,
    };
  });

  const totalSessions = sessions.length;
  const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
  const bestScore = sessions.reduce((max, s) => Math.max(max, s.avgScore), 0);
  const bestGame = sessions.reduce((max, s) => Math.max(max, s.gameHighScore || 0), 0);

  const formatTotalTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: totalSessions, color: 'text-text-primary' },
          { label: 'Practice Time', value: formatTotalTime(totalTime), color: 'text-text-primary' },
          { label: 'Best Balance', value: bestScore, color: 'text-balanced' },
          { label: 'Best Game', value: bestGame, color: 'text-balanced' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-card-border rounded-xl p-4 text-center">
            <div className={`text-3xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
            <div className="text-text-muted text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length < 2 ? (
        <div className="bg-card border border-card-border rounded-xl p-12 text-center">
          <p className="text-text-muted text-lg">
            Complete at least 2 sessions to see your progress chart.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Balance Score Over Time</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="#64748B" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#F1F5F9',
                }}
              />
              <Legend />
              <ReferenceLine y={80} stroke="#4ADE8060" strokeDasharray="6 4" label={{
                value: 'Goal (80)', fill: '#4ADE8080', fontSize: 12, position: 'right',
              }} />
              <Line
                type="monotone"
                dataKey="avgScore"
                name="Balance Score"
                stroke="#4ADE80"
                strokeWidth={2}
                dot={{ fill: '#4ADE80', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="gameScore"
                name="Game Score"
                stroke="#FBBF24"
                strokeWidth={2}
                dot={{ fill: '#FBBF24', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
