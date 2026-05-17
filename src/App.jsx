import { useState, useCallback, useRef, useEffect } from 'react';
import { useSerial } from './hooks/useSerial';
import { calculateBalance } from './utils/balanceCalc';
import { getCalibration, getProfile, upsertSession } from './utils/storage';
import SerialConnect from './components/SerialConnect';
import Calibration from './components/Calibration';
import BalanceGame from './components/BalanceGame';
import SessionLog from './components/SessionLog';
import ProgressChart from './components/ProgressChart';
import PatientProfile from './components/PatientProfile';
import PageTransition from './components/PageTransition';
import GettingStartedWizard from './components/GettingStartedWizard';
import TherapyChat from './components/TherapyChat';
import DataTransparency from './components/DataTransparency';
import HomePage from './components/HomePage';

const DISPLAY_UPDATE_MS = 100;

const TAB_ICONS = {
  home: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
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
  { id: 'home', label: 'Home' },
  { id: 'game', label: 'Game' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'progress', label: 'Progress' },
  { id: 'profile', label: 'Profile' },
];

export default function App() {
  const serial = useSerial();
  const [activeTab, setActiveTab] = useState('home');
  const [calibration, setCalibration] = useState(() => getCalibration());
  const [showCalibration, setShowCalibration] = useState(false);
  const [patientName, setPatientName] = useState(() => getProfile().name);
  const [gameHighScore, setGameHighScore] = useState(0);
  const [showWizard, setShowWizard] = useState(() => {
    const profile = getProfile();
    return !profile.name;
  });
  const [showTransparency, setShowTransparency] = useState(false);
  const transparencyRef = useRef(null);

  const valuesRef = useRef(serial.values);
  useEffect(() => { valuesRef.current = serial.values; }, [serial.values]);

  useEffect(() => {
    if (!showTransparency) return;
    function handleClickOutside(e) {
      if (transparencyRef.current && !transparencyRef.current.contains(e.target)) {
        setShowTransparency(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTransparency]);

  // Raw balance — always current, used for game input
  const balance = calculateBalance(serial.values.left, serial.values.right, calibration);

  // Throttled display balance — updates at most every 100ms
  const [displayedBalance, setDisplayedBalance] = useState(balance);
  const lastDisplayUpdateRef = useRef(0);

  useEffect(() => {
    const now = performance.now();
    if (now - lastDisplayUpdateRef.current < DISPLAY_UPDATE_MS) return;
    lastDisplayUpdateRef.current = now;
    setDisplayedBalance(balance);
  }, [balance]);

  const handleCalibrationComplete = useCallback((cal) => {
    setCalibration(cal);
    setShowCalibration(false);
  }, []);

  const handleGameScore = useCallback((score) => {
    setGameHighScore((prev) => Math.max(prev, score));
  }, []);

  const handleGameEnd = useCallback((gameResult) => {
    upsertSession(gameResult);
  }, []);

  const handleWizardComplete = useCallback((name) => {
    setPatientName(name);
    setShowWizard(false);
  }, []);

  return (
    <div className="min-h-screen text-text-primary font-sans" style={{ background: 'radial-gradient(circle at 50% 8%, rgba(45,156,111,0.07), transparent 40%), #FAF8F5' }}>
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
            {/* Icon + wordmark */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-balanced-soft flex items-center justify-center" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-balanced-text">
                  <rect x="2" y="8" width="20" height="8" rx="3" />
                  <circle cx="8" cy="12" r="1.5" fill="currentColor" />
                  <circle cx="16" cy="12" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl text-balanced-text font-bold tracking-tight leading-tight">ReBalance</h1>
                <span className="text-[10px] text-text-muted font-medium tracking-wide uppercase leading-tight">Objective Balance Therapy</span>
              </div>
            </div>
            <div className="relative" ref={transparencyRef}>
              <button
                onClick={() => setShowTransparency(v => !v)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-text-secondary hover:text-balanced-text hover:bg-balanced-soft transition-colors"
                aria-label="Data transparency info"
                title="What data does ReBalance access?"
              >
                <span className="text-sm">🛡️</span>
              </button>
              {showTransparency && (
                <div className="absolute top-full left-0 mt-2 z-50">
                  <DataTransparency variant="popover" />
                </div>
              )}
            </div>
            {patientName && (
              <span className="text-text-secondary text-sm">— {patientName}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCalibration(true)}
              disabled={!serial.connected}
              title={!serial.connected ? 'Connect the board before calibration' : undefined}
              className="text-xs px-3 py-1.5 rounded-full border border-card-border text-text-secondary
                         hover:text-text-primary hover:border-border-strong transition-colors
                         disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {calibration ? 'Recalibrate Center' : 'Calibrate'}
            </button>
            <span role="status">
              <SerialConnect serial={serial} />
            </span>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="border-b border-card-border bg-card">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 py-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 text-sm font-medium transition-all min-h-11 rounded-full px-4 py-2.5 ${
                activeTab === tab.id
                  ? 'bg-balanced-soft text-balanced-text font-bold shadow-[inset_0_0_0_1px_rgba(45,156,111,0.12)]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-card-border/30'
              }`}
            >
              {TAB_ICONS[tab.id]}
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab content */}
      <main className="max-w-6xl mx-auto px-6 py-8" style={{ minHeight: 'calc(100vh - 140px)' }}>
        <PageTransition activeKey={activeTab}>
          {activeTab === 'home' && (
            <HomePage
              patientName={patientName}
              isConnected={serial.connected}
              isCalibrated={!!calibration}
              onConnect={serial.connect}
              onDemo={serial.enableDemo}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === 'game' && (
            <BalanceGame balance={balance} onScoreUpdate={handleGameScore} onGameEnd={handleGameEnd} demoMode={serial.demoMode} />
          )}
          {activeTab === 'sessions' && (
            <SessionLog balance={displayedBalance} gameHighScore={gameHighScore} connected={serial.connected} demoMode={serial.demoMode} calibrated={!!calibration} />
          )}
          {activeTab === 'progress' && (
            <ProgressChart />
          )}
          {activeTab === 'profile' && (
            <PatientProfile onNameChange={setPatientName} />
          )}
        </PageTransition>
      </main>

      <TherapyChat />
    </div>
  );
}
