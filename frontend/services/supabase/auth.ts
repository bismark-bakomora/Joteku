import { AppError } from '@/lib/errors';
import { normalizeGhanaPhone } from '@/lib/phone';
import { storage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { isValidEmail } from '@/lib/validation';
import { OtpPurpose, Session } from '@/types/auth';
import { AuthError, User } from '@supabase/supabase-js';
import { AuthService, ProfileChanges, SignUpDetails } from '../types';
import { callFunction } from './rows';

// The last profile seen, so the app still knows who is signed in on a weak network.
const CACHED_SESSION_KEY = 'session';

type ProfileRow = {
  phone: string;
  name: string | null;
  email: string | null;
};

function requirePhone(input: string): string {
  const phone = normalizeGhanaPhone(input);
  if (!phone) {
    throw new AppError('invalid_phone', 'Enter a valid phone number, like 024 123 4567.');
  }
  return phone;
}

function cleanDetails(details: SignUpDetails | undefined): { name: string; email: string | null } {
  const name = details?.name.trim() ?? '';
  if (name.length < 2) {
    throw new AppError('invalid_details', 'Enter your name.');
  }
  const email = details?.email?.trim() ?? '';
  if (email && !isValidEmail(email)) {
    throw new AppError('invalid_details', 'Enter a valid email address, or leave it blank.');
  }
  return { name, email: email || null };
}

function accountMissing(): AppError {
  return new AppError(
    'account_missing',
    'We could not find an account for this number. Sign up, or continue as a guest.',
  );
}

function accountExists(): AppError {
  return new AppError('account_exists', 'This number already has an account. Log in instead.');
}

// Turns Supabase Auth errors into the messages the sign-in screen shows.
function authFailure(error: AuthError, step: 'send' | 'verify'): AppError | AuthError {
  if (step === 'verify' && (error.code === 'otp_expired' || error.status === 403)) {
    return new AppError('invalid_otp', 'That code is not correct or has expired. Check it, or send a new code.');
  }
  if (error.code === 'over_sms_send_rate_limit' || error.status === 429) {
    return new AppError('otp_send_failed', 'A code was just sent. Please wait a moment before asking for another.');
  }
  if (step === 'send') {
    return new AppError(
      'otp_send_failed',
      __DEV__
        ? 'Text messages are not set up yet. Use a test number from 020 000 0001 to 020 000 0005.'
        : 'We could not send a code to this number. Check it and try again.',
    );
  }
  return error;
}

function toSession(profile: ProfileRow, user: User): Session {
  return {
    phone: profile.phone,
    name: profile.name ?? undefined,
    email: profile.email ?? undefined,
    isGuest: profile.name === null,
    signedInAt: user.last_sign_in_at ?? new Date().toISOString(),
  };
}

async function loadProfile(user: User): Promise<Session> {
  const { data, error } = await supabase
    .from('profiles')
    .select('phone, name, email')
    .eq('id', user.id)
    .single<ProfileRow>();
  if (error) {
    throw error;
  }
  const session = toSession(data, user);
  await storage.set(CACHED_SESSION_KEY, session);
  return session;
}

// Customers sign in with their phone number and a one-time code from Supabase
// Auth. A profile without a name is a guest; giving a name makes it an account.
export class SupabaseAuthService implements AuthService {
  readonly testHint = __DEV__
    ? 'No text message is sent yet. Use a test number from 020 000 0001 to 020 000 0005 and the code 123456.'
    : null;

  async requestOtp(phone: string, purpose: OtpPurpose, details?: SignUpDetails): Promise<void> {
    const normalized = requirePhone(phone);
    if (purpose === 'signup') {
      cleanDetails(details);
    }
    const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
    if (error) {
      throw authFailure(error, 'send');
    }
  }

  async verifyOtp(
    phone: string,
    code: string,
    purpose: OtpPurpose,
    details?: SignUpDetails,
  ): Promise<Session> {
    const normalized = requirePhone(phone);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalized,
      token: code.trim(),
      type: 'sms',
    });
    if (error || !data.user) {
      throw error ? authFailure(error, 'verify') : new AppError('invalid_otp', 'That code is not correct.');
    }

    // Whether the number has an account is only checked once the code proves the
    // person owns it, so nobody can test which numbers are Joteku customers.
    const session = await loadProfile(data.user);
    if (purpose === 'login' && session.isGuest) {
      await this.signOut();
      throw accountMissing();
    }
    if (purpose === 'signup') {
      if (!session.isGuest) {
        await this.signOut();
        throw accountExists();
      }
      const { name, email } = cleanDetails(details);
      return this.updateProfile({ name, email: email ?? undefined });
    }
    // A guest whose number already has an account is signed in to that account.
    return session;
  }

  async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      return null;
    }
    try {
      return await loadProfile(user);
    } catch {
      // Offline: fall back to the last profile seen on this phone.
      const cached = await storage.get<Session>(CACHED_SESSION_KEY);
      const phone = user.phone ? `+${user.phone.replace(/^\+/, '')}` : null;
      return cached && cached.phone === phone ? cached : null;
    }
  }

  async updateProfile(changes: ProfileChanges): Promise<Session> {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw new AppError('invalid_state', 'Please log in first.');
    }
    const { name, email } = cleanDetails(changes);
    const { error } = await supabase.from('profiles').update({ name, email }).eq('id', data.user.id);
    if (error) {
      throw error;
    }
    return loadProfile(data.user);
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    await storage.remove(CACHED_SESSION_KEY);
  }

  async deleteAccount(): Promise<void> {
    await callFunction<null>('delete_my_account', {});
    // The account is gone on the server, so only this phone's copy is left to clear.
    await supabase.auth.signOut({ scope: 'local' });
    await storage.remove(CACHED_SESSION_KEY);
  }
}
