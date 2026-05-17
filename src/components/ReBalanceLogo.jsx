/**
 * ReBalance brand mark — circular stick-figure-on-board logo.
 */
export default function ReBalanceLogo({
  className = 'h-8 w-8',
  alt = 'ReBalance',
  rounded = true,
}) {
  return (
    <img
      src="/rebalance-logo.png"
      alt={alt}
      className={`object-contain ${rounded ? 'rounded-full' : ''} ${className}`}
      draggable={false}
      {...(alt === '' ? { role: 'presentation' } : {})}
    />
  );
}
