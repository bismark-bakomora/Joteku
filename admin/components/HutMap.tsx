import styles from './HutMap.module.css';

const HUTS = ['hut-1', 'hut-2', 'hut-3', 'hut-4'];

function describe(lit: string[]): string {
  if (lit.length === HUTS.length) return 'Takes the whole venue, all four huts';
  if (lit.length === 0) return 'Takes no hut';
  return `Takes ${lit.map((unit) => unit.replace('hut-', 'Hut ')).join(' and ')}`;
}

// The venue's four huts in a row, lit green for the huts a booking or block
// takes. The whole venue lights all four. Tables take no hut.
export function HutMap({ units, size = 'small' }: { units: string[]; size?: 'mini' | 'small' | 'large' }) {
  return (
    <span aria-label={describe(units)} className={`${styles.map} ${size === 'small' ? '' : styles[size]}`} role="img">
      {HUTS.map((hut, index) => (
        <span className={styles.hut} data-lit={units.includes(hut) || undefined} key={hut}>
          <Roof />
          <span className={styles.number}>{index + 1}</span>
        </span>
      ))}
    </span>
  );
}

// The same four huts as a control: tap one hut, or the whole venue.
export function HutPicker({
  value,
  onChange,
  wholeVenueId = 'whole-venue',
}: {
  value: string;
  onChange: (spaceId: string) => void;
  wholeVenueId?: string;
}) {
  const whole = value === wholeVenueId;
  return (
    <div className={styles.picker} role="radiogroup" aria-label="Space">
      {HUTS.map((hut, index) => {
        const selected = whole || value === hut;
        return (
          <button
            aria-checked={value === hut}
            className={styles.pick}
            data-lit={selected || undefined}
            key={hut}
            onClick={() => onChange(hut)}
            role="radio"
            type="button"
          >
            <Roof />
            <span>Hut {index + 1}</span>
          </button>
        );
      })}
      <button
        aria-checked={whole}
        className={`${styles.pick} ${styles.whole}`}
        data-lit={whole || undefined}
        onClick={() => onChange(wholeVenueId)}
        role="radio"
        type="button"
      >
        <span>Whole venue</span>
      </button>
    </div>
  );
}

function Roof() {
  return (
    <svg aria-hidden="true" className={styles.roof} viewBox="0 0 32 18">
      <path d="M16 1 L31 14 Q16 11.5 1 14 Z" />
    </svg>
  );
}
