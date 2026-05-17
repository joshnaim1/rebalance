import Card from './ui/Card';

const CHECK_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-balanced" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const CIRCLE_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-disabled" aria-hidden="true">
    <circle cx="12" cy="12" r="9"/>
  </svg>
);

function ReadinessItem({ done, label, detail }) {
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="flex-shrink-0">{done ? CHECK_ICON : CIRCLE_ICON}</span>
      <span className={`text-sm ${done ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
        {label}
        {detail && <span className="text-text-secondary ml-1">— {detail}</span>}
      </span>
      <span className="sr-only">{done ? 'Complete' : 'Pending'}</span>
    </li>
  );
}

export default function SessionReadinessCard({ profileName, isConnected, isCalibrated }) {
  return (
    <Card variant="default" className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-balanced-text" aria-hidden="true">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Session Readiness</h3>
      </div>
      <ul className="divide-y divide-card-border/60" role="list">
        <ReadinessItem done={!!profileName} label="Profile selected" detail={profileName || undefined} />
        <ReadinessItem done={isConnected} label="Board connected" />
        <ReadinessItem done={isCalibrated} label="Calibration complete" />
        <ReadinessItem done={false} label="Safe stance confirmed" />
        <ReadinessItem done={false} label="Ready to record session" />
      </ul>
    </Card>
  );
}
