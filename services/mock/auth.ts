import { delay } from '@/lib/async';
import { AppError } from '@/lib/errors';
import { normalizeGhanaPhone } from '@/lib/phone';
import { storage } from '@/lib/storage';
import { Session } from '@/types/auth';
import { AuthService, SignInOptions } from '../types';
import { MOCK_LATENCY_MS } from './latency';

const SESSION_KEY = 'session';

// No text message is sent. Every phone number accepts this code.
const MOCK_OTP = '123456';

export class MockAuthService implements AuthService {
  async requestOtp(phone: string): Promise<void> {
    await delay(MOCK_LATENCY_MS);
    if (!normalizeGhanaPhone(phone)) {
      throw new AppError('invalid_phone', 'Enter a valid phone number, like 024 123 4567.');
    }
  }

  async verifyOtp(phone: string, code: string, options: SignInOptions = {}): Promise<Session> {
    await delay(MOCK_LATENCY_MS);
    const normalized = normalizeGhanaPhone(phone);
    if (!normalized) {
      throw new AppError('invalid_phone', 'Enter a valid phone number, like 024 123 4567.');
    }
    if (code.trim() !== MOCK_OTP) {
      throw new AppError('invalid_otp', 'That code is not correct. Try again.');
    }
    const session: Session = {
      phone: normalized,
      name: options.name?.trim() || undefined,
      email: options.email?.trim() || undefined,
      isGuest: options.guest === true,
      signedInAt: new Date().toISOString(),
    };
    await storage.set(SESSION_KEY, session);
    return session;
  }

  getSession(): Promise<Session | null> {
    return storage.get<Session>(SESSION_KEY);
  }

  signOut(): Promise<void> {
    return storage.remove(SESSION_KEY);
  }
}
