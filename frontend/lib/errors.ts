export type AppErrorCode =
  | 'invalid_phone'
  | 'invalid_otp'
  | 'otp_send_failed'
  | 'invalid_booking'
  | 'invalid_payment'
  | 'slot_unavailable'
  | 'not_found'
  | 'invalid_state'
  | 'invalid_details'
  | 'account_exists'
  | 'account_missing'
  | 'not_signed_in';

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof Error && error.name === 'AppError';
}

export function errorMessage(error: unknown, fallback: string): string {
  return isAppError(error) ? error.message : fallback;
}

export function errorCode(error: unknown): AppErrorCode | null {
  return isAppError(error) ? error.code : null;
}
