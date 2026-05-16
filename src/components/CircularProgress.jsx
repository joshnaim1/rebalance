/**
 * CircularProgress — SVG-based circular progress ring.
 * Fills clockwise based on elapsed time relative to total duration.
 * Respects reduced motion (no CSS transition on stroke, instant fill).
 * Displays elapsed time as MM:SS text in the center.
 *
 * @param {{ elapsed: number, total: number, className?: string }} props
 * - elapsed: seconds elapsed
 * - total: total seconds for full circle (session duration)
 * - className: optional additional CSS classes
 */

import { useReducedMotion } from '../hooks/useReducedMotion';

const SIZE = 120;
const STROKE_WIDTH = 8;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(seconds) {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.floor(Math.max(0, seconds) % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function CircularProgress({ elapsed, total, className }) {
  const reducedMotion = useReducedMotion();

  // Clamp progress between 0 and 1
  const progress = total > 0 ? Math.min(1, Math.max(0, elapsed / total)) : 0;
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div
      className={`inline-flex flex-col items-center justify-center${className ? ` ${className}` : ''}`}
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Session progress: ${formatTime(elapsed)} elapsed`}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden="true"
      >
        {/* Background track ring */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-text-muted)"
          strokeWidth={STROKE_WIDTH}
          opacity={0.3}
        />
        {/* Progress ring */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-balanced)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={reducedMotion ? undefined : { transition: 'stroke-dashoffset 0.3s ease' }}
        />
        {/* Center time text */}
        <text
          x={SIZE / 2}
          y={SIZE / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--color-text-primary)"
          fontSize="18"
          fontFamily="var(--font-sans)"
          fontWeight="600"
        >
          {formatTime(elapsed)}
        </text>
      </svg>
    </div>
  );
}

export { CIRCUMFERENCE, RADIUS, SIZE, STROKE_WIDTH, formatTime };
