/**
 * ZoneBadge — displays the current balance zone with icon + colored background + text label.
 * Uses distinct patterns (solid, dots, stripes) so zones are distinguishable without color.
 * Uses zone-specific soft backgrounds with dark zone text tokens for ≥4.5:1 contrast.
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
 * Background + text classes per zone.
 * Uses soft backgrounds with dark zone-specific text tokens for ≥4.5:1 contrast.
 *
 * Contrast ratios (calculated):
 *   - balanced (#E8F8EF bg, #1A5C42 text): ~7.8:1 ✓
 *   - warning  (#FFF8E1 bg, #92400E text): ~7.2:1 ✓
 *   - danger   (#FEE2E2 bg, #991B1B text): ~6.5:1 ✓
 */
const ZONE_STYLES = {
  balanced: 'bg-balanced-soft zone-pattern-solid text-balanced-text border border-balanced',
  warning: 'bg-warning-soft zone-pattern-dots text-warning-text border border-warning',
  danger: 'bg-danger-soft zone-pattern-stripes text-danger-text border border-danger',
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
      {IconComponent && <IconComponent className="text-current" />}
      <span className="font-semibold">{config.label}</span>
    </span>
  );
}

export { ZONE_CONFIGS };
