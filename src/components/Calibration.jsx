import { useState, useEffect, useRef } from 'react';
import { saveCalibration } from '../utils/storage';

const SAMPLE_COUNT = 100;
const TOTAL_DURATION_S = 5;

export default function Calibration({ valuesRef, onComplete, onCancel }) {
  const [sampleCount, setSampleCount] = useState(0);
  const [phase, setPhase] = useState('ready');
  const [result, setResult] = useState(null);
  const [liveDisplay, setLiveDisplay] = useState({ left: 0, right: 0 });
  const samplesRef = useRef([]);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);

  function startCapture() {
    setPhase('capturing');
    samplesRef.current = [];
    setSampleCount(0);
    startTimeRef.current = performance.now();

    function sample() {
      const v = valuesRef.current;
      samplesRef.current.push({ left: v.left, right: v.right });
      setSampleCount(samplesRef.current.length);
      setLiveDisplay({ left: v.left, right: v.right });

      if (samplesRef.current.length >= SAMPLE_COUNT) {
        const all = samplesRef.current;
        const avgLeft = Math.round(all.reduce((s, val) => s + val.left, 0) / all.length);
        const avgRight = Math.round(all.reduce((s, val) => s + val.right, 0) / all.length);

        const calibration = { left: avgLeft, right: avgRight, timestamp: Date.now() };
        saveCalibration(calibration);
        setResult(calibration);
        setPhase('done');

        setTimeout(() => onComplete(calibration), 1000);
        return;
      }

      const targetInterval = (TOTAL_DURATION_S * 1000) / SAMPLE_COUNT;
      const nextSampleTime = startTimeRef.current + samplesRef.current.length * targetInterval;
      const delay = Math.max(0, nextSampleTime - performance.now());

      rafRef.current = setTimeout(sample, delay);
    }

    sample();
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) clearTimeout(rafRef.current);
    };
  }, []);

  const progress = sampleCount / SAMPLE_COUNT;

  return (
    <div className="fixed inset-0 z-50 bg-bg/95 flex items-center justify-center p-6">
      <div className="bg-card border border-card-border rounded-2xl p-8 max-w-lg w-full text-center space-y-6">
        <h2 className="text-2xl font-bold text-text-primary">Calibration</h2>

        {phase === 'ready' && (
          <>
            <p className="text-lg text-text-secondary leading-relaxed">
              Stand on the board with your weight <strong className="text-text-primary">evenly distributed</strong> between both feet.
            </p>
            <div className="bg-bg/50 rounded-lg p-4 text-left text-sm text-text-secondary space-y-2">
              <p><strong className="text-text-secondary">Why calibrate?</strong></p>
              <p>Your sensors may not read identical values even when your weight is perfectly centered. Calibration captures a baseline so the dashboard knows what "balanced" looks like for <em>your</em> board.</p>
              <p>After calibrating, the balance meter will show accurate left/right percentages relative to your true center.</p>
            </div>
            <p className="text-text-secondary text-sm">
              Hold still for {TOTAL_DURATION_S} seconds.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={startCapture}
                className="px-6 py-3 rounded-lg bg-balanced-text text-white font-semibold text-lg
                           hover:bg-balanced-text/90 transition-colors"
              >
                Start Calibration
              </button>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-6 py-3 rounded-lg border border-card-border text-text-secondary
                             hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </>
        )}

        {phase === 'capturing' && (
          <>
            <p className="text-lg text-warning font-medium">Hold still...</p>
            <div className="w-full bg-card-border rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-balanced rounded-full transition-all duration-100"
                style={{ width: `${progress * 100}%` }}
                role="progressbar"
                aria-valuenow={Math.round(progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Calibration progress"
              />
            </div>
            <p className="text-text-secondary text-sm font-medium">
              {Math.round(progress * 100)}% complete
            </p>
            <p className="text-text-secondary text-sm">
              {Math.ceil(TOTAL_DURATION_S * (1 - progress))} seconds remaining
            </p>
            <p className="text-text-secondary text-sm">
              {sampleCount} / {SAMPLE_COUNT} samples
            </p>
            <div className="grid grid-cols-2 gap-4 font-mono text-sm text-text-secondary">
              <div>Left: {liveDisplay.left}</div>
              <div>Right: {liveDisplay.right}</div>
            </div>
          </>
        )}

        {phase === 'done' && result && (
          <>
            <div className="text-5xl text-balanced">&#10003;</div>
            <p className="text-lg text-balanced font-medium">Calibration Complete</p>
            <div className="grid grid-cols-2 gap-4 font-mono text-sm text-text-secondary">
              <div>Left baseline: {result.left}</div>
              <div>Right baseline: {result.right}</div>
            </div>
            <p className="text-text-secondary text-xs">
              Offset: {result.left - result.right > 0 ? 'left reads higher' : result.right - result.left > 0 ? 'right reads higher' : 'sensors are even'} by {Math.abs(result.left - result.right)} counts
            </p>
          </>
        )}
      </div>
    </div>
  );
}
