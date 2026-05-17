const KEYS = {
  SESSIONS: 'balanceback_sessions',
  PROFILE: 'balanceback_profile',
  CALIBRATION: 'balanceback_calibration',
  PRIVACY_DISMISSED: 'balanceback_privacy_dismissed',
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

// --- ID Generation ---

/**
 * Generate a stable unique session ID.
 * Uses crypto.randomUUID() when available, falls back to timestamp + random.
 */
export function generateSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// --- Session Deduplication ---

/**
 * Create a fingerprint for sessions without IDs (legacy data).
 * Uses date + duration + avgScore + gameHighScore as a composite key.
 */
function sessionFingerprint(session) {
  return `${session.date || ''}|${session.duration || 0}|${session.avgScore || 0}|${session.gameHighScore || 0}`;
}

/**
 * Deduplicate sessions array.
 * - For sessions with IDs: keep the most complete version (prefer one with aiNote, more fields).
 * - For sessions without IDs: use fingerprint-based dedup, assign IDs.
 * Returns a new deduplicated array with all sessions having IDs.
 */
export function dedupeSessions(sessions) {
  if (!Array.isArray(sessions)) return [];

  const byId = new Map();
  const byFingerprint = new Map();

  for (const session of sessions) {
    if (session.id) {
      const existing = byId.get(session.id);
      if (existing) {
        // Keep the more complete version
        byId.set(session.id, pickMoreComplete(existing, session));
      } else {
        byId.set(session.id, session);
      }
    } else {
      // Legacy session without ID — use fingerprint
      const fp = sessionFingerprint(session);
      const existing = byFingerprint.get(fp);
      if (existing) {
        byFingerprint.set(fp, pickMoreComplete(existing, session));
      } else {
        byFingerprint.set(fp, session);
      }
    }
  }

  // Assign IDs to legacy sessions
  const result = [];
  for (const session of byId.values()) {
    result.push(session);
  }
  for (const session of byFingerprint.values()) {
    result.push({ ...session, id: generateSessionId() });
  }

  // Sort by date ascending
  result.sort((a, b) => new Date(a.date) - new Date(b.date));
  return result;
}

/**
 * Pick the more complete of two session objects.
 * Prefers the one with aiNote, more keys, or later updatedAt.
 */
function pickMoreComplete(a, b) {
  if (b.aiNote && !a.aiNote) return b;
  if (a.aiNote && !b.aiNote) return a;
  if (b.updatedAt && a.updatedAt && b.updatedAt > a.updatedAt) return b;
  if (Object.keys(b).length > Object.keys(a).length) return b;
  return a;
}

// --- Sessions ---

/**
 * Get all sessions from localStorage, deduplicating on first load.
 */
export function getSessions() {
  const raw = read(KEYS.SESSIONS) || [];
  return raw;
}

/**
 * Load sessions with deduplication (call once on app init).
 * Cleans up any existing duplicates and ensures all sessions have IDs.
 */
export function loadAndCleanSessions() {
  const raw = read(KEYS.SESSIONS) || [];
  const cleaned = dedupeSessions(raw);
  // Only write back if we actually changed something
  if (cleaned.length !== raw.length || raw.some((s) => !s.id)) {
    write(KEYS.SESSIONS, cleaned);
  }
  return cleaned;
}

/**
 * Save the entire sessions array to localStorage.
 */
export function saveSessions(sessions) {
  write(KEYS.SESSIONS, sessions);
  return sessions;
}

/**
 * Upsert a session: if session.id exists in the array, replace it.
 * Otherwise append it. Never allows two sessions with the same id.
 */
export function upsertSession(session) {
  if (!session || !session.id) {
    throw new Error('upsertSession requires a session with an id');
  }
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = { ...sessions[idx], ...session, updatedAt: new Date().toISOString() };
  } else {
    sessions.push({ ...session, updatedAt: new Date().toISOString() });
  }
  write(KEYS.SESSIONS, sessions);
  return sessions;
}

/**
 * Update an existing session by ID with a partial patch.
 */
export function updateSessionById(id, patch) {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx >= 0) {
    sessions[idx] = { ...sessions[idx], ...patch, updatedAt: new Date().toISOString() };
    write(KEYS.SESSIONS, sessions);
  }
  return sessions;
}

/**
 * Delete a session by its ID.
 */
export function deleteSessionById(id) {
  const sessions = getSessions();
  const updated = sessions.filter((s) => s.id !== id);
  write(KEYS.SESSIONS, updated);
  return updated;
}

/**
 * Legacy saveSession — kept for backward compatibility but now uses upsert.
 * @deprecated Use upsertSession instead.
 */
export function saveSession(session) {
  const sessionWithId = {
    ...session,
    id: session.id || generateSessionId(),
  };
  return upsertSession(sessionWithId);
}

/**
 * Legacy deleteSession — delegates to deleteSessionById.
 * @deprecated Use deleteSessionById instead.
 */
export function deleteSession(sessionId) {
  return deleteSessionById(sessionId);
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
