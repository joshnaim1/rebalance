const ACTIVE_THRESHOLD = 200;

/**
 * Single source of truth for balance zone classification.
 * Score color, marker color, and badge all derive from this.
 */
export function getBalanceZoneFromRatio(ratio) {
  const deviation = Math.abs(ratio - 0.5);

  if (deviation <= 0.15) {
    return {
      zone: 'balanced',
      label: 'Balanced',
      scoreColor: '#1A5C42',
      markerColor: '#2D9C6F',
      badgeClass: 'zone-balanced',
    };
  }

  if (deviation <= 0.30) {
    return {
      zone: 'warning',
      label: 'Needs control',
      scoreColor: '#92400E',
      markerColor: '#D97706',
      badgeClass: 'zone-warning',
    };
  }

  return {
    zone: 'danger',
    label: 'Danger',
    scoreColor: '#991B1B',
    markerColor: '#DC2626',
    badgeClass: 'zone-danger',
  };
}

export function calculateBalance(left, right, baseline = null) {
  const total = left + right;

  if (total < ACTIVE_THRESHOLD) {
    return {
      ratio: 0.5,
      percentage: { left: 50, right: 50 },
      score: 0,
      zone: 'idle',
      zoneInfo: null,
      totalPressure: total,
      isActive: false,
    };
  }

  let correctedLeft = left;
  let correctedRight = right;

  if (baseline && baseline.left > 0 && baseline.right > 0) {
    const baselineAvg = (baseline.left + baseline.right) / 2;
    const leftScale = baselineAvg / baseline.left;
    const rightScale = baselineAvg / baseline.right;
    correctedLeft = left * leftScale;
    correctedRight = right * rightScale;
  }

  const correctedTotal = correctedLeft + correctedRight;
  const ratio = correctedTotal > 0 ? correctedRight / correctedTotal : 0.5;

  const leftPct = parseFloat(((1 - ratio) * 100).toFixed(1));
  const rightPct = parseFloat((ratio * 100).toFixed(1));

  const deviation = Math.abs(ratio - 0.5);
  const score = Math.round(Math.max(0, (1 - deviation * 2.5) * 100));

  const zoneInfo = getBalanceZoneFromRatio(ratio);

  return {
    ratio,
    percentage: { left: leftPct, right: rightPct },
    score,
    zone: zoneInfo.zone,
    zoneInfo,
    totalPressure: total,
    isActive: true,
  };
}
