import { useState, useEffect, useRef } from 'react';

const ENCOURAGEMENT_THRESHOLDS = [
  { seconds: 15, message: "Amazing focus!" },
  { seconds: 5, message: "Great balance!" },
];

function getMessage(seconds) {
  for (const threshold of ENCOURAGEMENT_THRESHOLDS) {
    if (seconds >= threshold.seconds) {
      return threshold.message;
    }
  }
  return null;
}

export function useStreak(zone) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);
  const zoneRef = useRef(zone);

  useEffect(() => {
    zoneRef.current = zone;

    if (zone !== 'balanced') {
      setSeconds(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Zone is 'balanced' — start counting if not already
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (zoneRef.current === 'balanced') {
          setSeconds((s) => s + 1);
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [zone]);

  const message = getMessage(seconds);

  return { seconds, message };
}
