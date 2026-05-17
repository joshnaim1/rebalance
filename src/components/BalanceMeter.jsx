import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useStreak } from '../hooks/useStreak';
import ZoneBadge from './ZoneBadge';
import AnimatedCounter from './AnimatedCounter';
import ConfettiEffect from './ConfettiEffect';

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

  const zoneColor = {
    balanced: 'text-balanced',
    warning: 'text-warning',
    danger: 'text-danger',
    idle: 'text-text-muted',
  };

  const zoneBg = {
    balanced: 'bg-balanced',
    warning: 'bg-warning',
    danger: 'bg-danger',
    idle: 'bg-text-muted',
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

  return (
    <>
      {/* Score — wrapped in ARIA live region for screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="text-center">
        <div className={`text-8xl font-bold tabular-nums ${zoneColor[balance.zone]}`}>
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
            className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full transition-[left] duration-75 ${zoneBg[balance.zone]} ${zoneGlow[balance.zone]}${!reducedMotion && balance.zone === 'balanced' ? ' animate-[balance-puck-pulse_1.5s_ease-in-out_infinite]' : ''}`}
            style={{ left: `calc(${balance.ratio * 100}% - 10px)` }}
          />

          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border-strong" />
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-text-muted whitespace-nowrap">
            Target: Center
          </span>
        </div>

        <div className="flex justify-between text-xs text-text-secondary mt-3">
          <span>All Left</span>
          <span>Centered</span>
          <span>All Right</span>
        </div>
      </div>

      {/* Zone + Timer row — live region announces zone changes */}
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

export default function BalanceMeter({ balance, connected, demoMode, calibrated }) {
  if (!connected) {
    return (
      <div className="text-center py-16">
        <p className="text-3xl text-text-muted font-medium">No connection</p>
        <p className="text-text-muted mt-2">Connect a board or enable Demo Mode to start.</p>
      </div>
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
