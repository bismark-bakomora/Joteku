export type MobileMoneyNetwork = 'mtn' | 'telecel' | 'airteltigo';

export type PaymentStatus = 'pending' | 'success' | 'failed';

export type PaymentPurpose = 'space_booking' | 'table_deposit' | 'catering_balance';

// The server works out the amount and description from the booking.
export type PaymentRequest = {
  bookingId: string;
  purpose: PaymentPurpose;
  phone: string;
  network: MobileMoneyNetwork;
};

export type Payment = PaymentRequest & {
  id: string;
  bookingReference: string;
  amount: number;
  description: string;
  status: PaymentStatus;
  createdAt: string;
  completedAt?: string;
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
