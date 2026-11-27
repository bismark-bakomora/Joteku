'use client';

import {
  CalendarDays,
  ChefHat,
  LogOut,
  MoreHorizontal,
  ReceiptText,
  Settings,
  Ticket,
  UtensilsCrossed,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { addDays, todayIso } from '@/lib/format';
import { createClient } from '@/lib/supabase/client';
import { useLoad } from '@/lib/useLoad';
import { CatalogProvider } from './CatalogContext';
import { RoofMark } from './RoofMark';
import styles from './Shell.module.css';

type NavItem = {
  href: '/' | '/calendar' | '/catering' | '/menu' | '/payments' | '/settings';
  label: string;
  // The shorter name the phone bar uses, where space is tight.
  short: string;
  icon: typeof Ticket;
  countKey?: 'today' | 'quotes';
  // On a phone, these sit under More instead of in the bottom bar.
  underMore?: boolean;
};

const NAV: NavItem[] = [
  { href: '/', label: 'Bookings', short: 'Bookings', icon: Ticket, countKey: 'today' },
  { href: '/calendar', label: 'Calendar', short: 'Calendar', icon: CalendarDays },
  { href: '/catering', label: 'Catering quotes', short: 'Catering', icon: ChefHat, countKey: 'quotes' },
  { href: '/menu', label: 'Menu', short: 'Menu', icon: UtensilsCrossed },
  { href: '/payments', label: 'Payments', short: 'Payments', icon: ReceiptText, underMore: true },
  { href: '/settings', label: 'Prices & settings', short: 'Settings', icon: Settings, underMore: true },
];

// Numbers on the menu: bookings today, and catering requests waiting for a price.
function useCounts(pathname: string) {
  return useLoad(async () => {
    const supabase = createClient();
    const today = todayIso();
    const [todayRes, quotesRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .in('status', ['confirmed', 'pending_payment'])
        .gte('starts_at', `${today}T00:00:00Z`)
        .lt('starts_at', `${addDays(today, 1)}T00:00:00Z`),
      supabase.from('catering_requests').select('booking_id', { count: 'exact', head: true }).eq('status', 'requested'),
    ]);
    return { today: todayRes.count ?? 0, quotes: quotesRes.count ?? 0 };
  }, pathname);
}

export function Shell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const counts = useCounts(pathname);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const moreActive = NAV.some((item) => item.underMore && isActive(item.href));

  // Close the More panel on navigation, Escape, or a tap outside it.
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMoreOpen(false);
    const onPointer = (event: PointerEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [moreOpen]);

  const signOut = async () => {
    await createClient().auth.signOut();
    router.replace('/login');
    router.refresh();
  };

  return (
    <CatalogProvider>
      <div className={styles.app}>
        <a className={styles.skip} href="#main">
          Skip to content
        </a>
        <nav aria-label="Main" className={styles.rail}>
          <Link className={styles.logo} href="/">
            <RoofMark width={44} />
            <span>
              Joteku
              <small>Admin</small>
            </span>
          </Link>
          <ul className={styles.links}>
            {NAV.map((item) => {
              const Icon = item.icon;
              const count = item.countKey && counts.data ? counts.data[item.countKey] : 0;
              return (
                <li className={item.underMore ? styles.underMore : undefined} key={item.href}>
                  <Link
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={styles.link}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                  >
                    <Icon aria-hidden="true" size={22} strokeWidth={2} />
                    <span className={styles.full}>{item.label}</span>
                    <span className={styles.short}>{item.short}</span>
                    {count > 0 ? (
                      <span
                        aria-label={item.countKey === 'today' ? `${count} today` : `${count} to quote`}
                        className={`${styles.count} num`}
                      >
                        {count}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
            <li className={styles.moreItem}>
              <div className={styles.moreWrap} ref={moreRef}>
                <button
                  aria-current={moreActive ? 'page' : undefined}
                  aria-expanded={moreOpen}
                  className={styles.link}
                  onClick={() => setMoreOpen((open) => !open)}
                  type="button"
                >
                  <MoreHorizontal aria-hidden="true" size={22} strokeWidth={2} />
                  <span className={styles.short}>More</span>
                </button>
                {moreOpen ? (
                  <div className={styles.morePanel}>
                    {NAV.filter((item) => item.underMore).map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          aria-current={isActive(item.href) ? 'page' : undefined}
                          className={styles.moreLink}
                          href={item.href}
                          key={item.href}
                          onClick={() => setMoreOpen(false)}
                        >
                          <Icon aria-hidden="true" size={22} />
                          {item.label}
                        </Link>
                      );
                    })}
                    <button className={styles.moreLink} onClick={signOut} type="button">
                      <LogOut aria-hidden="true" size={22} />
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </li>
          </ul>
          <div className={styles.account}>
            <span className={styles.email} title={email}>
              {email}
            </span>
            <button className={styles.signOut} onClick={signOut} type="button">
              <LogOut aria-hidden="true" size={20} />
              Sign out
            </button>
          </div>
        </nav>
        <main className={styles.main} id="main">
          {children}
        </main>
      </div>
    </CatalogProvider>
  );
}
