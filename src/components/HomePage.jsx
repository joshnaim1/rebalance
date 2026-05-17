import { useEffect, useState } from 'react';
import Card from './ui/Card';
import ReBalanceLogo from './ReBalanceLogo';
import { getSessions } from '../utils/storage';

/* ──────────────────── Animated background orbs ──────────────────── */

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-balanced/[0.06] blur-3xl animate-[drift_18s_ease-in-out_infinite]" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-blue-accent/[0.05] blur-3xl animate-[drift_22s_ease-in-out_infinite_reverse]" />
      <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-balanced/[0.04] blur-3xl animate-[drift_15s_ease-in-out_infinite_2s]" />
    </div>
  );
}

/* ──────────────────── Animated balance bar ──────────────────── */

function AnimatedBalanceBar() {
  const [pos, setPos] = useState(50);

  useEffect(() => {
    let frame;
    let t = 0;
    const tick = () => {
      t += 0.02;
      const val = 50 + Math.sin(t * 0.7) * 12 + Math.sin(t * 1.9) * 5 + Math.sin(t * 3.1) * 2;
      setPos(Math.max(25, Math.min(75, val)));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const leftPct = Math.round(pos);
  const rightPct = 100 - leftPct;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-mono font-medium text-balanced-text/70">
        <span>L {leftPct}%</span>
        <span>R {rightPct}%</span>
      </div>
      <div className="relative h-5 rounded-full bg-card-border/30 overflow-hidden">
        <div className="absolute top-0 bottom-0 left-[20%] right-[20%] bg-balanced-soft/60 rounded-full" />
        <div className="absolute top-0 bottom-0 left-[35%] right-[35%] bg-balanced-soft rounded-full" />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-balanced shadow-[0_0_10px_rgba(45,156,111,0.5)] transition-[left] duration-75"
          style={{ left: `calc(${pos}% - 8px)` }}
        />
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border-strong/40" />
      </div>
    </div>
  );
}

/* ──────────────────── Stat counter that animates on mount ──────────────────── */

function AnimStat({ end, label, suffix = '' }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let frame;
    const duration = 1200;
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * end));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [end]);

  return (
    <div className="text-center">
      <p className="text-3xl md:text-4xl font-bold text-balanced-text tabular-nums">
        {val}{suffix}
      </p>
      <p className="text-xs text-text-muted mt-1 uppercase tracking-wide">{label}</p>
    </div>
  );
}

/* ──────────────────── Quick stats from real session data ──────────────────── */

function QuickStats() {
  const sessions = getSessions();
  const valid = sessions.filter((s) => s.avgScore != null && s.avgScore > 0);
  const totalSessions = valid.length;
  const avgScore = totalSessions > 0
    ? Math.round(valid.reduce((sum, s) => sum + s.avgScore, 0) / totalSessions)
    : 0;
  const totalMinutes = totalSessions > 0
    ? Math.round(valid.reduce((sum, s) => sum + (s.duration || 0), 0) / 60)
    : 0;

  if (totalSessions === 0) {
    return (
      <Card variant="default" className="p-6 text-center">
        <p className="text-text-muted text-sm">Complete your first session to see your stats here.</p>
      </Card>
    );
  }

  return (
    <Card variant="default" className="p-6">
      <div className="grid grid-cols-3 gap-4">
        <AnimStat end={totalSessions} label="Sessions" />
        <AnimStat end={avgScore} label="Avg Score" suffix="/100" />
        <AnimStat end={totalMinutes} label="Minutes" suffix="m" />
      </div>
    </Card>
  );
}

/* ──────────────────── Feature cards ──────────────────── */

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Live Balance Tracking',
    description: 'Real-time pressure feedback visualized as you stand on the board.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>
      </svg>
    ),
    title: 'Objective Metrics',
    description: 'Balance control score, target-zone time, sway analysis, and weight split.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    title: 'Progress Over Time',
    description: 'Session history and trend charts show measurable recovery progress.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="6" width="20" height="12" rx="2"/>
        <line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/>
        <circle cx="16" cy="10" r="1" fill="currentColor"/><circle cx="18" cy="14" r="1" fill="currentColor"/>
      </svg>
    ),
    title: 'Therapy Games',
    description: 'Engage with balance-controlled games that make rehabilitation fun.',
  },
];

function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {FEATURES.map((f) => (
        <Card key={f.title} variant="default" hover className="p-5 group">
          <div className="w-10 h-10 rounded-xl bg-balanced-soft flex items-center justify-center mb-3 text-balanced-text group-hover:bg-balanced group-hover:text-white transition-colors">
            {f.icon}
          </div>
          <h3 className="text-sm font-bold text-text-primary mb-1">{f.title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed">{f.description}</p>
        </Card>
      ))}
    </div>
  );
}

/* ──────────────────── How it works pipeline ──────────────────── */

