import { DecorationPackage } from '@/types/booking';
import { PreOrderLine } from '@/types/menu';
import { PriceEstimate, PricingSettings } from '@/types/pricing';
import { Space } from '@/types/space';
import { timeToMinutes } from './dates';

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function preOrderTotal(lines: PreOrderLine[]): number {
  return roundMoney(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0));
}

export function tableDeposit(preOrderAmount: number, settings: PricingSettings): number {
  if (preOrderAmount <= 0) {
    return settings.tableDepositFlat;
  }
  return roundMoney(preOrderAmount * settings.tableDepositRate);
}

export function tablePayment(
  preOrderAmount: number,
  settings: PricingSettings,
): { deposit: number; balanceAtVenue: number } {
  const deposit = tableDeposit(preOrderAmount, settings);
  return { deposit, balanceAtVenue: roundMoney(Math.max(preOrderAmount - deposit, 0)) };
}

// Venue hire is charged for each started hour, and never less than the space's minimum.
export function estimateSpaceBooking(
  space: Space,
  startTime: string,
  endTime: string,
  decoration: DecorationPackage | null,
): PriceEstimate {
  const durationHours = (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60;
  const chargeableHours = Math.max(space.minHours, Math.ceil(durationHours));
  const venueHire = roundMoney(space.hourlyRate * chargeableHours);
  const decorationAmount = decoration ? decoration.price : 0;
  return {
    durationHours,
    chargeableHours,
    minimumApplied: durationHours < space.minHours,
    venueHire,
    decoration: decorationAmount,
    total: roundMoney(venueHire + decorationAmount),
  };
}
