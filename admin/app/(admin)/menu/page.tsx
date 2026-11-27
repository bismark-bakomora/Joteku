import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MenuWorkspace } from './MenuWorkspace';

export const metadata: Metadata = { title: 'Menu' };

export default function MenuPage() {
  return (
    <Suspense>
      <MenuWorkspace />
    </Suspense>
  );
}
