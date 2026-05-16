const ACTIVE_THRESHOLD = 200;

export function calculateBalance(left, right, baseline = null) {
  const total = left + right;

  if (total < ACTIVE_THRESHOLD) {
    return {
      ratio: 0.5,
      percentage: { left: 50, right: 50 },
      score: 0,
      zone: 'idle',
      totalPressure: total,
      isActive: false,
    };
  }

  let correctedLeft = left;
  let correctedRight = right;

  if (baseline && baseline.left > 0 && baseline.right > 0) {
    // Scale factor: if baseline left was 920 and baseline right was 880,
    // right sensor reads ~4.5% low. We normalize both to a common reference
    // so that equal weight reads as 50/50.
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

  let zone = 'balanced';
  if (deviation > 0.15) zone = 'danger';
  else if (deviation > 0.08) zone = 'warning';

  return {
    ratio,
    percentage: { left: leftPct, right: rightPct },
    score,
    zone,
    totalPressure: total,
    isActive: true,
  };
}
