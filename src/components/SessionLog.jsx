import { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadAndCleanSessions,
  upsertSession,
  deleteSessionById,
  updateSessionById,
  getProfile,
  generateSessionId,
  saveSessions,
} from '../utils/storage';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useStreak } from '../hooks/useStreak';
import ZoneBadge from './ZoneBadge';
import AnimatedCounter from './AnimatedCounter';
import ConfettiEffect from './ConfettiEffect';
import {
  calculateSessionMetrics,
  isSessionMeaningful,
  MIN_COMMIT_DURATION,
} from '../utils/sessionAnalytics';
import FeelingCards, { PAIN_OPTIONS, FATIGUE_OPTIONS } from './FeelingCards';
import CircularProgress from './CircularProgress';
import SessionCompleteSummary from './SessionCompleteSummary';
import TrendArrow from './TrendArrow';
import EmptyState from './EmptyState';

const SESSION_GOAL_SECONDS = 15;

/**
 * Session lifecycle state machine:
 * idle -> feeling -> armed -> active -> ending -> completed (summary) -> idle
 *
 * Transitions:
 * - idle -> feeling: user clicks "Start Session"
 * - feeling -> armed: user clicks "Begin Session"
 * - armed -> active: valid pressure detected on board
 * - active -> ending: user clicks "End Session" or board disconnects
 * - ending -> completed: commitSession succeeds
 * - completed -> idle: user clicks "Done"
 */

function hasValidPressure(balance) {
  return balance && balance.isActive && balance.score > 0;
}

