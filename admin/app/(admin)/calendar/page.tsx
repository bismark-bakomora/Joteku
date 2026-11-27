import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CalendarWorkspace } from './CalendarWorkspace';

export const metadata: Metadata = { title: 'Calendar' };

export default function CalendarPage() {
  return (
    <Suspense>
      <CalendarWorkspace />
    </Suspense>
  );
}
