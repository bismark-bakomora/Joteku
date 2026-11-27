'use client';

import { LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { Button, Field, Notice } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError || !data.user) {
      setError(
        signInError?.message === 'Failed to fetch'
          ? 'No connection. Check the internet and try again.'
          : 'That email and password do not match. Check them and try again.',
      );
      setBusy(false);
      return;
    }
    if (data.user.app_metadata?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('This account is not the Joteku admin. Sign in with the admin email.');
      setBusy(false);
      return;
    }
    router.replace('/');
    router.refresh();
  };

  return (
    <form noValidate onSubmit={submit} style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <Field
        autoComplete="email"
        inputMode="email"
        label="Email"
        onChange={(event) => setEmail(event.target.value)}
        required
        type="email"
        value={email}
      />
      <Field
        autoComplete="current-password"
        label="Password"
        onChange={(event) => setPassword(event.target.value)}
        required
        type="password"
        value={password}
      />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button
        disabled={!email.trim() || !password}
        icon={<LogIn aria-hidden="true" size={20} />}
        loading={busy}
        type="submit"
        variant="primary"
      >
        Sign in
      </Button>
    </form>
  );
}
