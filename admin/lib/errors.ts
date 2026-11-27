// The database raises errors with the app's own message and its code in HINT,
// so those messages are shown as they are. Anything else gets a plain fallback.
const APP_CODES = ['invalid_booking', 'slot_unavailable', 'invalid_state', 'not_found', 'not_signed_in', 'not_allowed'];

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error && typeof error === 'object') {
    const { hint, message } = error as { hint?: string; message?: string };
    if (hint && APP_CODES.includes(hint) && message) return message;
    if (message === 'Failed to fetch' || message?.includes('NetworkError')) {
      return 'No connection. Check the internet and try again.';
    }
  }
  return fallback;
}
