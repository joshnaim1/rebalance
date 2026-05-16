/**
 * ZoneBadge — displays the current balance zone with icon + colored background + text label.
 * Uses distinct patterns (solid, dots, stripes) so zones are distinguishable without color.
 * Meets WCAG 4.5:1 contrast ratio for text/icon against background.
 *
 * @param {{ zone: 'balanced' | 'warning' | 'danger' }} props
 */

const ZONE_CONFIGS = {
  balanced: { icon: 'check-circle', label: 'Balanced', color: 'balanced', pattern: 'solid' },
  warning: { icon: 'exclamation-triangle', label: 'Warning', color: 'warning', pattern: 'dots' },
  danger: { icon: 'x-circle', label: 'Danger', color: 'danger', pattern: 'stripes' },
};

function CheckCircleIcon({ className }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ExclamationTriangleIcon({ className }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function XCircleIcon({ className }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

const ICON_COMPONENTS = {
  'check-circle': CheckCircleIcon,
  'exclamation-triangle': ExclamationTriangleIcon,
  'x-circle': XCircleIcon,
};

/**
 * Background + pattern classes per zone.
 * Text/icon color is dark (#0F172A) to ensure ≥4.5:1 contrast against the bright zone backgrounds.
 *
 * Contrast ratios (calculated):
 *   - balanced (#4ADE80 bg, #0F172A text): ~7.3:1 ✓
 *   - warning  (#FBBF24 bg, #0F172A text): ~9.5:1 ✓
 *   - danger   (#F87171 bg, #0F172A text): ~4.8:1 ✓
 */
const ZONE_STYLES = {
  balanced: 'bg-balanced zone-pattern-solid',
  warning: 'bg-warning zone-pattern-dots',
  danger: 'bg-danger zone-pattern-stripes',
};

export default function ZoneBadge({ zone }) {
  const config = ZONE_CONFIGS[zone];
  if (!config) return null;

  const IconComponent = ICON_COMPONENTS[config.icon];
  const patternClass = ZONE_STYLES[config.color] || '';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium text-sm ${patternClass}`}
      data-zone={zone}
      data-pattern={config.pattern}
    >
      {IconComponent && <IconComponent className="text-[#0F172A]" />}
      <span className="text-[#0F172A] font-semibold">{config.label}</span>
    </span>
  );
}

export { ZONE_CONFIGS };
