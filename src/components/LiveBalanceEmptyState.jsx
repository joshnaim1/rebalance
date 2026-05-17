import Card from './ui/Card';
import ReBalanceLogo from './ReBalanceLogo';
import BalanceMeterPreview from './BalanceMeterPreview';
import SessionReadinessCard from './SessionReadinessCard';
import { getSessions } from '../utils/storage';

function LastSessionSummary() {
  const sessions = getSessions();
  const valid = sessions.filter((s) => s.avgScore != null && s.avgScore > 0);
  const last = valid.length > 0 ? valid[valid.length - 1] : null;

  const formatDuration = (sec) => {
    if (!sec) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (!last) {
    return (
      <Card variant="default" className="p-5">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Last Session</h3>
        <p className="text-sm text-text-muted">No sessions recorded yet.</p>
      </Card>
    );
  }

  return (
    <Card variant="default" className="p-5">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Last Session</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-text-muted">Score</p>
          <p className="text-lg font-bold text-text-primary">{Math.round(last.avgScore)} <span className="text-sm font-normal text-text-muted">/ 100</span></p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Duration</p>
          <p className="text-lg font-bold text-text-primary">{formatDuration(last.duration)}</p>
        </div>
      </div>
    </Card>
  );
}

export default function LiveBalanceEmptyState({ profileName, isCalibrated, onConnect, onDemo }) {
  const hasWebSerial = typeof navigator !== 'undefined' && 'serial' in navigator;

  return (
    <div className="space-y-6">
      <h2 className="sr-only">Live Balance — Start a Session</h2>

      {/* Session start card */}
      <Card variant="accent" className="p-8 relative overflow-hidden">
        <div className="absolute -top-16 right-0 w-64 h-64 rounded-full bg-balanced/5 blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative text-center">
          <ReBalanceLogo className="h-20 w-20 md:h-24 md:w-24 mx-auto mb-5" zoom={5} />

          <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-2">
            Start a Balance Session
          </h2>
          <p className="text-text-secondary text-sm md:text-base max-w-md mx-auto mb-6">
            Connect your board or try Demo Mode to begin live balance tracking.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onConnect}
              disabled={!hasWebSerial}
              title={hasWebSerial ? 'Connect to Arduino via USB' : 'Web Serial API requires Chrome or Edge'}
              className="px-5 py-2.5 rounded-xl bg-balanced text-white font-semibold text-sm
                         hover:bg-balanced-text transition-colors min-h-11
                         disabled:opacity-40 disabled:cursor-not-allowed
                         focus-visible:ring-2 focus-visible:ring-balanced focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Connect Board
            </button>
            <button
              type="button"
              onClick={onDemo}
              className="px-5 py-2.5 rounded-xl bg-card border border-card-border text-text-primary font-semibold text-sm
                         hover:border-balanced/40 hover:text-balanced-text transition-colors min-h-11
                         focus-visible:ring-2 focus-visible:ring-balanced focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Try Demo Mode
            </button>
          </div>
        </div>
      </Card>

      {/* Two-column: meter preview + readiness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BalanceMeterPreview />
        <SessionReadinessCard
          profileName={profileName}
          isConnected={false}
          isCalibrated={isCalibrated}
        />
      </div>

      {/* Last session summary */}
      <LastSessionSummary />
    </div>
  );
}
