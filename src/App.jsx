import { useState, useCallback, useRef, useEffect } from 'react';
import { useSerial } from './hooks/useSerial';
import { calculateBalance } from './utils/balanceCalc';
import { getCalibration, getProfile } from './utils/storage';
import SerialConnect from './components/SerialConnect';
import Calibration from './components/Calibration';
import BalanceMeter from './components/BalanceMeter';
import BalanceGame from './components/BalanceGame';
import SessionLog from './components/SessionLog';
import ProgressChart from './components/ProgressChart';
import PatientProfile from './components/PatientProfile';
import PageTransition from './components/PageTransition';
import GettingStartedWizard from './components/GettingStartedWizard';

const TAB_ICONS = {
  balance: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  game: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <line x1="6" y1="12" x2="10" y2="12"/>
      <line x1="8" y1="10" x2="8" y2="14"/>
      <circle cx="16" cy="10" r="1" fill="currentColor"/>
      <circle cx="18" cy="14" r="1" fill="currentColor"/>
    </svg>
  ),
  sessions: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  progress: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  profile: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

const TABS = [
  { id: 'balance', label: 'Live Balance' },
  { id: 'game', label: 'Game' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'progress', label: 'Progress' },
  { id: 'profile', label: 'Profile' },
];

export default function App() {
  const serial = useSerial();
  const [activeTab, setActiveTab] = useState('balance');
  const [calibration, setCalibration] = useState(() => getCalibration());
  const [showCalibration, setShowCalibration] = useState(false);
  const [patientName, setPatientName] = useState(() => getProfile().name);
  const [gameHighScore, setGameHighScore] = useState(0);
  const [showWizard, setShowWizard] = useState(() => {
    const profile = getProfile();
    return !profile.name;
  });

  const valuesRef = useRef(serial.values);
  useEffect(() => { valuesRef.current = serial.values; }, [serial.values]);

  const balance = calculateBalance(serial.values.left, serial.values.right, calibration);

  const handleCalibrationComplete = useCallback((cal) => {
    setCalibration(cal);
    setShowCalibration(false);
  }, []);

  const handleGameScore = useCallback((score) => {
    setGameHighScore((prev) => Math.max(prev, score));
  }, []);

  const handleWizardComplete = useCallback((name) => {
    setPatientName(name);
    setShowWizard(false);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans">
      {/* Getting Started Wizard */}
      {showWizard && (
        <GettingStartedWizard onComplete={handleWizardComplete} />
      )}

      {/* Calibration overlay */}
      {showCalibration && (
        <Calibration
          valuesRef={valuesRef}
          onComplete={handleCalibrationComplete}
          onCancel={() => setShowCalibration(false)}
        />
      )}

      {/* Header */}
      <header className="bg-card border-b border-card-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl text-balanced-text font-bold tracking-tight">BalanceBack</h1>
            {patientName && (
              <span className="text-text-secondary text-sm">— {patientName}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <button
                onClick={() => setShowCalibration(true)}
                disabled={!serial.connected}
                className="text-xs px-3 py-2.5 rounded border border-card-border bg-card text-text-secondary
                           hover:bg-bg hover:text-text-primary hover:border-border-strong transition-colors
                           disabled:opacity-30 disabled:cursor-not-allowed min-h-11"
              >
                {calibration ? 'Recalibrate' : 'Calibrate'}
              </button>
              {!serial.connected && (
                <span className="text-xs text-text-muted mt-0.5">
                  Connect board to calibrate
                </span>
              )}
            </div>
            <span role="status">
              <SerialConnect serial={serial} />
            </span>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="border-b border-card-border">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 py-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors min-h-11 ${
                activeTab === tab.id
                  ? 'bg-balanced-soft text-balanced-text rounded-full px-4 py-2.5'
                  : 'text-text-secondary hover:text-text-primary px-4 py-2.5'
              }`}
            >
              {TAB_ICONS[tab.id]}
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <PageTransition activeKey={activeTab}>
          {activeTab === 'balance' && (
            <BalanceMeter balance={balance} connected={serial.connected} demoMode={serial.demoMode} calibrated={!!calibration} />
          )}
          {activeTab === 'game' && (
            <BalanceGame balance={balance} onScoreUpdate={handleGameScore} />
          )}
          {activeTab === 'sessions' && (
            <SessionLog balance={balance} gameHighScore={gameHighScore} connected={serial.connected} />
          )}
          {activeTab === 'progress' && (
            <ProgressChart />
          )}
          {activeTab === 'profile' && (
            <PatientProfile onNameChange={setPatientName} />
          )}
        </PageTransition>
      </main>
    </div>
  );
}
