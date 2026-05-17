import Card from './ui/Card';

export default function BalanceMeterPreview() {
  return (
    <Card variant="default" className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted" aria-hidden="true">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Balance Meter Preview</h3>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-base font-mono font-medium text-text-disabled">
          <span>LEFT 50%</span>
          <span>RIGHT 50%</span>
        </div>

        <div className="relative h-7 rounded-full">
          <div className="absolute inset-0 bg-card-border/40 rounded-full overflow-hidden" />
          <div className="absolute top-0 bottom-0 left-[35%] right-[35%] bg-balanced-soft/50 rounded-full overflow-hidden" />

          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-text-disabled/60"
            style={{ left: 'calc(50% - 8px)' }}
          />

          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border-strong/50" />
        </div>

        <div className="flex justify-between text-xs text-text-disabled">
          <span>All Left</span>
          <span>Centered</span>
          <span>All Right</span>
        </div>
      </div>

      <p className="text-sm text-text-muted mt-4 text-center italic">
        Preview only — connect board for live readings.
      </p>
    </Card>
  );
}
