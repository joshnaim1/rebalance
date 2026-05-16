/**
 * SummaryCard — post-session/game summary with plain-language interpretation.
 * Displays key metrics with TrendArrows and emoji reinforcement (📈, 📉, ➡️).
 * Includes a plain-language interpretation message at the bottom.
 *
 * @param {{ stats: Array<{ label: string, current: number, previous: number }>, message: string }} props
 */
import TrendArrow from './TrendArrow';

/**
 * Returns the appropriate emoji based on trend direction.
 * 📈 for improvement, 📉 for decline, ➡️ for no change.
 */
function getTrendEmoji(current, previous) {
  if (current > previous) return '📈';
  if (current < previous) return '📉';
  return '➡️';
}

export default function SummaryCard({ stats, message }) {
  return (
    <div
      className="bg-card border border-card-border rounded-xl p-4 space-y-3"
      data-testid="summary-card"
    >
      <ul className="space-y-2">
        {stats.map((stat) => (
          <li key={stat.label} className="flex items-center justify-between gap-2">
            <span className="text-sm text-text-secondary">{stat.label}</span>
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-text">{stat.current}</span>
              <TrendArrow current={stat.current} previous={stat.previous} />
              <span aria-hidden="true">{getTrendEmoji(stat.current, stat.previous)}</span>
            </span>
          </li>
        ))}
      </ul>
      {message && (
        <p className="text-sm text-text-secondary pt-2 border-t border-card-border">
          {message}
        </p>
      )}
    </div>
  );
}
