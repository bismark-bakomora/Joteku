import type { Metadata, Viewport } from 'next';
import { Epilogue, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

// The customer app's faces: Epilogue for headings, Plus Jakarta Sans for the rest.
const epilogue = Epilogue({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-epilogue' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-jakarta' });

export const metadata: Metadata = {
  title: { default: 'Joteku Admin', template: '%s · Joteku Admin' },
  description: 'Bookings, catering, menu and payments for Joteku.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#185232',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${epilogue.variable} ${jakarta.variable}`} lang="en-GH">
      <body>{children}</body>
    </html>
  );
}
