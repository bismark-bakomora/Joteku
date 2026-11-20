import { MobileMoneyNetwork } from '@/types/payment';

const NETWORK_PREFIXES: Record<MobileMoneyNetwork, string[]> = {
  mtn: ['24', '25', '53', '54', '55', '59'],
  telecel: ['20', '50'],
  airteltigo: ['26', '27', '56', '57'],
};

export function normalizeGhanaPhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, '');
  if (/^(\+?233)\d{9}$/.test(digits)) {
    return `+233${digits.replace(/^\+?233/, '')}`;
  }
  if (/^0\d{9}$/.test(digits)) {
    return `+233${digits.slice(1)}`;
  }
  return null;
}

export function suggestNetwork(normalizedPhone: string): MobileMoneyNetwork | null {
  const prefix = normalizedPhone.slice(4, 6);
  const networks = Object.keys(NETWORK_PREFIXES) as MobileMoneyNetwork[];
  return networks.find((network) => NETWORK_PREFIXES[network].includes(prefix)) ?? null;
}

// Shows a normalised number the way people write it in Ghana: 024 123 4567.
export function formatPhoneLocal(normalizedPhone: string): string {
  const national = normalizedPhone.replace(/^\+233/, '');
  if (!/^\d{9}$/.test(national)) {
    return normalizedPhone;
  }
  return `0${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`;
}
