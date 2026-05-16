/**
 * AISourceDisclosure — displays what data sources were used (and not used)
 * in AI-generated session notes. Provides clinical transparency.
 *
 * @param {{ usedSources: string[], notUsedSources: string[] }} props
 */
export default function AISourceDisclosure({ usedSources, notUsedSources }) {
  if ((!usedSources || usedSources.length === 0) && (!notUsedSources || notUsedSources.length === 0)) {
    return null;
  }

  return (
    <aside
      className="mt-3 pt-3 border-t border-card-border"
      aria-label="AI note data sources"
      data-testid="ai-source-disclosure"
    >
      <p className="text-xs font-medium text-text-label mb-1.5 flex items-center gap-1">
        <svg
          className="w-3.5 h-3.5 inline-block"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2.5a1 1 0 110 2 1 1 0 010-2zM6.75 7h1.5v4.5h-1.5V7z" />
        </svg>
        Data Sources
      </p>
      {usedSources && usedSources.length > 0 && (
        <p className="text-xs text-text-secondary leading-relaxed">
          <span className="font-medium">Generated from:</span>{' '}
          {usedSources.join(', ')}
        </p>
      )}
      {notUsedSources && notUsedSources.length > 0 && (
        <p className="text-xs text-text-secondary leading-relaxed mt-1">
          <span className="font-medium">Not included:</span>{' '}
          {notUsedSources.join(', ')}
        </p>
      )}
    </aside>
  );
}
