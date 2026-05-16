export default function SerialConnect({ serial }) {
  const hasWebSerial = typeof navigator !== 'undefined' && 'serial' in navigator;
  const boardConnected = serial.connected && !serial.demoMode;

  return (
    <div className="flex items-center gap-3">
      {/* Connection status dot */}
      <div className={`w-2.5 h-2.5 rounded-full ${
        serial.demoMode ? 'bg-warning' : boardConnected ? 'bg-balanced' : 'bg-text-muted'
      }`} />

      {serial.demoMode ? (
        <span className="text-sm text-warning font-medium">Demo Mode</span>
      ) : boardConnected ? (
        <button
          onClick={serial.disconnect}
          className="text-sm px-3 py-1.5 rounded bg-card border border-card-border
                     text-text-secondary hover:text-danger hover:border-danger transition-colors"
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={serial.connect}
          disabled={!hasWebSerial}
          className="text-sm px-3 py-1.5 rounded bg-balanced/10 border border-balanced/30
                     text-balanced hover:bg-balanced/20 transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
          title={hasWebSerial ? 'Connect to Arduino via USB' : 'Web Serial API requires Chrome or Edge'}
        >
          Connect Board
        </button>
      )}

      <button
        onClick={serial.toggleDemo}
        className={`text-sm px-3 py-1.5 rounded border transition-colors ${
          serial.demoMode
            ? 'bg-danger/10 border-danger/30 text-danger hover:bg-danger/20'
            : 'bg-card border-card-border text-text-muted hover:text-text-secondary'
        }`}
      >
        {serial.demoMode ? 'Stop Demo' : 'Demo Mode'}
      </button>
    </div>
  );
}
