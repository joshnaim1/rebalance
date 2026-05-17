const TREND_THRESHOLDS = {
  balanceScore: 3,
  timeInTargetZonePct: 5,
  swayPercentChange: 5,
  durationSeconds: 10,
};

const MIN_VALID_DURATION = 10;
const MIN_COMMIT_DURATION = 2;

const DEFAULT_TARGET_RANGE = { lower: 45, upper: 55 };

/**
 * Calculate comprehensive session metrics from raw sample data collected
 * during a session.
 *
 * @param {Object} raw - Raw accumulator values from the session
 * @param {number} raw.scoreSum - Sum of all balance scores
 * @param {number} raw.scoreSamples - Number of valid active samples
 * @param {number} raw.timeInBalanced - Seconds spent with score >= 70
 * @param {number} raw.elapsed - Total session duration in seconds
 * @param {number[]} [raw.balanceRatios] - Array of left% values per sample
 * @param {Object} [options]
 * @param {Object} [options.targetRange] - { lower, upper } in left% terms
 * @param {string|null} [options.affectedSide] - 'left' | 'right' | 'both' | null
 * @returns {Object} Calculated session metrics
 */
export function calculateSessionMetrics(raw, options = {}) {
  const {
    scoreSum = 0,
    scoreSamples = 0,
    timeInBalanced = 0,
    elapsed = 0,
    balanceRatios = [],
  } = raw;

  const targetRange = options.targetRange || DEFAULT_TARGET_RANGE;

  const avgBalanceScore = scoreSamples > 0 ? Math.round(scoreSum / scoreSamples) : 0;

  let timeInTargetZonePct = 0;
  if (balanceRatios.length > 0) {
    const inZone = balanceRatios.filter(
      (leftPct) => leftPct >= targetRange.lower && leftPct <= targetRange.upper
    ).length;
    timeInTargetZonePct = Math.round((inZone / balanceRatios.length) * 100);
  } else if (elapsed > 0 && scoreSamples > 0) {
    timeInTargetZonePct = Math.round((timeInBalanced / elapsed) * 100);
  }

  let swayStdDev = 0;
  let avgLeftPct = 50;
  let avgRightPct = 50;

  if (balanceRatios.length > 1) {
    const mean = balanceRatios.reduce((a, b) => a + b, 0) / balanceRatios.length;
    avgLeftPct = Math.round(mean * 10) / 10;
    avgRightPct = Math.round((100 - mean) * 10) / 10;
    const variance =
      balanceRatios.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
      balanceRatios.length;
    swayStdDev = Math.round(Math.sqrt(variance) * 100) / 100;
  } else if (scoreSamples > 0) {
    avgLeftPct = 50;
    avgRightPct = 50;
    swayStdDev = 0;
  }

  const isValid = elapsed >= MIN_COMMIT_DURATION && scoreSamples > 0;
  const isMeaningful = elapsed >= MIN_VALID_DURATION;

  return {
    avgBalanceScore,
    timeInTargetZonePct,
    swayStdDev,
    avgLeftPct,
    avgRightPct,
    durationSeconds: elapsed,
    validSampleCount: scoreSamples,
    isValid,
    isMeaningful,
  };
}

/**
 * Compare current session metrics to a previous session, producing deltas.
 *
 * @param {Object} current - Current session record
 * @param {Object|null} previous - Previous valid session, or null
 * @returns {Object} Trend deltas (null values when no comparison available)
 */
