import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useStreak } from '../hooks/useStreak';
import ZoneBadge from './ZoneBadge';
import AnimatedCounter from './AnimatedCounter';
import ConfettiEffect from './ConfettiEffect';
import LiveBalanceEmptyState from './LiveBalanceEmptyState';

function ActiveMeter({ balance }) {
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const { seconds, message } = useStreak(balance.zone);

  useEffect(() => {
    if (balance.isActive && !timerRef.current) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else if (!balance.isActive && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [balance.isActive]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const zoneGlow = {
    balanced: 'shadow-[0_0_12px_rgba(45,156,111,0.5)]',
    warning: 'shadow-[0_0_12px_rgba(217,119,6,0.5)]',
    danger: 'shadow-[0_0_12px_rgba(220,38,38,0.5)]',
    idle: '',
  };

  if (!balance.isActive) {
    return (
      <div className="text-center py-16">
        <p className="text-3xl text-text-muted font-medium">Step on the board</p>
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
    <>
      {/* Score — uses zone-derived color so it always matches the marker */}
      <div aria-live="polite" aria-atomic="true" className="text-center">
        <div className="text-8xl font-bold tabular-nums" style={scoreColor}>
          <AnimatedCounter value={balance.score} />
        </div>
        <div className="text-text-secondary mt-1 text-lg">Balance Score</div>

        {/* Streak counter */}
        {balance.zone === 'balanced' && seconds > 0 && (
          <div className="mt-2 text-lg text-balanced font-medium">
            🔥 {seconds}s streak
          </div>
        )}

        {/* Encouragement message */}
        {message && (
          <div className="mt-1 text-base text-balanced/80 font-medium">
            {message}
          </div>
        )}
      </div>

      {/* Balance bar */}
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

        {/* Target label group — properly spaced */}
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

      {/* Zone + Timer row */}
      <div className="flex justify-between items-center" aria-live="polite" aria-atomic="true">
        <ZoneBadge zone={balance.zone} />
        <div className="text-text-secondary font-mono text-lg">
          {formatTime(elapsed)}
        </div>
      </div>

      {/* Confetti effect */}
      <ConfettiEffect trigger={balance.score >= 90} />
    </>
  );
}

export default function BalanceMeter({ balance, connected, demoMode, calibrated, patientName, onConnect, onDemo }) {
  if (!connected) {
    return (
      <LiveBalanceEmptyState
        profileName={patientName}
        isCalibrated={calibrated}
        onConnect={onConnect}
        onDemo={onDemo}
      />
    );
  }

  // Key on connected so the inner component fully remounts (timer resets) on reconnect
  return (
    <div className="space-y-8">
      <h2 className="sr-only">Live Balance</h2>
      <ActiveMeter balance={balance} key={String(connected)} />

      {/* Data source and calibration status */}
      <div className="flex flex-col gap-1 text-sm text-text-secondary">
        <span>Source: {demoMode ? 'Demo mode' : 'Live board'}</span>
        <span>
          {calibrated
            ? 'Calibrated'
            : 'Not calibrated \u2014 results may be inaccurate'}
        </span>
      </div>
    </div>
  );
}
