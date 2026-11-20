export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function isValidOtp(value: string): boolean {
  return /^\d{6}$/.test(value.trim());
}
