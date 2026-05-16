/**
 * TrendArrow — displays a directional arrow indicating change between current and previous values.
 * Uses color + direction + screen-reader text so the trend is accessible without vision.
 *
 * - ↑ (upward arrow) with balanced/green color when current > previous
 * - ↓ (downward arrow) with danger/red color when current < previous
 * - → (horizontal arrow) with muted color when current equals previous
 *
 * Includes a screen-reader-only label describing the change in plain language.
 *
 * @param {{ current: number, previous: number }} props
 */
export default function TrendArrow({ current, previous }) {
  const diff = current - previous;

  let arrow;
  let colorClass;
  let srText;

  if (diff > 0) {
    arrow = '↑';
    colorClass = 'text-balanced';
    srText = `improved by ${diff} point${diff === 1 ? '' : 's'}`;
  } else if (diff < 0) {
    arrow = '↓';
    colorClass = 'text-danger';
    const absDiff = Math.abs(diff);
    srText = `declined by ${absDiff} point${absDiff === 1 ? '' : 's'}`;
  } else {
    arrow = '→';
    colorClass = 'text-text-muted';
    srText = 'no change';
  }

  return (
    <span className={`inline-flex items-center ${colorClass}`} data-testid="trend-arrow">
      <span aria-hidden="true">{arrow}</span>
      <span className="sr-only">{srText}</span>
    </span>
  );
}