export function compareToPreviousSession(current, previous) {
  if (!previous) {
    return {
      balanceScoreDelta: null,
      timeInTargetZoneDelta: null,
      swayPercentChange: null,
      durationDeltaSeconds: null,
      isFirstSession: true,
    };
  }

  const balanceScoreDelta =
    (current.avgBalanceScore ?? current.avgScore ?? 0) -
    (previous.avgBalanceScore ?? previous.avgScore ?? 0);

  const currentZone = current.timeInTargetZonePct ?? 0;
  const previousZone = previous.timeInTargetZonePct ?? 0;
  const timeInTargetZoneDelta = currentZone - previousZone;

  let swayPercentChange = null;
  const currentSway = current.swayStdDev;
  const previousSway = previous.swayStdDev;
  if (
    currentSway != null &&
    previousSway != null &&
    previousSway > 0
  ) {
    swayPercentChange = Math.round(
      ((currentSway - previousSway) / previousSway) * 100
    );
  }

  const currentDuration = current.durationSeconds ?? current.duration ?? 0;
  const previousDuration = previous.durationSeconds ?? previous.duration ?? 0;
  const durationDeltaSeconds = currentDuration - previousDuration;

  return {
    balanceScoreDelta,
    timeInTargetZoneDelta,
    swayPercentChange,
    durationDeltaSeconds,
    isFirstSession: false,
  };
}

/**
 * Get a human-readable trend label for a numeric change.
 *
 * @param {number|null} value - The delta or percent change
 * @param {number} threshold - Minimum magnitude to count as a real change
 * @param {'higher_better'|'lower_better'} [direction='higher_better']
 * @returns {{ label: string, icon: string, sentiment: 'positive'|'negative'|'neutral'|'baseline' }}
 */
export function getTrendLabel(value, threshold, direction = 'higher_better') {
  if (value == null) {
    return { label: 'Baseline', icon: '◆', sentiment: 'baseline' };
  }

  const absValue = Math.abs(value);
  if (absValue < threshold) {
    return { label: 'Stable', icon: '→', sentiment: 'neutral' };
  }

  const isIncrease = value > 0;
  const isGood =
    direction === 'higher_better' ? isIncrease : !isIncrease;

  if (isGood) {
    return { label: 'Improved', icon: '↑', sentiment: 'positive' };
  }
  return { label: 'Needs attention', icon: '↓', sentiment: 'negative' };
}

/**
 * Get a stability-specific trend label for sway changes.
 *
 * @param {number|null} swayPercentChange
 * @returns {{ label: string, description: string, sentiment: string }}
 */
export function getSwayTrendLabel(swayPercentChange) {
  if (swayPercentChange == null) {
    return {
      label: 'Baseline',
      description: 'Future sessions will compare against this result.',
      sentiment: 'baseline',
    };
  }

  const abs = Math.abs(swayPercentChange);
  if (abs < TREND_THRESHOLDS.swayPercentChange) {
    return {
      label: 'Stable',
      description: `Sway changed by less than ${TREND_THRESHOLDS.swayPercentChange}%.`,
      sentiment: 'neutral',
    };
  }

  if (swayPercentChange < 0) {
    return {
      label: 'Steadier',
      description: `Sway reduced by ${abs}%.`,
      sentiment: 'positive',
    };
  }

  return {
    label: 'More variable',
    description: `Sway increased by ${abs}%.`,
    sentiment: 'negative',
  };
}

/**
 * Describe weight bias in patient-friendly language.
 *
 * @param {number} avgLeftPct
 * @param {number} avgRightPct
 * @param {string|null} [affectedSide]
 * @returns {string}
 */
export function getWeightBiasDescription(avgLeftPct, avgRightPct, affectedSide = null) {
  const diff = Math.abs(avgLeftPct - avgRightPct);
  const leanSide = avgLeftPct > avgRightPct ? 'left' : 'right';

  if (diff < 3) {
    return 'Well-centered weight distribution.';
  }

  const intensity = diff < 8 ? 'Slight' : 'Moderate';

  if (affectedSide && leanSide !== affectedSide) {
    return `${intensity} ${leanSide} preference. Consider increasing loading on affected ${affectedSide} side.`;
  }

  if (affectedSide && leanSide === affectedSide) {
    return `${intensity} loading on affected ${affectedSide} side — good progress.`;
  }

  return `${intensity} ${leanSide} preference.`;
}

/**
 * Generate a plain-language overall progress statement.
 *
 * @param {Object} current - Current session metrics
 * @param {Object} trend - Output of compareToPreviousSession
 * @returns {string}
 */