function LiveBalancePanel({ balance, demoMode, calibrated }) {
  const reducedMotion = useReducedMotion();
  const { seconds, message } = useStreak(balance.zone);

  const zoneGlow = {
    balanced: 'shadow-[0_0_12px_rgba(45,156,111,0.5)]',
    warning: 'shadow-[0_0_12px_rgba(217,119,6,0.5)]',
    danger: 'shadow-[0_0_12px_rgba(220,38,38,0.5)]',
    idle: '',
  };

  if (!balance.isActive) {
    return (
      <div className="bg-card border border-card-border rounded-xl p-6 text-center py-12">
        <p className="text-2xl text-text-muted font-medium">Step on the board</p>
        <p className="text-text-muted mt-2">Waiting for pressure...</p>
      </div>
    );
  }

  const leftPct = balance.percentage.left;
  const rightPct = balance.percentage.right;
  const zi = balance.zoneInfo;
  const scoreColor = zi ? { color: zi.scoreColor } : {};
  const markerColor = zi ? zi.markerColor : '#6B7280';

  return (
    <div className="bg-card border border-card-border rounded-xl p-6 space-y-6">
      <div aria-live="polite" aria-atomic="true" className="text-center">
        <div className="text-7xl font-bold tabular-nums" style={scoreColor}>
          <AnimatedCounter value={balance.score} />
        </div>
        <div className="text-text-secondary mt-1 text-base">Balance Score</div>

        {balance.zone === 'balanced' && seconds > 0 && (
          <div className="mt-2 text-lg text-balanced font-medium">
            🔥 {seconds}s streak
          </div>
        )}

        {message && (
          <div className="mt-1 text-base text-balanced/80 font-medium">
            {message}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-lg font-mono font-medium">
          <span>LEFT {leftPct}%</span>
          <span>RIGHT {rightPct}%</span>
        </div>

        <div className="relative h-8 rounded-full">
          <div className="absolute inset-0 bg-danger-soft zone-pattern-stripes rounded-full overflow-hidden" />
          <div className="absolute top-0 bottom-0 left-[20%] right-[20%] bg-warning-soft zone-pattern-dots rounded-full overflow-hidden" />
          <div className="absolute top-0 bottom-0 left-[35%] right-[35%] bg-balanced-soft zone-pattern-solid rounded-full overflow-hidden" />

          <div
            className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full transition-[left] duration-75 ${zoneGlow[balance.zone]}${!reducedMotion && balance.zone === 'balanced' ? ' animate-[balance-puck-pulse_1.5s_ease-in-out_infinite]' : ''}`}
            style={{ left: `calc(${balance.ratio * 100}% - 10px)`, backgroundColor: markerColor }}
          />

          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border-strong" />
        </div>

        <div className="flex flex-col items-center gap-1.5 mt-3" style={{ lineHeight: 1.2 }}>
          <span className="text-text-muted text-sm">Target: Center</span>
          <span className="font-bold text-text-primary text-[0.95rem]" style={scoreColor}>
            {zi ? zi.label : 'Centered'}
          </span>
        </div>

        <div className="flex justify-between text-xs text-text-secondary">
          <span>All Left</span>
          <span>All Right</span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <ZoneBadge zone={balance.zone} />
        <div className="flex flex-col gap-1 text-xs text-text-muted text-right">
          <span>{demoMode ? 'Demo mode' : 'Live board'}</span>
          <span>{calibrated ? 'Calibrated' : 'Not calibrated'}</span>
        </div>
      </div>

      <ConfettiEffect trigger={balance.score >= 90} />
    </div>
  );
}

export default function SessionLog({ balance, gameHighScore, connected, demoMode, calibrated }) {
  const [sessions, setSessions] = useState(() => loadAndCleanSessions());

  // Session phase: 'idle' | 'feeling' | 'duration' | 'armed' | 'active' | 'ending' | 'summary'
  const [sessionPhase, setSessionPhase] = useState('idle');
  const [elapsed, setElapsed] = useState(0);
  const [scoreSum, setScoreSum] = useState(0);
  const [scoreSamples, setScoreSamples] = useState(0);
  const [timeInBalanced, setTimeInBalanced] = useState(0);
  const [sessionGoal, setSessionGoal] = useState(SESSION_GOAL_SECONDS);
  const [customDuration, setCustomDuration] = useState('');

  const [feeling, setFeeling] = useState({ pain: null, fatigue: null });
  const [lastSessionData, setLastSessionData] = useState(null);
  const [generatingNote, setGeneratingNote] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const scoreSumRef = useRef(0);
  const scoreSamplesRef = useRef(0);
  const timeInBalancedRef = useRef(0);
  const balanceRatiosRef = useRef([]);

  const activeSessionIdRef = useRef(null);
  const isCommittingRef = useRef(false);
  const committedIdsRef = useRef(new Set());

  const timerRef = useRef(null);
  const sampleRef = useRef(null);
  const balanceRef = useRef(balance);

  useEffect(() => { balanceRef.current = balance; }, [balance]);

  // Transition from armed -> active when pressure is detected
  useEffect(() => {
    if (sessionPhase !== 'armed') return;
    if (!hasValidPressure(balance)) return;

    setSessionPhase('active');
    setAnnouncement('Recording session.');

    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    sampleRef.current = setInterval(() => {
      const b = balanceRef.current;
      if (b.isActive) {
        scoreSumRef.current += b.score;
        scoreSamplesRef.current += 1;
        setScoreSum((s) => s + b.score);
        setScoreSamples((n) => n + 1);
        balanceRatiosRef.current.push(b.percentage.left);
        if (b.score >= 70) {
          timeInBalancedRef.current += 0.5;
          setTimeInBalanced((t) => t + 0.5);
        }
      }
    }, 500);
  }, [balance, sessionPhase]);

  // Auto-end session when timer reaches the goal
  useEffect(() => {
    if (sessionPhase === 'active' && elapsed >= sessionGoal) {
      endSession();
    }
  }, [elapsed, sessionGoal, sessionPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-end session if connection drops
  useEffect(() => {
    if (!connected && sessionPhase === 'active') {
      endSession();
    }
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload sessions from storage periodically to catch game saves
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionPhase === 'idle') {
        setSessions(loadAndCleanSessions());
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [sessionPhase]);

  // Get previous session for comparison (second-to-last in the list)
  function getPreviousSession() {
    if (sessions.length >= 1) {
      return sessions[sessions.length - 1];
    }
    return null;
  }


  function handleStartClick() {
    setSessionPhase('feeling');
    setFeeling({ pain: null, fatigue: null });
    setAnnouncement('Pre-session check: select your pain and fatigue levels.');
  }

  function beginSession() {
    const sessionId = generateSessionId();
    activeSessionIdRef.current = sessionId;
    isCommittingRef.current = false;

    setElapsed(0);
    setScoreSum(0);
    setScoreSamples(0);
    setTimeInBalanced(0);
    scoreSumRef.current = 0;
    scoreSamplesRef.current = 0;
    timeInBalancedRef.current = 0;
    balanceRatiosRef.current = [];

    // Enter armed state — timer starts when pressure is detected
    setSessionPhase('armed');
    setAnnouncement('Session ready. Step onto the board to begin recording.');
  }

  /**
   * Guarded commit function — the ONLY path for writing completed sessions.
   * Returns early if:
   * - No active session exists
   * - Session has already been committed (by ID)
   * - Another commit is in progress (ref lock)
   * - Session is too short or has no samples (accidental junk)
   */
  const commitSession = useCallback((sessionData) => {
    const sessionId = sessionData.id;

    // Guard: no active session
    if (!sessionId) return false;

    // Guard: already committed this ID
    if (committedIdsRef.current.has(sessionId)) return false;

    // Guard: concurrent commit lock
    if (isCommittingRef.current) return false;

    if (sessionData.duration < MIN_COMMIT_DURATION && sessionData.scoreSamples === 0) {
      return false;
    }

    // Acquire lock
    isCommittingRef.current = true;
    committedIdsRef.current.add(sessionId);

    // Upsert — if ID already exists in storage, it updates rather than duplicating
    const updated = upsertSession(sessionData);
    setSessions(updated);

    // Release lock
    isCommittingRef.current = false;

    return true;
  }, []);

  function endSession() {
    // Cancel if still armed (no data recorded)
    if (sessionPhase === 'armed') {
      setSessionPhase('idle');
      activeSessionIdRef.current = null;
      setAnnouncement('Session cancelled.');
      return;
    }


    if (sessionPhase !== 'active') return;

    setSessionPhase('ending');

    clearInterval(timerRef.current);
    clearInterval(sampleRef.current);
    timerRef.current = null;
    sampleRef.current = null;

    const currentSum = scoreSumRef.current;
    const currentSamples = scoreSamplesRef.current;
    const currentTimeInBalanced = timeInBalancedRef.current;
    const currentRatios = [...balanceRatiosRef.current];
    const sessionId = activeSessionIdRef.current;

    const metrics = calculateSessionMetrics({
      scoreSum: currentSum,
      scoreSamples: currentSamples,
      timeInBalanced: currentTimeInBalanced,
      elapsed,
      balanceRatios: currentRatios,
    });

    const profile = getProfile();

    const session = {
      id: sessionId,
      date: new Date().toISOString(),
      duration: elapsed,
      durationSeconds: elapsed,
      avgScore: metrics.avgBalanceScore,
      avgBalanceScore: metrics.avgBalanceScore,
      timeInTargetZonePct: metrics.timeInTargetZonePct,
      avgLeftPct: metrics.avgLeftPct,
      avgRightPct: metrics.avgRightPct,
      swayStdDev: metrics.swayStdDev,
      validSampleCount: currentSamples,
      scoreSamples: currentSamples,
      gameHighScore: gameHighScore || 0,
      feeling: feeling.pain && feeling.fatigue ? feeling : undefined,
      timeInBalanced: Math.round(currentTimeInBalanced),
      affectedSide: profile.affectedSide || null,
      isValid: metrics.isValid,
      aiNote: null,
      aiStatus: 'pending',
    };

    const committed = commitSession(session);

    if (committed) {
      setLastSessionData(session);
      setGeneratingNote(true);
      setSessionPhase('summary');

      setScoreSum(0);
      setScoreSamples(0);
      setTimeInBalanced(0);

      setAnnouncement(
        `Session ended. Balance control score: ${metrics.avgBalanceScore}. Time in target zone: ${metrics.timeInTargetZonePct}%.`
      );

      setTimeout(() => {
        setGeneratingNote(false);
        const aiNote = `Balance session completed. Balance control: ${metrics.avgBalanceScore}/100. Time in target zone: ${metrics.timeInTargetZonePct}%. Weight split: ${Math.round(metrics.avgLeftPct)}% left / ${Math.round(metrics.avgRightPct)}% right.`;
        const updatedSessions = updateSessionById(sessionId, { aiNote, aiStatus: 'complete' });
        setSessions(updatedSessions);
        setLastSessionData((prev) => prev ? { ...prev, aiNote, aiStatus: 'complete' } : prev);
      }, 1500);

      activeSessionIdRef.current = null;
    } else {
      setSessionPhase('summary');
      activeSessionIdRef.current = null;
    }
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
            onClick={() => setSessionPhase('duration')}
            disabled={!feeling.pain || !feeling.fatigue}
            className="px-5 py-3 rounded-lg font-semibold bg-balanced-text text-white hover:bg-balanced-text/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-11"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // Render duration picker
  function renderDurationPicker() {
    const presets = [
      { label: '10s', value: 10 },
      { label: '30s', value: 30 },
      { label: '60s', value: 60 },
    ];

    return (
      <div className="bg-card border border-card-border rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-text-primary">Session Duration</h2>
        <p className="text-sm text-text-secondary">How long do you want to practice?</p>

        <div className="flex items-center gap-3 flex-wrap">
          {presets.map((p) => (
            <button
              key={p.value}
              onClick={() => { setSessionGoal(p.value); setCustomDuration(''); }}
              className={`px-5 py-3 rounded-lg text-sm font-semibold border-2 transition-colors min-h-11 ${
                sessionGoal === p.value && !customDuration
                  ? 'border-balanced bg-balanced-soft text-balanced-text'
                  : 'border-card-border bg-card text-text-secondary hover:border-balanced/40'
              }`}
            >
              {p.label}
            </button>
          ))}

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="5"
              max="3600"
              placeholder="Custom"
              value={customDuration}
              onChange={(e) => {
                setCustomDuration(e.target.value);
                const val = parseInt(e.target.value, 10);
                if (val > 0) setSessionGoal(val);
              }}
              className={`w-24 px-3 py-3 rounded-lg text-sm font-mono border-2 transition-colors min-h-11 outline-none ${
                customDuration
                  ? 'border-balanced bg-balanced-soft text-balanced-text'
                  : 'border-card-border bg-card text-text-secondary'
              } focus:border-balanced`}
            />
            <span className="text-sm text-text-muted">seconds</span>
          </div>
        </div>

        <div className="flex justify-between pt-2">
          <button
            onClick={() => setSessionPhase('feeling')}
            className="px-5 py-3 rounded-lg font-semibold bg-card border border-card-border text-text-secondary hover:text-text-primary transition-colors min-h-11"
          >
            Back
          </button>
          <button
            onClick={beginSession}
            className="px-5 py-3 rounded-lg font-semibold bg-balanced-text text-white hover:bg-balanced-text/90 transition-colors min-h-11"
          >
            Begin Session
          </button>
        </div>
      </div>
    );
  }

  // Inline live balance display for armed/active phases
  function renderLiveBalance() {
    return <LiveBalancePanel balance={balance} demoMode={demoMode} calibrated={calibrated} />;
  }

  // Render armed state (waiting for pressure)
  function renderArmedSession() {
    return (
      <div className="bg-card border border-card-border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Session Ready</h2>
            <p className="text-sm text-text-secondary mt-1">Step onto the board to begin recording.</p>
          </div>
          <button
            onClick={endSession}
            className="px-5 py-3 rounded-lg font-semibold bg-card border border-card-border text-text-secondary hover:text-text-primary transition-colors min-h-11"
          >
            Cancel
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
            <CircularProgress elapsed={elapsed} total={sessionGoal} />
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Recording Session</h2>
              <div className="flex gap-6 mt-3 text-sm">
                <div>
                  <span className="text-text-secondary">Duration: </span>
                  <span className="font-mono text-text-primary">{formatDuration(elapsed)}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Balance Control: </span>
                  <span className="font-mono text-text-primary">{avgScore} / 100</span>
                </div>
                <div>
                  <span className="text-text-secondary">Time in Target Zone: </span>
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

  function renderSummaryPhase() {
    return (
      <SessionCompleteSummary
        session={lastSessionData}
        allSessions={sessions}
        generatingNote={generatingNote}
        onDismiss={dismissSummary}
      />
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
    a.download = `rebalance-sessions-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Handle session deletion with confirmation — uses stable ID
  function handleDeleteSession(sessionId) {
    setDeleteConfirmId(sessionId);
  }

  function confirmDelete() {
    if (deleteConfirmId != null) {
      const updated = deleteSessionById(deleteConfirmId);
      setSessions(updated);
      setDeleteConfirmId(null);
      setAnnouncement('Session deleted.');
    }
  }

  function cancelDelete() {
    setDeleteConfirmId(null);
  }

  function deleteAllHistory() {
    saveSessions([]);
    setSessions([]);
    setDeleteAllConfirm(false);
    setAnnouncement('All session history deleted.');
  }

  const outcomeLabel = (outcome) => {
    if (outcome === 'user_ended') return 'Ended by user';
    if (outcome === 'time_complete') return 'Time complete';
    if (outcome === 'game_over') return 'Game Over';
    return outcome || '';
  };

  function renderSessionCard(s, prevSession) {
    const isGame = s.type === 'game_session';

    if (isGame) {
      return (
        <div
          key={s.id}
          className="bg-card border border-card-border rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs font-medium text-warning-text bg-warning-soft px-2 py-0.5 rounded-full">Game</span>
            </div>
            <span className="text-text-primary text-sm font-medium">{s.gameName || 'Game'}</span>
            <span className="text-text-secondary text-sm">{formatDate(s.date)}</span>
            <span className="text-text-secondary text-sm">{formatDuration(s.durationSeconds || s.duration || 0)}</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-text-secondary">Score: </span>
              <span className="font-mono font-bold text-text-primary">{s.score}</span>
            </div>
            <div>
              <span className="text-text-secondary">Best: </span>
              <span className="font-mono text-text-primary">{s.bestScoreAtTime || s.score}</span>
            </div>
            <span className="text-text-muted text-xs">{outcomeLabel(s.outcome)}</span>
            <button
              onClick={() => handleDeleteSession(s.id)}
              className="p-2.5 rounded text-text-muted hover:text-danger-text hover:bg-danger-soft transition-colors min-h-11 min-w-11"
              aria-label={`Delete game session from ${formatDate(s.date)}`}
              title="Delete session"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={s.id}
        className="bg-card border border-card-border rounded-lg p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs font-medium text-balanced-text bg-balanced-soft px-2 py-0.5 rounded-full">Balance</span>
          </div>
          <span className="text-text-secondary text-sm">{formatDate(s.date)}</span>
          <span className="text-text-secondary text-sm">
            {formatDuration(s.duration)}
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-text-secondary">Balance Control: </span>
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
            {prevSession && prevSession.type !== 'game_session' && (
              <TrendArrow current={s.avgScore} previous={prevSession.avgScore} />
            )}
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
  }

  // Render session history with TrendArrows
  function renderHistory() {
    const reversedSessions = [...sessions].reverse();

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">Session History</h2>
          {sessions.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={exportSessions}
                className="px-3 py-2.5 rounded-lg text-sm font-medium bg-card border border-card-border text-text-secondary hover:text-text-primary hover:border-balanced/50 transition-colors min-h-11"
              >
                Export Sessions
              </button>
              <button
                onClick={() => setDeleteAllConfirm(true)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium bg-card border border-danger/30 text-danger-text hover:bg-danger-soft transition-colors min-h-11"
              >
                Delete All History
              </button>
            </div>
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
              const prevSession = i < reversedSessions.length - 1 ? reversedSessions[i + 1] : null;
              return renderSessionCard(s, prevSession);
            })}
          </div>
        )}

        {/* Delete single confirmation dialog */}
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

        {/* Delete All confirmation dialog */}
        {deleteAllConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="delete-all-title">
            <div className="bg-danger-soft border border-card-border rounded-xl p-6 max-w-sm mx-4 space-y-4">
              <h3 id="delete-all-title" className="text-lg font-semibold text-text-primary">Delete All History?</h3>
              <p className="text-sm text-text-secondary">Delete all session and game history? This cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteAllConfirm(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium bg-card border border-card-border text-text-secondary hover:text-text-primary transition-colors min-h-11"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAllHistory}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-danger-soft border border-danger text-danger-text hover:bg-danger-soft/80 transition-colors min-h-11"
                >
                  Delete All
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
      {sessionPhase === 'duration' && renderDurationPicker()}
      {sessionPhase === 'armed' && renderArmedSession()}
      {sessionPhase === 'active' && renderActiveSession()}
      {(sessionPhase === 'ending' || sessionPhase === 'summary') && renderSummaryPhase()}

      {/* Live balance — visible only during armed/active session */}
      {(sessionPhase === 'armed' || sessionPhase === 'active') && renderLiveBalance()}

      {/* Session history */}
      {renderHistory()}
    </div>
  );
}
