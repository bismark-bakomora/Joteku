import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SettingsWorkspace } from './SettingsWorkspace';

export const metadata: Metadata = { title: 'Prices & settings' };

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsWorkspace />
    </Suspense>
  );
}
