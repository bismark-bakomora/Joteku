import { redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { createClient, isAdmin } from '@/lib/supabase/server';

// Every admin page checks the sign-in on the server first. The database checks
// the admin role again on every query, so this is a convenience, not the guard.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!isAdmin(data?.claims)) {
    redirect('/login');
  }
  const email = typeof data?.claims.email === 'string' ? data.claims.email : '';
  return <Shell email={email}>{children}</Shell>;
}
