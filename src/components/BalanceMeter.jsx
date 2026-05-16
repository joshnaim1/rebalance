import { useState, useEffect, useRef } from 'react';

function ActiveMeter({ balance }) {
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

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
      {/* Score */}
      <div className="text-center">
        <div className={`text-8xl font-bold tabular-nums ${zoneColor[balance.zone]}`}>
          {balance.score}
        </div>
        <div className="text-text-secondary mt-1 text-lg">Balance Score</div>
      </div>

      {/* Balance bar */}
      <div className="space-y-3">
        <div className="flex justify-between text-lg font-mono font-medium">
          <span>LEFT {leftPct}%</span>
          <span>RIGHT {rightPct}%</span>
        </div>

        <div className="relative h-8 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-danger/20 rounded-full" />
          <div className="absolute top-0 bottom-0 left-[20%] right-[20%] bg-warning/20" />
          <div className="absolute top-0 bottom-0 left-[35%] right-[35%] bg-balanced/20" />

          <div
            className={`absolute top-0 bottom-0 w-1.5 rounded-full transition-all duration-75 ${zoneBg[balance.zone]}`}
            style={{ left: `calc(${balance.ratio * 100}% - 3px)` }}
          />

          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-text-muted/30" />
        </div>

        <div className="flex justify-between text-xs text-text-muted">
          <span>All Left</span>
          <span>Centered</span>
          <span>All Right</span>
        </div>
      </div>

      {/* Zone + Timer row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${zoneBg[balance.zone]}`} />
          <span className={`text-lg font-medium capitalize ${zoneColor[balance.zone]}`}>
            {balance.zone}
          </span>
        </div>
        <div className="text-text-secondary font-mono text-lg">
          {formatTime(elapsed)}
        </div>
      </div>
    </>
  );
}

export default function BalanceMeter({ balance, connected }) {
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
      <ActiveMeter balance={balance} key={String(connected)} />
    </div>
  );
}
