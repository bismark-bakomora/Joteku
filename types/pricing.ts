export type RefundTier = {
  minDaysBefore: number;
  refundRate: number;
};

export type PricingSettings = {
  holdMinutes: number;
  tableDepositRate: number;
  tableDepositFlat: number;
  tableFullRefundHours: number;
  spaceRefundTiers: RefundTier[];
  freeDateChangeDays: number;
  refundWorkingDays: number;
};

export type PriceEstimate = {
  durationHours: number;
  chargeableHours: number;
  minimumApplied: boolean;
  venueHire: number;
  decoration: number;
  total: number;
};
