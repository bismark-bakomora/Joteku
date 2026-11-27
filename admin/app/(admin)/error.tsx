'use client';

import { ErrorState } from '@/components/ui';

// Catches anything a screen did not handle itself, and offers to try again.
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ padding: 'var(--space-10) var(--space-6)' }}>
      <ErrorState message="Something on this page went wrong. Try again, or reload the page." onRetry={reset} />
    </div>
  );
}
