const SEES_ITEMS = [
  'Pressure sensors & weight distribution',
  'Balance score & session duration',
  'Progress trends & game scores',
  'Therapy goals',
];

const NEVER_SEES_ITEMS = [
  'Identity or demographics',
  'Medications or prescriptions',
  'Surgical or medical history',
  'Insurance or billing',
];

export default function DataTransparency({ variant = 'card' }) {
  const isPopover = variant === 'popover';

  return (
    <div
      className={`bg-white border border-[#E8E5E0] rounded-xl ${
        isPopover ? 'p-5 w-[340px]' : 'p-6'
      }`}
      style={{ boxShadow: isPopover ? '0 4px 16px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🛡️</span>
        <h3 className={`font-bold text-[#1E293B] ${isPopover ? 'text-sm' : 'text-base'}`}>
          Data Transparency
        </h3>
      </div>

      <div className={`grid grid-cols-2 gap-2.5 ${isPopover ? 'text-xs' : 'text-sm'}`}>
        <div className="bg-[#E8F8EF] rounded-lg p-3">
          <h4 className="font-semibold text-[#1A5C42] mb-2 text-xs uppercase tracking-wide">
            We see
          </h4>
          <ul className="space-y-1.5">
            {SEES_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-[#374151]">
                <span className="text-[#16a34a] shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#FEF2F2] rounded-lg p-3">
          <h4 className="font-semibold text-[#991B1B] mb-2 text-xs uppercase tracking-wide">
            Never see
          </h4>
          <ul className="space-y-1.5">
            {NEVER_SEES_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-[#374151]">
                <span className="text-[#dc2626] shrink-0">✗</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className={`text-center italic text-[#9CA3AF] mt-3 ${isPopover ? 'text-[10px]' : 'text-xs'}`}>
        Measuring what matters, ignoring what doesn't.
      </p>
    </div>
  );
}
