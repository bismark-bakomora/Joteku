// The Joteku mark: a gold thatched hut roof, the same shape as the customer app's.
export function RoofMark({ width = 40 }: { width?: number }) {
  return (
    <svg aria-hidden="true" height={width / 2} viewBox="0 0 160 80" width={width}>
      <path d="M80 8 L154 64 Q80 54 6 64 Z" fill="var(--roof)" />
      <path
        d="M80 8 L58 60 M80 8 L102 60 M80 8 L36 62 M80 8 L124 62 M80 8 L80 58"
        fill="none"
        stroke="var(--roof-line)"
        strokeLinecap="round"
        strokeOpacity={0.4}
        strokeWidth={2}
      />
      <path d="M6 64 Q80 54 154 64" fill="none" stroke="var(--roof-line)" strokeOpacity={0.5} strokeWidth={2.5} />
      <circle cx={80} cy={7} fill="var(--roof)" r={5} />
    </svg>
  );
}
