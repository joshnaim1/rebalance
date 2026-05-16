import { useState, useCallback, useRef, useEffect } from 'react';

export function useSerial() {
  const [boardConnected, setBoardConnected] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [values, setValues] = useState({ left: 0, right: 0 });
  const [ready, setReady] = useState(false);

  const portRef = useRef(null);
  const readerRef = useRef(null);
  const readableStreamClosedRef = useRef(null);
  const demoIntervalRef = useRef(null);
  const demoTimeRef = useRef(0);

  const connected = boardConnected || demoMode;

  // --- Internal: close serial port ---
  const closePort = useCallback(async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (readableStreamClosedRef.current) {
        await readableStreamClosedRef.current.catch(() => {});
        readableStreamClosedRef.current = null;
      }
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
    } catch (err) {
      console.error('Serial close error:', err);
    }
    setBoardConnected(false);
    setReady(false);
  }, []);

  // --- Internal: stop demo interval ---
  const stopDemoInterval = useCallback(() => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
  }, []);

  // --- Web Serial connect ---
  const connect = useCallback(async () => {
    if (!navigator.serial) {
      console.error('Web Serial API not supported. Use Chrome or Edge.');
      return;
    }

    // Stop demo if running
    if (demoIntervalRef.current) {
      stopDemoInterval();
      setDemoMode(false);
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      setBoardConnected(true);

      const decoder = new TextDecoderStream();
      readableStreamClosedRef.current = port.readable.pipeTo(decoder.writable);
      const reader = decoder.readable.getReader();
      readerRef.current = reader;

      let buffer = '';

      const readLoop = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += value;

            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed === 'BALANCEBACK_READY') {
                setReady(true);
                continue;
              }
              const parts = trimmed.split(',');
              if (parts.length === 2) {
                const left = parseInt(parts[0], 10);
                const right = parseInt(parts[1], 10);
                if (!isNaN(left) && !isNaN(right)) {
                  setValues({ left, right });
                }
              }
            }
          }
        } catch (err) {
          if (err.name !== 'CancelError') {
            console.error('Serial read error:', err);
          }
        } finally {
          setBoardConnected(false);
          setReady(false);
        }
      };

      readLoop();
    } catch (err) {
      console.error('Serial connection failed:', err);
      setBoardConnected(false);
    }
  }, [stopDemoInterval]);

  // --- Web Serial disconnect ---
  const disconnect = useCallback(async () => {
    await closePort();
    setValues({ left: 0, right: 0 });
  }, [closePort]);

  // --- Demo mode ---
  const enableDemo = useCallback(async () => {
    // Disconnect board first if connected
    if (portRef.current) {
      await closePort();
    }

    setDemoMode(true);
    setReady(true);
    demoTimeRef.current = 0;

    demoIntervalRef.current = setInterval(() => {
      demoTimeRef.current += 50;
      const t = demoTimeRef.current / 1000;

      const base = 880;
      const maxSwing = 150;
      const primaryWave = Math.sin(t * 0.7) * maxSwing * 0.5;
      const secondaryWave = Math.sin(t * 1.9) * maxSwing * 0.2;
      const noise = (Math.random() - 0.5) * 15;

      const burstPhase = Math.sin(t * 0.15);
      const burst = burstPhase > 0.85 ? Math.sin(t * 2.5) * maxSwing * 0.7 : 0;

      const shift = primaryWave + secondaryWave + noise + burst;

      const left = Math.round(Math.max(600, Math.min(970, base + shift)));
      const right = Math.round(Math.max(600, Math.min(970, base - shift)));

      setValues({ left, right });
    }, 50);
  }, [closePort]);

  const disableDemo = useCallback(() => {
    stopDemoInterval();
    setDemoMode(false);
    setReady(false);
    setValues({ left: 0, right: 0 });
  }, [stopDemoInterval]);

  const toggleDemo = useCallback(() => {
    if (demoMode) {
      disableDemo();
    } else {
      enableDemo();
    }
  }, [demoMode, enableDemo, disableDemo]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopDemoInterval();
    };
  }, [stopDemoInterval]);

  // Expose on window for console debugging in dev
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.__serial = { values, connected, demoMode, ready, boardConnected };
    }
  }, [values, connected, demoMode, ready, boardConnected]);

  return {
    connected,
    demoMode,
    boardConnected,
    values,
    ready,
    connect,
    disconnect,
    enableDemo,
    disableDemo,
    toggleDemo,
  };
}
