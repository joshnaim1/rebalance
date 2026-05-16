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

  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans">
      {/* Calibration overlay */}
      {showCalibration && (
        <Calibration
          valuesRef={valuesRef}
          onComplete={handleCalibrationComplete}
          onCancel={() => setShowCalibration(false)}
        />
      )}

      {/* Header */}
      <header className="border-b border-card-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">BalanceBack</h1>
            {patientName && (
              <span className="text-text-muted text-sm">— {patientName}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCalibration(true)}
              disabled={!serial.connected}
              className="text-xs px-2.5 py-1 rounded border border-card-border text-text-muted
                         hover:text-text-secondary transition-colors
                         disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {calibration ? 'Recalibrate' : 'Calibrate'}
            </button>
            <SerialConnect serial={serial} />
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="border-b border-card-border">
        <div className="max-w-6xl mx-auto px-4 flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-balanced text-balanced'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'balance' && (
          <BalanceMeter balance={balance} connected={serial.connected} />
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
      </main>
    </div>
  );
}
