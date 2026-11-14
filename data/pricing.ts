import { PricingSettings } from '@/types/pricing';

export const pricingSettings: PricingSettings = {
  holdMinutes: 10,
  tableDepositRate: 0.5,
  tableDepositFlat: 50,
  tableFullRefundHours: 24,
  spaceRefundTiers: [
    { minDaysBefore: 14, refundRate: 0.8 },
    { minDaysBefore: 7, refundRate: 0.5 },
    { minDaysBefore: 0, refundRate: 0 },
  ],
  freeDateChangeDays: 7,
  refundWorkingDays: 5,
};
