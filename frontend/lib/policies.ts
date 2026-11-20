import { mobileMoneyNetworks } from '@/data/networks';
import { PricingSettings } from '@/types/pricing';
import { formatGhs } from './format';

export type PolicySection = {
  title: string;
  points: string[];
};

// Policy wording is built from the pricing settings, so changing a number in
// admin settings changes every screen that shows it.

function percent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function joinWithAnd(items: string[]): string {
  if (items.length <= 1) {
    return items.join('');
  }
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function networkNames(): string {
  return joinWithAnd(mobileMoneyNetworks.map((network) => network.name));
}

export function refundTierLines(settings: PricingSettings): string[] {
  const tiers = [...settings.spaceRefundTiers].sort((a, b) => b.minDaysBefore - a.minDaysBefore);
  return tiers.map((tier, index) => {
    const previous = tiers[index - 1];
    let when: string;
    if (!previous) {
      when = `${tier.minDaysBefore} days or more before the event`;
    } else if (tier.minDaysBefore === 0) {
      when = `Less than ${previous.minDaysBefore} days before`;
    } else {
      when = `${tier.minDaysBefore} to ${previous.minDaysBefore - 1} days before`;
    }
    const outcome =
      tier.refundRate > 0
        ? `${percent(tier.refundRate)} refund`
        : 'no refund, but you can change the date once, subject to availability';
    return `${when}: ${outcome}`;
  });
}

export function cancellationPolicy(settings: PricingSettings): PolicySection {
  return {
    title: 'Cancelling an event or meeting',
    points: [
      ...refundTierLines(settings),
      `One free date change if you ask at least ${settings.freeDateChangeDays} days before the event.`,
      'If Joteku cancels, you get a full refund.',
      `Refunds go back to the same mobile money number within ${settings.refundWorkingDays} working days.`,
    ],
  };
}

export function tableReservationPolicy(settings: PricingSettings): PolicySection {
  return {
    title: 'Table reservations and pre-orders',
    points: [
      `The deposit is ${percent(settings.tableDepositRate)} of your pre-order total, or ${formatGhs(settings.tableDepositFlat)} if you do not pre-order.`,
      'Your reservation is confirmed once the deposit is paid. You pay the balance at the venue.',
      `Cancel at least ${settings.tableFullRefundHours} hours before your reservation time for a full refund of your deposit.`,
    ],
  };
}

export function paymentTerms(settings: PricingSettings): PolicySection {
  return {
    title: 'Payments',
    points: [
      `We take mobile money only: ${networkNames()}.`,
      'Events and meetings are paid in full upfront, and confirmed as soon as payment goes through.',
      'The upfront payment covers venue hire and your decoration package.',
      'Custom catering is not in the estimate. We send you a quote, and you pay it in the app with Pay Balance.',
      `Your time is held for ${settings.holdMinutes} minutes while you pay. If the payment fails or times out, the time is released.`,
    ],
  };
}