function HowItWorks() {
  const steps = [
    { num: '1', title: 'Stand', desc: 'Step on the board' },
    { num: '2', title: 'Calibrate', desc: 'Set your center' },
    { num: '3', title: 'Train', desc: 'Live feedback' },
    { num: '4', title: 'Review', desc: 'Track progress' },
  ];

  return (
    <div className="flex items-start justify-between gap-2">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-start gap-2 flex-1 min-w-0">
          <div className="flex flex-col items-center text-center flex-1">
            <div className="w-10 h-10 rounded-full bg-balanced text-white font-bold flex items-center justify-center text-sm mb-2 shadow-[0_4px_12px_rgba(45,156,111,0.3)]">
              {step.num}
            </div>
            <p className="text-sm font-semibold text-text-primary">{step.title}</p>
            <p className="text-xs text-text-muted mt-0.5">{step.desc}</p>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-shrink-0 mt-4 text-text-disabled">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ──────────────────── Hardware data flow ──────────────────── */

function DataFlow() {
  const nodes = [
    { label: 'Pressure Sensors', icon: '⚡' },
    { label: 'Arduino', icon: '🔌' },
    { label: 'Web Serial', icon: '🌐' },
    { label: 'Dashboard', icon: '📊' },
  ];

  return (
    <Card variant="default" className="p-5">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">Hardware + Software Pipeline</h3>
      <div className="flex items-center justify-between gap-1">
        {nodes.map((node, i) => (
          <div key={node.label} className="flex items-center gap-1 flex-1 min-w-0">
            <div className="flex flex-col items-center text-center flex-1 min-w-0">
              <span className="text-xl mb-1" aria-hidden="true">{node.icon}</span>
              <span className="text-xs text-text-secondary leading-tight">{node.label}</span>
            </div>
            {i < nodes.length - 1 && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-balanced/40 flex-shrink-0" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ──────────────────── Main Home Page ──────────────────── */

export default function HomePage({ patientName, isConnected, isCalibrated, onConnect, onDemo, onNavigate }) {
  const hasWebSerial = typeof navigator !== 'undefined' && 'serial' in navigator;
  const greeting = patientName ? `Welcome back, ${patientName}` : 'Welcome to ReBalance';

  return (
    <div className="space-y-8 relative">
      <FloatingOrbs />

      {/* ── Hero ── */}
      <div className="relative">
        <Card variant="accent" className="p-8 md:p-12 relative overflow-hidden">
          {/* Large green glow */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-balanced/[0.08] blur-[100px] pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-blue-accent/[0.04] blur-[80px] pointer-events-none" aria-hidden="true" />

          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
              {/* Left: copy */}
              <div className="flex-1 min-w-0">
                <ReBalanceLogo className="h-20 w-20 md:h-28 md:w-28 mb-5" zoom={5} />
                <p className="text-sm font-medium text-balanced mb-2 uppercase tracking-widest">{greeting}</p>
                <h2 className="text-3xl md:text-5xl font-extrabold text-text-primary leading-tight mb-4">
                  Objective balance<br />
                  <span className="text-balanced-text">therapy, measured.</span>
                </h2>
                <p className="text-text-secondary text-base md:text-lg max-w-lg mb-6 leading-relaxed">
                  ReBalance turns raw pressure sensor data into clear, actionable balance metrics.
                  Track your recovery with real data — not guesswork.
                </p>

                <div className="flex flex-wrap gap-3">
                  {!isConnected && (
                    <>
                      <button
                        type="button"
                        onClick={onConnect}
                        disabled={!hasWebSerial}
                        title={hasWebSerial ? 'Connect to Arduino via USB' : 'Web Serial API requires Chrome or Edge'}
                        className="px-6 py-3 rounded-xl bg-balanced text-white font-semibold text-sm shadow-[0_4px_16px_rgba(45,156,111,0.35)]
                                   hover:bg-balanced-text hover:shadow-[0_6px_20px_rgba(26,92,66,0.4)] transition-all min-h-11
                                   disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                                   focus-visible:ring-2 focus-visible:ring-balanced focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                      >
                        Connect Board
                      </button>
                      <button
                        type="button"
                        onClick={onDemo}
                        className="px-6 py-3 rounded-xl bg-card border border-card-border text-text-primary font-semibold text-sm
                                   hover:border-balanced/40 hover:text-balanced-text transition-colors min-h-11
                                   focus-visible:ring-2 focus-visible:ring-balanced focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                      >
                        Try Demo Mode
                      </button>
                    </>
                  )}
                  {isConnected && (
                    <button
                      type="button"
                      onClick={() => onNavigate('sessions')}
                      className="px-6 py-3 rounded-xl bg-balanced text-white font-semibold text-sm shadow-[0_4px_16px_rgba(45,156,111,0.35)]
                                 hover:bg-balanced-text transition-all min-h-11
                                 focus-visible:ring-2 focus-visible:ring-balanced focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                    >
                      Start Session
                    </button>
                  )}
                </div>
              </div>

              {/* Right: live balance preview */}
              <div className="flex-shrink-0 w-full md:w-72">
                <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-card-border p-5 shadow-[0_8px_32px_rgba(30,41,59,0.08)]">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
                    {isConnected ? 'Live Preview' : 'Balance Preview'}
                  </p>
                  <AnimatedBalanceBar />
                  <p className="text-xs text-text-muted mt-3 text-center">
                    {isConnected ? 'Board connected — data is live' : 'Simulated — connect board for real data'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Quick stats ── */}
      <QuickStats />

      {/* ── How it works ── */}
      <Card variant="default" className="p-6 md:p-8">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-6 text-center">How It Works</h3>
        <HowItWorks />
      </Card>

      {/* ── Features ── */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">What You Get</h3>
        <FeatureGrid />
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="soft" className="p-6">
          <h3 className="text-sm font-semibold text-balanced-text mb-2">Why Objective Data Matters</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            Balance recovery is often judged by observation alone. ReBalance records pressure data directly,
            helping patients and clinicians track real progress without relying on subjective visual judgment.
          </p>
        </Card>
        <DataFlow />
      </div>
    </div>
  );
}
