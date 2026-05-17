export default function SerialConnect({ serial }) {
  const hasWebSerial = typeof navigator !== 'undefined' && 'serial' in navigator;
  const boardConnected = serial.connected && !serial.demoMode;

  // Determine connection status label
  const statusLabel = serial.demoMode
    ? 'Demo mode active'
    : boardConnected
      ? 'Board connected'
      : 'Board disconnected';

  return (
    <div className="flex items-center gap-3">
      {/* Connection status dot and text label */}
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${
          serial.demoMode ? 'bg-warning' : boardConnected ? 'bg-balanced' : 'bg-text-muted'
        }`} aria-hidden="true" />
        <span className={`text-xs font-medium ${
          serial.demoMode
            ? 'text-warning'
            : boardConnected
              ? 'text-balanced'
              : 'text-text-secondary'
        }`}>
          {statusLabel}
        </span>
      </div>

      {serial.demoMode ? (
        <span className="text-sm text-warning font-medium sr-only">Demo Mode</span>
      ) : boardConnected ? (
        <button
          onClick={serial.disconnect}
          className="text-sm px-3 py-2.5 rounded bg-card border border-card-border
                     text-text-secondary hover:text-danger hover:border-danger transition-colors min-h-11"
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={serial.connect}
          disabled={!hasWebSerial}
          className="text-sm px-3 py-2.5 rounded bg-balanced/10 border border-balanced/30
                     text-balanced hover:bg-balanced/20 transition-colors min-h-11
                     disabled:opacity-40 disabled:cursor-not-allowed"
          title={hasWebSerial ? 'Connect to Arduino via USB' : 'Web Serial API requires Chrome or Edge'}
        >
          Connect Board
        </button>
      )}

      <button
        onClick={serial.toggleDemo}
        className={`text-sm px-3 py-2.5 rounded border transition-colors min-h-11 ${
          serial.demoMode
            ? 'bg-danger/10 border-danger/30 text-danger hover:bg-danger/20'
            : 'bg-card border-card-border text-text-secondary hover:text-text-primary'
        }`}
      >
        {serial.demoMode ? 'Stop Demo' : 'Demo Mode'}
      </button>
    </div>
  );
}
