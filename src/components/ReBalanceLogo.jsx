/**
 * ReBalance brand mark — circular stick-figure-on-board logo.
 * Source asset is wide with padding; we crop/zoom to the centered mark.
 */
export default function ReBalanceLogo({
  className = 'h-12 w-12',
  alt = 'ReBalance',
  rounded = true,
  zoom = 4.5,
}) {
  const roundedClass = rounded ? 'rounded-full' : '';

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden bg-transparent ${roundedClass} ${className}`}
    >
      <img
        src="/rebalance-logo.png"
        alt={alt}
        className="h-full w-full object-cover object-center"
        style={{ transform: `scale(${zoom})` }}
        draggable={false}
        {...(alt === '' ? { role: 'presentation' } : {})}
      />
    </span>
  );
}
