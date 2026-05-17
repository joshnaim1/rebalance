/**
 * ReBalance brand mark — vector stick-figure on balance board (crisp at any size).
 */
function LogoGraphic() {
  return (
    <g transform="translate(60, 58)">
      <circle cx="0" cy="0" r="52" fill="none" stroke="#2D9C6F" strokeWidth="1" opacity="0.3" />
      <circle cx="0" cy="-28" r="8" fill="#2D9C6F" />
      <line x1="0" y1="-20" x2="0" y2="2" stroke="#2D9C6F" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="0" y1="-12" x2="-18" y2="-22" stroke="#2D9C6F" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="0" y1="-12" x2="18" y2="-22" stroke="#2D9C6F" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="0" y1="2" x2="-12" y2="16" stroke="#2D9C6F" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="0" y1="2" x2="12" y2="16" stroke="#2D9C6F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M-28 18 Q0 26 28 18" fill="none" stroke="#1E4D2B" strokeWidth="3" strokeLinecap="round" />
      <circle cx="-18" cy="19" r="2.5" fill="#1E4D2B" opacity="0.6" />
      <circle cx="18" cy="19" r="2.5" fill="#1E4D2B" opacity="0.6" />
    </g>
  );
}

export default function ReBalanceLogo({
  className = 'h-12 w-12',
  alt = 'ReBalance',
}) {
  const svgProps = {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 120 120',
    className: `shrink-0 ${className}`,
  };

  if (alt === '') {
    return (
      <svg {...svgProps} aria-hidden="true">
        <LogoGraphic />
      </svg>
    );
  }

  return (
    <svg {...svgProps} role="img" aria-label={alt}>
      <title>{alt}</title>
      <LogoGraphic />
    </svg>
  );
}
