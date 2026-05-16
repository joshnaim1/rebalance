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

export function deleteSession(sessionId) {
  const sessions = getSessions();
  const updated = sessions.filter((s) => s.id !== sessionId);
  write(KEYS.SESSIONS, updated);
  return updated;
}

export function clearSessions() {
  write(KEYS.SESSIONS, []);
}

// --- Profile ---

const DEFAULT_PROFILE = {
  name: '',
  preferredName: '',
  pronouns: '',
  strokeDate: '',
  affectedSide: '',
  goals: '',
  quickGoals: [],
  feelingToday: {
    pain: null,
    fatigue: null,
    dizziness: null,
    confidence: null,
  },
  notes: '',
};

export function getProfile() {
  const stored = read(KEYS.PROFILE);
  if (!stored) return { ...DEFAULT_PROFILE };
  // Merge with defaults for backward compatibility with old profile records
  return { ...DEFAULT_PROFILE, ...stored };
}

export function saveProfile(profile) {
  write(KEYS.PROFILE, profile);
}

// --- Session Export ---

export function exportSessionsJSON() {
  const profile = getProfile();
  const sessions = getSessions();
  return {
    exportDate: new Date().toISOString(),
    patientName: profile.name,
    sessions: sessions,
  };
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
