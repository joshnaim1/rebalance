const KEYS = {
  SESSIONS: 'balanceback_sessions',
  PROFILE: 'balanceback_profile',
  CALIBRATION: 'balanceback_calibration',
};

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// --- Sessions ---

export function getSessions() {
  return read(KEYS.SESSIONS) || [];
}

export function saveSession(session) {
  const sessions = getSessions();
  sessions.push({ ...session, id: Date.now() });
  write(KEYS.SESSIONS, sessions);
  return sessions;
}

export function clearSessions() {
  write(KEYS.SESSIONS, []);
}

// --- Profile ---

export function getProfile() {
  return read(KEYS.PROFILE) || {
    name: '',
    strokeDate: '',
    affectedSide: '',
    goals: '',
    notes: '',
  };
}

export function saveProfile(profile) {
  write(KEYS.PROFILE, profile);
}

// --- Calibration ---

export function getCalibration() {
  return read(KEYS.CALIBRATION);
}

export function saveCalibration(calibration) {
  write(KEYS.CALIBRATION, calibration);
}

export function clearCalibration() {
  localStorage.removeItem(KEYS.CALIBRATION);
}
