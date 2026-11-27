import Link from 'next/link';
import { RoofMark } from '@/components/RoofMark';

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--space-6)',
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'grid', gap: 'var(--space-4)', justifyItems: 'center', maxWidth: 420 }}>
        <RoofMark width={72} />
        <h1>This page is not here</h1>
        <p style={{ color: 'var(--text-subtle)' }}>The link may be old. Go back to today&apos;s bookings.</p>
        <Link
          href="/"
          style={{
            minHeight: 'var(--tap)',
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0 var(--space-5)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--green)',
            color: 'var(--on-green)',
            fontWeight: 700,
          }}
        >
          Go to bookings
        </Link>
      </div>
    </main>
  );
}
