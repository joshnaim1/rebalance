import { useState, useEffect, useRef } from 'react';
import { getSessions, saveSession, deleteSession, getProfile } from '../utils/storage';
import FeelingCards, { PAIN_OPTIONS, FATIGUE_OPTIONS } from './FeelingCards';
import CircularProgress from './CircularProgress';
import SummaryCard from './SummaryCard';
import TrendArrow from './TrendArrow';
import EmptyState from './EmptyState';
import AISourceDisclosure from './AISourceDisclosure';

const SESSION_GOAL_SECONDS = 300; // 5-minute default session goal

export default function SessionLog({ balance, gameHighScore, connected }) {
  const [sessions, setSessions] = useState(() => getSessions());
  // Session phase: 'idle' | 'feeling' | 'active' | 'summary'
  const [sessionPhase, setSessionPhase] = useState('idle');
  const [elapsed, setElapsed] = useState(0);
  const [scoreSum, setScoreSum] = useState(0);
  const [scoreSamples, setScoreSamples] = useState(0);
  const [timeInBalanced, setTimeInBalanced] = useState(0);

  // Feeling state for pre-session step
  const [feeling, setFeeling] = useState({ pain: null, fatigue: null });

  // Last completed session data for summary comparison
  const [lastSessionData, setLastSessionData] = useState(null);

  // AI note generation status
  const [generatingNote, setGeneratingNote] = useState(false);

  // Delete confirmation dialog
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // ARIA live region announcement
  const [announcement, setAnnouncement] = useState('');

  const timerRef = useRef(null);
  const sampleRef = useRef(null);
  const balanceRef = useRef(balance);

  // Keep balance ref current so the sampling interval always reads fresh values
  useEffect(() => { balanceRef.current = balance; }, [balance]);

  // Auto-end session if connection drops
  useEffect(() => {
    if (!connected && sessionPhase === 'active') {
      endSession();
    }
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get previous session for comparison (second-to-last in the list)
  function getPreviousSession() {
    if (sessions.length >= 1) {
      return sessions[sessions.length - 1];
    }
    return null;
  }

  function handleStartClick() {
    // Transition to feeling phase
    setSessionPhase('feeling');
    setFeeling({ pain: null, fatigue: null });
    setAnnouncement('Pre-session check: select your pain and fatigue levels.');
  }

  function beginSession() {
    setSessionPhase('active');
    setElapsed(0);
    setScoreSum(0);
    setScoreSamples(0);
    setTimeInBalanced(0);
    setAnnouncement('Session started. Timer is running.');

    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    sampleRef.current = setInterval(() => {
      const b = balanceRef.current;
      if (b.isActive) {
        setScoreSum((s) => s + b.score);
        setScoreSamples((n) => n + 1);
        // Track time in balanced zone (score >= 70 considered balanced)
        if (b.score >= 70) {
          setTimeInBalanced((t) => t + 0.5); // sampling every 500ms
        }
      }
    }, 500);
  }

  function endSession() {
    clearInterval(timerRef.current);
    clearInterval(sampleRef.current);
    timerRef.current = null;
    sampleRef.current = null;

    // Show AI note generation indicator
    setGeneratingNote(true);
    setSessionPhase('summary');

    setScoreSum((currentSum) => {
      setScoreSamples((currentSamples) => {
        setTimeInBalanced((currentTimeInBalanced) => {
          const avgScore = currentSamples > 0 ? Math.round(currentSum / currentSamples) : 0;
          const balancedSeconds = Math.round(currentTimeInBalanced);
          const session = {
            date: new Date().toISOString(),
            duration: elapsed,
            avgScore,
            gameHighScore: gameHighScore || 0,
            feeling: feeling.pain && feeling.fatigue ? feeling : undefined,
            timeInBalanced: balancedSeconds,
          };
          const updated = saveSession(session);
          setSessions(updated);

          // Store for summary display
          setLastSessionData({
            ...session,
            id: Date.now(),
          });

          // Generate summary announcement
          const balancedPct = elapsed > 0 ? Math.round((balancedSeconds / elapsed) * 100) : 0;
          setAnnouncement(`Session ended. You held steady balance for ${balancedPct}% of the session. Average score: ${avgScore}.`);

          // Simulate AI note generation delay
          setTimeout(() => {
            setGeneratingNote(false);
          }, 1500);

          return 0;
        });
        return 0;
      });
      return 0;
    });
  }

  function dismissSummary() {
    setSessionPhase('idle');
    setLastSessionData(null);
    setAnnouncement('');
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

  // Build summary stats for SummaryCard
  function buildSummaryStats() {
    if (!lastSessionData) return { stats: [], message: '' };

    const prev = getPreviousSession();
    const balancedPct = lastSessionData.duration > 0
      ? Math.round((lastSessionData.timeInBalanced / lastSessionData.duration) * 100)
      : 0;
    const prevBalancedPct = prev && prev.duration > 0 && prev.timeInBalanced != null
      ? Math.round((prev.timeInBalanced / prev.duration) * 100)
      : 0;

    const stats = [
      {
        label: 'Avg Score',
        current: lastSessionData.avgScore,
        previous: prev ? prev.avgScore : lastSessionData.avgScore,
      },
      {
        label: 'Duration (s)',
        current: lastSessionData.duration,
        previous: prev ? prev.duration : lastSessionData.duration,
      },
      {
        label: 'Time in Balanced (%)',
        current: balancedPct,
        previous: prevBalancedPct,
      },
    ];

    // Plain-language message
    let message;
    if (prev && prev.timeInBalanced != null) {
      const diff = balancedPct - prevBalancedPct;
      if (diff > 0) {
        message = `You held steady balance for ${balancedPct}% of the session — that's ${diff}% better than last time!`;
      } else if (diff < 0) {
        message = `You held steady balance for ${balancedPct}% of the session — that's ${Math.abs(diff)}% less than last time. Keep going!`;
      } else {
        message = `You held steady balance for ${balancedPct}% of the session — same as last time. Consistency is key!`;
      }
    } else {
      message = `You held steady balance for ${balancedPct}% of the session. Great first effort!`;
    }

    return { stats, message };
  }

  // Render feeling phase
  function renderFeelingPhase() {
    return (
      <div className="bg-card border border-card-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">How are you feeling?</h2>
        <p className="text-sm text-text-secondary">Select your current levels before we begin.</p>
        <FeelingCards
          options={PAIN_OPTIONS}
          selected={feeling.pain}
          onSelect={(val) => setFeeling((f) => ({ ...f, pain: val }))}
          label="Pain Level"
        />
        <FeelingCards
          options={FATIGUE_OPTIONS}
          selected={feeling.fatigue}
          onSelect={(val) => setFeeling((f) => ({ ...f, fatigue: val }))}
          label="Fatigue Level"
        />
        <div className="flex justify-end pt-2">
          <button
            onClick={beginSession}
            disabled={!feeling.pain || !feeling.fatigue}
            className="px-5 py-3 rounded-lg font-semibold bg-balanced-text text-white hover:bg-balanced-text/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-11"
          >
            Begin Session
          </button>
        </div>
      </div>
    );
  }

  // Render active session
  function renderActiveSession() {
    return (
      <div className="bg-card border border-card-border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <CircularProgress elapsed={elapsed} total={SESSION_GOAL_SECONDS} />
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Session In Progress</h2>
              <div className="flex gap-6 mt-3 text-sm">
                <div>
                  <span className="text-text-secondary">Duration: </span>
                  <span className="font-mono text-text-primary">{formatDuration(elapsed)}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Avg Score: </span>
                  <span className="font-mono text-text-primary">{avgScore}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Time in Balanced: </span>
                  <span className="font-mono text-text-primary">{formatDuration(Math.round(timeInBalanced))}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={endSession}
            className="px-5 py-3 rounded-lg font-semibold bg-danger-soft border border-danger text-danger-text hover:bg-danger-soft/80 transition-colors min-h-11"
          >
            End Session
          </button>
        </div>
      </div>
    );
  }

  // Render summary phase
  function renderSummaryPhase() {
    const { stats, message } = buildSummaryStats();

    if (generatingNote) {
      return (
        <div className="bg-card border border-card-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Session Complete!</h2>
          <div className="flex items-center gap-3 text-text-secondary" aria-live="polite">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium">Generating session note...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-card border border-card-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">Session Complete!</h2>
        <SummaryCard stats={stats} message={message} />
        <AISourceDisclosure
          usedSources={['balance scores', 'session duration', 'self-reported pain/fatigue']}
          notUsedSources={['dizziness', 'confidence', 'clinical observations']}
        />
        <div className="flex justify-end">
          <button
            onClick={dismissSummary}
            className="px-5 py-3 rounded-lg font-semibold bg-balanced-text text-white hover:bg-balanced-text/90 transition-colors min-h-11"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Render idle state
  function renderIdleControls() {
    return (
      <div className="bg-card border border-card-border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {connected ? 'Ready to Start' : 'Connect to Start'}
            </h2>
          </div>
          <button
            onClick={handleStartClick}
            disabled={!connected}
            className="px-5 py-3 rounded-lg font-semibold bg-balanced-text text-white hover:bg-balanced-text/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-11"
          >
            Start Session
          </button>
        </div>
      </div>
    );
  }

  // Export sessions as JSON file
  function exportSessions() {
    const profile = getProfile();
    const exportData = {
      exportDate: new Date().toISOString(),
      patientName: profile.name,
      sessions: sessions,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balanceback-sessions-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Handle session deletion with confirmation
  function handleDeleteSession(sessionId) {
    setDeleteConfirmId(sessionId);
  }

  function confirmDelete() {
    if (deleteConfirmId != null) {
      const updated = deleteSession(deleteConfirmId);
      setSessions(updated);
      setDeleteConfirmId(null);
      setAnnouncement('Session deleted.');
    }
  }

  function cancelDelete() {
    setDeleteConfirmId(null);
  }

  // Render session history with TrendArrows
  function renderHistory() {
    const reversedSessions = [...sessions].reverse();

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">Session History</h2>
          {sessions.length > 0 && (
            <button
              onClick={exportSessions}
              className="px-3 py-2.5 rounded-lg text-sm font-medium bg-card border border-card-border text-text-secondary hover:text-text-primary hover:border-balanced/50 transition-colors min-h-11"
            >
              Export Sessions
            </button>
          )}
        </div>
        {sessions.length === 0 ? (
          <EmptyState
            heading="No sessions yet"
            description="Connect your board and let's get started! Your session history will appear here."
            action={connected ? { label: 'Start First Session', onClick: handleStartClick } : undefined}
          />
        ) : (
          <div className="space-y-2">
            {reversedSessions.map((s, i) => {
              // Find the previous session (the one before this in chronological order)
              // reversedSessions is newest-first, so the "previous" session is at index i+1
              const prevSession = i < reversedSessions.length - 1 ? reversedSessions[i + 1] : null;

              return (
                <div
                  key={s.id || i}
                  className="bg-card border border-card-border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-6">
                    <span className="text-text-secondary text-sm">{formatDate(s.date)}</span>
                    <span className="text-text-secondary text-sm">
                      {formatDuration(s.duration)}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-text-secondary">Avg Score: </span>
                      <span className={`font-mono font-bold ${
                        s.avgScore >= 80 ? 'text-balanced' :
                        s.avgScore >= 50 ? 'text-warning' : 'text-danger'
                      }`}>{s.avgScore}</span>
                      <span className={`text-xs font-medium ${
                        s.avgScore >= 80 ? 'text-balanced-text' :
                        s.avgScore >= 50 ? 'text-warning-text' : 'text-danger-text'
                      }`}>
                        {s.avgScore >= 80 ? 'Great' : s.avgScore >= 50 ? 'Fair' : 'Needs work'}
                      </span>
                      {prevSession && (
                        <TrendArrow current={s.avgScore} previous={prevSession.avgScore} />
                      )}
                    </div>
                    <div>
                      <span className="text-text-secondary">Game: </span>
                      <span className="font-mono text-text-primary">{s.gameHighScore}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteSession(s.id)}
                      className="p-2.5 rounded text-text-muted hover:text-danger-text hover:bg-danger-soft transition-colors min-h-11 min-w-11"
                      aria-label={`Delete session from ${formatDate(s.date)}`}
                      title="Delete session"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete confirmation dialog */}
        {deleteConfirmId != null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
            <div className="bg-danger-soft border border-card-border rounded-xl p-6 max-w-sm mx-4 space-y-4">
              <h3 id="delete-confirm-title" className="text-lg font-semibold text-text-primary">Delete Session?</h3>
              <p className="text-sm text-text-secondary">This action cannot be undone. The session data will be permanently removed.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium bg-card border border-card-border text-text-secondary hover:text-text-primary transition-colors min-h-11"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-danger-soft border border-danger text-danger-text hover:bg-danger-soft/80 transition-colors min-h-11"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ARIA live region for session announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Session controls based on phase */}
      {sessionPhase === 'idle' && renderIdleControls()}
      {sessionPhase === 'feeling' && renderFeelingPhase()}
      {sessionPhase === 'active' && renderActiveSession()}
      {sessionPhase === 'summary' && renderSummaryPhase()}

      {/* Session history */}
      {renderHistory()}
    </div>
  );
}
