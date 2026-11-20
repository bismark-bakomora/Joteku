export type MobileMoneyNetwork = 'mtn' | 'telecel' | 'airteltigo';

export type PaymentStatus = 'pending' | 'success' | 'failed';

export type PaymentPurpose = 'space_booking' | 'table_deposit' | 'catering_balance';

export type PaymentRequest = {
  bookingId: string;
  bookingReference: string;
  purpose: PaymentPurpose;
  amount: number;
  phone: string;
  network: MobileMoneyNetwork;
  description: string;
};

export type Payment = PaymentRequest & {
  id: string;
  status: PaymentStatus;
  createdAt: string;
  completedAt?: string;
};

export type RefundRequest = {
  bookingId: string;
  bookingReference: string;
  amount: number;
  phone: string;
  network: MobileMoneyNetwork;
  description: string;
};

export type Transaction = {
  id: string;
  type: 'payment' | 'refund';
  status: PaymentStatus;
  bookingId: string;
  bookingReference: string;
  amount: number;
  phone: string;
  network: MobileMoneyNetwork;
  description: string;
  date: string;
};
