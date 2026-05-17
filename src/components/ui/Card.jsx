const VARIANTS = {
  default: 'bg-card border border-card-border',
  accent: 'bg-card border border-balanced/20',
  soft: 'bg-balanced-soft/30 border border-balanced/10',
  metric: 'bg-card border border-card-border',
};

export default function Card({ variant = 'default', className = '', hover = false, children, ...props }) {
  const base = 'rounded-2xl shadow-[0_8px_24px_rgba(30,41,59,0.06)]';
  const hoverClass = hover ? ' transition-shadow hover:shadow-[0_12px_32px_rgba(30,41,59,0.10)]' : '';

  return (
    <div className={`${base} ${VARIANTS[variant]}${hoverClass} ${className}`} {...props}>
      {children}
    </div>
  );
}
