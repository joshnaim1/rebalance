/**
 * FeelingCards — Grid of large tap-target cards for quick selection.
 * Minimum 44x44px tap targets with icon + text label per card.
 * Single-click selection, no typing required.
 *
 * @param {{ options: Array<{ value: string, label: string, icon: string }>, selected: string | null, onSelect: (value: string) => void, label: string }} props
 */

export const PAIN_OPTIONS = [
  { value: 'none', label: 'None', icon: '😊' },
  { value: 'mild', label: 'Mild', icon: '🙂' },
  { value: 'moderate', label: 'Moderate', icon: '😐' },
  { value: 'severe', label: 'Severe', icon: '😣' },
];

export const FATIGUE_OPTIONS = [
  { value: 'energized', label: 'Energized', icon: '⚡' },
  { value: 'okay', label: 'Okay', icon: '👍' },
  { value: 'tired', label: 'Tired', icon: '😴' },
  { value: 'exhausted', label: 'Exhausted', icon: '🥱' },
];

export const DIZZINESS_OPTIONS = [
  { value: 'none', label: 'None', icon: '😊' },
  { value: 'mild', label: 'Mild', icon: '🙂' },
  { value: 'moderate', label: 'Moderate', icon: '😵‍💫' },
  { value: 'severe', label: 'Severe', icon: '🌀' },
];

export const CONFIDENCE_OPTIONS = [
  { value: 'very-confident', label: 'Very Confident', icon: '💪' },
  { value: 'somewhat-confident', label: 'Somewhat', icon: '👍' },
  { value: 'uncertain', label: 'Uncertain', icon: '🤔' },
  { value: 'not-confident', label: 'Not Confident', icon: '😟' },
];

export default function FeelingCards({ options, selected, onSelect, label }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {options.map((option) => {
          const isSelected = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(option.value)}
              className={`
                relative flex flex-col items-center justify-center gap-1
                min-w-[44px] min-h-[44px] p-3
                rounded-xl transition-colors
                cursor-pointer select-none
                ${
                  isSelected
                    ? 'border-2 border-balanced bg-balanced/10 ring-2 ring-balanced ring-offset-2 ring-offset-bg'
                    : 'border border-card-border bg-card hover:border-text-muted'
                }
              `}
            >
              {isSelected && (
                <svg className="absolute top-1.5 right-1.5 w-4 h-4 text-balanced" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <span className="text-2xl" aria-hidden="true">
                {option.icon}
              </span>
              <span className={`text-sm text-text-primary ${isSelected ? 'font-semibold' : 'font-medium'}`}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
