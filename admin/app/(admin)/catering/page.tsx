import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CateringWorkspace } from './CateringWorkspace';

export const metadata: Metadata = { title: 'Catering quotes' };

export default function CateringPage() {
  return (
    <Suspense>
      <CateringWorkspace />
    </Suspense>
  );
}
