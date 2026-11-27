import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingsWorkspace } from './BookingsWorkspace';

export const metadata: Metadata = { title: 'Bookings' };

export default function BookingsPage() {
  return (
    <Suspense>
      <BookingsWorkspace />
    </Suspense>
  );
}
