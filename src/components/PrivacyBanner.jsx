/**
 * PrivacyBanner — prominent privacy disclosure card for the Profile page.
 * Displays what BalanceBack stores and explicitly does not store.
 * Uses a distinct background with colored left border and shield icon.
 *
 * Accessibility: role="note" with aria-label for screen readers.
 * All text meets 4.5:1 contrast ratio against card background (#1E293B).
 */
export default function PrivacyBanner() {
  return (
    <aside
      role="note"
      aria-label="Privacy disclosure"
      className="bg-card border-l-4 border-l-focus border border-card-border rounded-xl p-5 space-y-4"
      data-testid="privacy-banner"
    >
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5 text-focus shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
          />
        </svg>
        <h2 className="text-lg font-bold text-text-primary">
          Privacy &amp; Data Practices
        </h2>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-text-label mb-1">
            What we store
          </h3>
          <ul className="list-disc list-inside text-sm text-text-secondary space-y-0.5">
            <li>Display name</li>
            <li>Pronouns</li>
            <li>Stroke/injury date</li>
            <li>Affected side</li>
            <li>Therapy goals</li>
            <li>Self-reported pain, fatigue, dizziness, and confidence</li>
            <li>Session balance data</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-text-label mb-1">
            What we never store
          </h3>
          <ul className="list-disc list-inside text-sm text-text-secondary space-y-0.5">
            <li>Legal sex</li>
            <li>Gender marker</li>
            <li>Gender-affirming care history</li>
            <li>Unrelated medical history</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
