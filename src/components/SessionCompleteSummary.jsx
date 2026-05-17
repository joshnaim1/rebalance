import {
  compareToPreviousSession,
  getTrendLabel,
  getSwayTrendLabel,
  getWeightBiasDescription,
  generateSessionInsight,
  generateNextRecommendation,
  formatDurationDisplay,
  formatDurationDelta,
  findPreviousValidSession,
  isSessionMeaningful,
  TREND_THRESHOLDS,
} from '../utils/sessionAnalytics';
import AISourceDisclosure from './AISourceDisclosure';

const SENTIMENT_STYLES = {
  positive: {
    icon: 'text-balanced',
    bg: 'bg-balanced-soft',
    border: 'border-balanced/30',
  },
  negative: {
    icon: 'text-danger',
    bg: 'bg-danger-soft',
    border: 'border-danger/30',
  },
  neutral: {
    icon: 'text-text-secondary',
    bg: 'bg-card',
    border: 'border-card-border',
  },
  baseline: {
    icon: 'text-text-secondary',
    bg: 'bg-card',
    border: 'border-card-border',
  },
};

function MetricCard({ title, value, unit, delta, deltaLabel, description, trend }) {
  const styles = SENTIMENT_STYLES[trend?.sentiment] || SENTIMENT_STYLES.neutral;

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-xl p-4 space-y-1.5`}>
      <h3 className="text-sm font-medium text-text-label">{title}</h3>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold font-mono text-text-primary">{value}</span>
        {unit && <span className="text-sm text-text-secondary">{unit}</span>}
      </div>
      {trend && (
        <div className="flex items-center gap-1.5 text-sm">
          <span className={`font-medium ${styles.icon}`} aria-hidden="true">
            {trend.icon}
          </span>
          <span className={`font-medium ${styles.icon}`}>
            {trend.label}
          </span>
          {deltaLabel && (
            <span className="text-text-secondary">{deltaLabel}</span>
          )}
        </div>
      )}
      {description && (
        <p className="text-xs text-text-muted leading-relaxed">{description}</p>
      )}
    </div>
  );
}

function InvalidSessionNotice({ duration }) {
  return (
    <div
      className="bg-card border border-card-border rounded-xl p-6 space-y-4"
      aria-live="polite"
    >
      <h2 className="text-lg font-semibold text-text-primary">Session Complete</h2>
      <div className="bg-warning-soft border border-warning/30 rounded-xl p-4 space-y-2">
        <p className="text-sm font-medium text-warning-text">
          Session too short to analyze.
        </p>
        <p className="text-sm text-text-secondary">
          {duration != null && duration > 0
            ? `This session lasted ${formatDurationDisplay(duration)}. `
            : ''}
          Try a session of at least 10 seconds for meaningful metrics.
        </p>
        <p className="text-xs text-text-muted">
          No progress metrics were saved.
        </p>
      </div>
    </div>
  );
}

/**
 * SessionCompleteSummary — replaces the old SummaryCard-based session complete panel
 * with meaningful metric cards, trend labels, clinical insight, and recommendations.
 *
 * @param {Object} props
 * @param {Object} props.session - The just-completed session record
 * @param {Array} props.allSessions - All sessions for finding the previous comparison
 * @param {boolean} [props.generatingNote] - Whether AI note is still being generated
 * @param {Function} props.onDismiss - Called when user clicks Done
 */
export default function SessionCompleteSummary({
  session,
  allSessions,
  generatingNote = false,
  onDismiss,
}) {
  if (!session) return null;

  const meaningful = isSessionMeaningful(session);
  const duration = session.durationSeconds ?? session.duration ?? 0;

  if (!meaningful) {
    return (
      <div className="space-y-4">
        <InvalidSessionNotice duration={duration} />
        <div className="flex justify-end">
          <button
            onClick={onDismiss}
            className="px-5 py-3 rounded-lg font-semibold bg-balanced-text text-white hover:bg-balanced-text/90 transition-colors min-h-11"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  const previous = findPreviousValidSession(allSessions, session.id);
  const trend = compareToPreviousSession(session, previous);
  const insight = generateSessionInsight(session, trend);
  const recommendation = generateNextRecommendation(session, trend);

  const profile = null; // Will use affectedSide from session or profile if available
  const affectedSide = session.affectedSide || null;

  const balanceScore = session.avgBalanceScore ?? session.avgScore ?? 0;
  const timeInZone = session.timeInTargetZonePct ?? 0;
  const avgLeft = session.avgLeftPct ?? 50;
  const avgRight = session.avgRightPct ?? 50;

  const scoreTrend = getTrendLabel(
    trend.balanceScoreDelta,
    TREND_THRESHOLDS.balanceScore,
  );
  const zoneTrend = getTrendLabel(
    trend.timeInTargetZoneDelta,
    TREND_THRESHOLDS.timeInTargetZonePct,
  );
  const swayTrend = getSwayTrendLabel(trend.swayPercentChange);
  const durationTrend = getTrendLabel(
    trend.durationDeltaSeconds,
    TREND_THRESHOLDS.durationSeconds,
  );

  const weightBias = getWeightBiasDescription(avgLeft, avgRight, affectedSide);

  const overallSentiment =
    scoreTrend.sentiment === 'positive' || zoneTrend.sentiment === 'positive'
      ? 'positive'
      : scoreTrend.sentiment === 'negative' || zoneTrend.sentiment === 'negative'
        ? 'negative'
        : scoreTrend.sentiment === 'baseline'
          ? 'baseline'
          : 'neutral';

  const overallIcon =
    overallSentiment === 'positive'
      ? '↑'
      : overallSentiment === 'negative'
        ? '↓'
        : overallSentiment === 'baseline'
          ? '◆'
          : '→';

  if (generatingNote) {
    return (
      <div className="bg-card border border-card-border rounded-xl p-6 space-y-4" aria-live="polite">
        <h2 className="text-lg font-semibold text-text-primary">Session Complete!</h2>
        <div className="flex items-center gap-3 text-text-secondary">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-medium">Analyzing session data...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-card border border-card-border rounded-xl p-6 space-y-5"
      aria-live="polite"
    >
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Session Complete!</h2>
        <p className={`text-sm mt-1 flex items-center gap-1.5 ${
          SENTIMENT_STYLES[overallSentiment]?.icon || 'text-text-secondary'
        }`}>
          <span aria-hidden="true">{overallIcon}</span>
          <span>{insight}</span>
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Balance Control Score */}
        <MetricCard
          title="Balance Control"
          value={balanceScore}
          unit="/ 100"
          trend={scoreTrend}
          deltaLabel={
            trend.balanceScoreDelta != null
              ? `${trend.balanceScoreDelta >= 0 ? '+' : ''}${trend.balanceScoreDelta} from last session`
              : 'First session'
          }
          description="How closely your weight stayed near the target range."
        />

        {/* Time in Target Zone */}
        <MetricCard
          title="Time in Target Zone"
          value={`${timeInZone}%`}
          trend={zoneTrend}
          deltaLabel={
            trend.timeInTargetZoneDelta != null
              ? `${trend.timeInTargetZoneDelta >= 0 ? '+' : ''}${trend.timeInTargetZoneDelta}% from last session`
              : 'First session'
          }
          description="Time spent within your target left/right weight range."
        />

        {/* Stability / Sway */}
        <MetricCard
          title="Stability"
          value={swayTrend.label}
          trend={{
            label: swayTrend.label,
            icon:
              swayTrend.sentiment === 'positive'
                ? '↑'
                : swayTrend.sentiment === 'negative'
                  ? '↓'
                  : swayTrend.sentiment === 'baseline'
                    ? '◆'
                    : '→',
            sentiment: swayTrend.sentiment,
          }}
          deltaLabel={swayTrend.description}
          description="How much your weight shifted during the session."
        />

        {/* Session Duration */}
        <MetricCard
          title="Session Duration"
          value={formatDurationDisplay(duration)}
          trend={durationTrend}
          deltaLabel={
            trend.durationDeltaSeconds != null
              ? `${formatDurationDelta(trend.durationDeltaSeconds)} from last session`
              : 'First session'
          }
          description="Longer controlled practice builds endurance."
        />
      </div>

      {/* Weight Bias */}
      <div className="bg-card border border-card-border rounded-xl p-4 space-y-1.5">
        <h3 className="text-sm font-medium text-text-label">Average Weight Split</h3>
        <div className="flex items-baseline gap-3">
          <span className="text-lg font-bold font-mono text-text-primary">
            {Math.round(avgLeft)}% left
          </span>
          <span className="text-text-muted">/</span>
          <span className="text-lg font-bold font-mono text-text-primary">
            {Math.round(avgRight)}% right
          </span>
        </div>
        <p className="text-xs text-text-muted">{weightBias}</p>
      </div>

      {/* Next Session Recommendation */}
      <div className="border-t border-card-border pt-4 space-y-1">
        <h3 className="text-sm font-medium text-text-label">Next session</h3>
        <p className="text-sm text-text-secondary">{recommendation}</p>
      </div>

      {/* AI Note */}
      {session.aiNote && (
        <div className="bg-balanced-soft border border-balanced/20 rounded-xl p-4 space-y-1">
          <h3 className="text-sm font-medium text-balanced-text flex items-center gap-1.5">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2.5a1 1 0 110 2 1 1 0 010-2zM6.75 7h1.5v4.5h-1.5V7z" />
            </svg>
            Session Note
          </h3>
          <p className="text-sm text-text-secondary">{session.aiNote}</p>
        </div>
      )}

      {/* AI Source Disclosure */}
      <AISourceDisclosure
        usedSources={['balance scores', 'session duration', 'self-reported pain/fatigue']}
        notUsedSources={['dizziness', 'confidence', 'clinical observations']}
      />

      {/* Done Button */}
      <div className="flex justify-end pt-1">
        <button
          onClick={onDismiss}
          className="px-5 py-3 rounded-lg font-semibold bg-balanced-text text-white hover:bg-balanced-text/90 transition-colors min-h-11"
        >
          Done
        </button>
      </div>
    </div>
  );
}
