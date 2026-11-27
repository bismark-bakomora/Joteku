import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PaymentsReport } from './PaymentsReport';

export const metadata: Metadata = { title: 'Payments' };

export default function PaymentsPage() {
  return (
    <Suspense>
      <PaymentsReport />
    </Suspense>
  );
}
