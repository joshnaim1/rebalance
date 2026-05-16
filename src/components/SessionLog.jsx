import { useState, useEffect, useRef } from 'react';
import { getSessions, saveSession } from '../utils/storage';

export default function SessionLog({ balance, gameHighScore, connected }) {
  const [sessions, setSessions] = useState(() => getSessions());
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [scoreSum, setScoreSum] = useState(0);
  const [scoreSamples, setScoreSamples] = useState(0);

  const timerRef = useRef(null);
  const sampleRef = useRef(null);
  const balanceRef = useRef(balance);

  // Keep balance ref current so the sampling interval always reads fresh values
  useEffect(() => { balanceRef.current = balance; }, [balance]);

  // Auto-end session if connection drops
  useEffect(() => {
    if (!connected && active) {
      endSession();
    }
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  function startSession() {
    setActive(true);
    setElapsed(0);
    setScoreSum(0);
    setScoreSamples(0);

    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    sampleRef.current = setInterval(() => {
      const b = balanceRef.current;
      if (b.isActive) {
        setScoreSum((s) => s + b.score);
        setScoreSamples((n) => n + 1);
      }
    }, 500);
  }

  function endSession() {
    clearInterval(timerRef.current);
    clearInterval(sampleRef.current);
    timerRef.current = null;
    sampleRef.current = null;
    setActive(false);

    setScoreSum((currentSum) => {
      setScoreSamples((currentSamples) => {
        const avgScore = currentSamples > 0 ? Math.round(currentSum / currentSamples) : 0;
        const session = {
          date: new Date().toISOString(),
          duration: elapsed,
          avgScore,
          gameHighScore: gameHighScore || 0,
        };
        const updated = saveSession(session);
        setSessions(updated);
        return 0;
      });
      return 0;
    });
  }

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(sampleRef.current);
    };
  }, []);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const avgScore = scoreSamples > 0 ? Math.round(scoreSum / scoreSamples) : 0;

  return (
    <div className="space-y-6">
      {/* Session controls */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              {active ? 'Session In Progress' : connected ? 'Ready to Start' : 'Connect to Start'}
            </h3>
            {active && (
              <div className="flex gap-6 mt-3 text-sm">
                <div>
                  <span className="text-text-muted">Duration: </span>
                  <span className="font-mono text-text-primary">{formatDuration(elapsed)}</span>
                </div>
                <div>
                  <span className="text-text-muted">Avg Score: </span>
                  <span className="font-mono text-text-primary">{avgScore}</span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={active ? endSession : startSession}
            disabled={!connected && !active}
            className={`px-5 py-2.5 rounded-lg font-semibold transition-colors ${
              active
                ? 'bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20'
                : 'bg-balanced text-bg hover:bg-balanced/90 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {active ? 'End Session' : 'Start Session'}
          </button>
        </div>
      </div>

      {/* Session history */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-3">Session History</h3>
        {sessions.length === 0 ? (
          <p className="text-text-muted text-center py-8">No sessions recorded yet. Start your first session above.</p>
        ) : (
          <div className="space-y-2">
            {[...sessions].reverse().map((s, i) => (
              <div
                key={s.id || i}
                className="bg-card border border-card-border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-6">
                  <span className="text-text-secondary text-sm">{formatDate(s.date)}</span>
                  <span className="text-text-muted text-sm">
                    {formatDuration(s.duration)}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-text-muted">Avg Score: </span>
                    <span className={`font-mono font-bold ${
                      s.avgScore >= 80 ? 'text-balanced' :
                      s.avgScore >= 50 ? 'text-warning' : 'text-danger'
                    }`}>{s.avgScore}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Game: </span>
                    <span className="font-mono text-text-primary">{s.gameHighScore}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
