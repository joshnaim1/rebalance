/**
 * EmptyState — friendly placeholder shown when a section has no data.
 * Renders a decorative SVG illustration, heading, description, and optional CTA button.
 * Illustration is marked aria-hidden="true" since it is purely decorative.
 * Uses plain, encouraging language to guide the user.
 *
 * @param {{ icon?: React.ReactNode, heading: string, description: string, action?: { label: string, onClick: function } }} props
 */
export default function EmptyState({ icon, heading, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      {icon && (
        <div aria-hidden="true" className="mb-4 text-text-muted">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-text-primary mb-2">{heading}</h3>
      <p className="text-text-secondary max-w-sm mb-6">{description}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg bg-balanced text-[#0F172A] font-medium hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-balanced focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
