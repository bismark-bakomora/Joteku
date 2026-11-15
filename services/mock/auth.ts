import { delay } from '@/lib/async';
import { AppError } from '@/lib/errors';
import { normalizeGhanaPhone } from '@/lib/phone';
import { storage } from '@/lib/storage';
import { isValidEmail } from '@/lib/validation';
import { OtpPurpose, Session } from '@/types/auth';
import { AuthService, ProfileChanges, SignUpDetails } from '../types';
import { MOCK_LATENCY_MS } from './latency';

const SESSION_KEY = 'session';
const ACCOUNTS_KEY = 'mock-accounts';

// No text message is sent. Every phone number accepts this code.
const MOCK_OTP = '123456';

type Account = {
  name: string;
  email?: string;
  createdAt: string;
};

type Accounts = Record<string, Account>;

function requirePhone(input: string): string {
  const phone = normalizeGhanaPhone(input);
  if (!phone) {
    throw new AppError('invalid_phone', 'Enter a valid phone number, like 024 123 4567.');
  }
  return phone;
}

function cleanDetails(details: SignUpDetails | undefined): { name: string; email?: string } {
  const name = details?.name.trim() ?? '';
  if (name.length < 2) {
    throw new AppError('invalid_details', 'Enter your name.');
  }
  const email = details?.email?.trim() ?? '';
  if (email && !isValidEmail(email)) {
    throw new AppError('invalid_details', 'Enter a valid email address, or leave it blank.');
  }
  return { name, email: email || undefined };
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

export class MockAuthService implements AuthService {
  readonly testCode = MOCK_OTP;

  private async accounts(): Promise<Accounts> {
    return (await storage.get<Accounts>(ACCOUNTS_KEY)) ?? {};
  }

  async requestOtp(phone: string, purpose: OtpPurpose, details?: SignUpDetails): Promise<void> {
    await delay(MOCK_LATENCY_MS);
    const normalized = requirePhone(phone);
    const accounts = await this.accounts();
    if (purpose === 'login' && !accounts[normalized]) {
      throw accountMissing();
    }
    if (purpose === 'signup') {
      if (accounts[normalized]) {
        throw accountExists();
      }
      cleanDetails(details);
    }
  }

  async verifyOtp(
    phone: string,
    code: string,
    purpose: OtpPurpose,
    details?: SignUpDetails,
  ): Promise<Session> {
    await delay(MOCK_LATENCY_MS);
    const normalized = requirePhone(phone);
    if (code.trim() !== MOCK_OTP) {
      throw new AppError('invalid_otp', 'That code is not correct. Check it and try again.');
    }

    const accounts = await this.accounts();
    let account: Account | undefined = accounts[normalized];
    if (purpose === 'signup') {
      if (account) {
        throw accountExists();
      }
      account = { ...cleanDetails(details), createdAt: new Date().toISOString() };
      await storage.set(ACCOUNTS_KEY, { ...accounts, [normalized]: account });
    } else if (purpose === 'login' && !account) {
      throw accountMissing();
    }

    // A guest whose number already has an account is signed in to that account.
    const session: Session = account
      ? {
          phone: normalized,
          name: account.name,
          email: account.email,
          isGuest: false,
          signedInAt: new Date().toISOString(),
        }
      : { phone: normalized, isGuest: true, signedInAt: new Date().toISOString() };
    await storage.set(SESSION_KEY, session);
    return session;
  }

  getSession(): Promise<Session | null> {
    return storage.get<Session>(SESSION_KEY);
  }

  async updateProfile(changes: ProfileChanges): Promise<Session> {
    await delay(MOCK_LATENCY_MS);
    const session = await this.getSession();
    if (!session) {
      throw new AppError('invalid_state', 'Please log in first.');
    }
    const details = cleanDetails(changes);
    const accounts = await this.accounts();
    const account: Account = {
      ...details,
      createdAt: accounts[session.phone]?.createdAt ?? new Date().toISOString(),
    };
    await storage.set(ACCOUNTS_KEY, { ...accounts, [session.phone]: account });

    const updated: Session = { ...session, ...details, isGuest: false };
    await storage.set(SESSION_KEY, updated);
    return updated;
  }

  signOut(): Promise<void> {
    return storage.remove(SESSION_KEY);
  }
}