export function generateSessionInsight(current, trend) {
  if (trend.isFirstSession) {
    return 'Baseline session recorded.';
  }

  const scoreTrend = getTrendLabel(
    trend.balanceScoreDelta,
    TREND_THRESHOLDS.balanceScore
  );

  const zoneTrend = getTrendLabel(
    trend.timeInTargetZoneDelta,
    TREND_THRESHOLDS.timeInTargetZonePct
  );

  const positives = [scoreTrend, zoneTrend].filter(
    (t) => t.sentiment === 'positive'
  ).length;
  const negatives = [scoreTrend, zoneTrend].filter(
    (t) => t.sentiment === 'negative'
  ).length;

  if (positives > negatives) {
    return 'Improved balance control compared with your last session.';
  }
  if (negatives > positives) {
    return 'This session showed more balance variation than last time.';
  }
  return 'Your balance control was consistent with your last session.';
}

/**
 * Generate a next-session recommendation.
 *
 * @param {Object} current - Current session metrics
 * @param {Object} trend - Output of compareToPreviousSession
 * @returns {string}
 */
export function generateNextRecommendation(current, trend) {
  const score = current.avgBalanceScore ?? current.avgScore ?? 0;
  const zone = current.timeInTargetZonePct ?? 0;

  if (trend.isFirstSession) {
    return 'Try to increase time in the target zone by 10 seconds.';
  }

  if (trend.balanceScoreDelta != null && trend.balanceScoreDelta < -TREND_THRESHOLDS.balanceScore) {
    return 'Try a shorter session and focus on controlled center holds.';
  }

  if (zone < 50) {
    return 'Focus on staying in the target zone for longer stretches.';
  }

  if (score >= 90 && zone >= 70) {
    return 'Excellent work! Try increasing session duration for endurance.';
  }

  if (
    trend.swayPercentChange != null &&
    trend.swayPercentChange > TREND_THRESHOLDS.swayPercentChange
  ) {
    return 'Focus on smoother weight shifts rather than speed.';
  }

  return 'Try to keep your weight centered for 10 more seconds.';
}

/**
 * Format duration in seconds to m:ss display.
 */
export function formatDurationDisplay(totalSeconds) {
  if (totalSeconds == null || totalSeconds < 0) return '0:00';
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Format a duration delta for display (e.g., "+0:20" or "-0:10").
 */
export function formatDurationDelta(deltaSeconds) {
  if (deltaSeconds == null) return null;
  const sign = deltaSeconds >= 0 ? '+' : '-';
  const abs = Math.abs(deltaSeconds);
  return `${sign}${formatDurationDisplay(abs)}`;
}

/**
 * Find the most recent valid previous session for comparison,
 * excluding the current session and invalid/short sessions.
 *
 * @param {Array} sessions - All sessions sorted ascending by date
 * @param {string} currentSessionId - ID of the current session to exclude
 * @returns {Object|null}
 */
export function findPreviousValidSession(sessions, currentSessionId) {
  if (!Array.isArray(sessions)) return null;

  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i];
    if (
      s.id !== currentSessionId &&
      s.isValid !== false &&
      (s.durationSeconds ?? s.duration ?? 0) >= MIN_VALID_DURATION
    ) {
      return s;
    }
  }
  return null;
}

/**
 * Check if a session meets minimum validity requirements.
 */
export function isSessionValid(session) {
  const duration = session.durationSeconds ?? session.duration ?? 0;
  const samples = session.validSampleCount ?? session.scoreSamples ?? 0;
  return duration >= MIN_COMMIT_DURATION && samples > 0;
}

/**
 * Check if a session has enough data for meaningful analysis.
 */
export function isSessionMeaningful(session) {
  const duration = session.durationSeconds ?? session.duration ?? 0;
  return isSessionValid(session) && duration >= MIN_VALID_DURATION;
}

export { TREND_THRESHOLDS, MIN_VALID_DURATION, MIN_COMMIT_DURATION, DEFAULT_TARGET_RANGE };
