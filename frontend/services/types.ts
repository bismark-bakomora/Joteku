import { CancelledBy } from '@/lib/refunds';
import {
  Booking,
  BusySlot,
  DecorationId,
  DecorationPackage,
  EventType,
} from '@/types/booking';
import { OtpPurpose, Session } from '@/types/auth';
import { Menu, MenuItem } from '@/types/menu';
import { AppNotification } from '@/types/notification';
import { Payment, PaymentRequest, RefundRequest, Transaction } from '@/types/payment';
import { PricingSettings } from '@/types/pricing';
import { Space, SpaceId } from '@/types/space';

export type SignUpDetails = {
  name: string;
  email?: string;
};

export type ProfileChanges = {
  name: string;
  email?: string;
};

export interface AuthService {
  // Set only in test builds: tells testers how to sign in while no text message is sent.
  readonly testHint: string | null;
  requestOtp(phone: string, purpose: OtpPurpose, details?: SignUpDetails): Promise<void>;
  verifyOtp(
    phone: string,
    code: string,
    purpose: OtpPurpose,
    details?: SignUpDetails,
  ): Promise<Session>;
  getSession(): Promise<Session | null>;
  updateProfile(changes: ProfileChanges): Promise<Session>;
  signOut(): Promise<void>;
}

export interface VenueService {
  getSpaces(): Promise<Space[]>;
  getDecorations(): Promise<DecorationPackage[]>;
  getSettings(): Promise<PricingSettings>;
}

export interface MenuService {
  getMenu(): Promise<Menu>;
  getPopularItems(): Promise<MenuItem[]>;
}

export interface PaymentService {
  // Set only by the mock: explains which numbers fail or stay pending, for testers.
  readonly testHint: string | null;
  startPayment(request: PaymentRequest): Promise<Payment>;
  getPayment(paymentId: string): Promise<Payment>;
  refund(request: RefundRequest): Promise<Transaction>;
  listTransactions(customerPhone: string): Promise<Transaction[]>;
}

export type SpaceBookingDraft = {
  phone: string;
  eventType: EventType;
  spaceId: SpaceId;
  date: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  notes?: string;
  decorationId: DecorationId | null;
  cateringDetails?: string;
};

export type TableReservationDraft = {
  phone: string;
  date: string;
  time: string;
  partySize: number;
  preOrder: { itemId: string; quantity: number }[];
};

export type CancellationResult = {
  booking: Booking;
  refundAmount: number;
};

export type CancellationQuote = {
  cancellable: boolean;
  refundAmount: number;
};

export interface BookingService {
  getBusySlots(
    spaceId: SpaceId,
    fromDate: string,
    toDate: string,
    ignoreBookingId?: string,
  ): Promise<BusySlot[]>;
  createSpaceBooking(draft: SpaceBookingDraft): Promise<Booking>;
  createTableReservation(draft: TableReservationDraft): Promise<Booking>;
  markPaid(bookingId: string, paymentId: string): Promise<Booking>;
  releaseHold(bookingId: string): Promise<void>;
  restartHold(bookingId: string): Promise<Booking>;
  getCancellationQuote(bookingId: string): Promise<CancellationQuote>;
  cancelBooking(bookingId: string, cancelledBy?: CancelledBy): Promise<CancellationResult>;
  changeSpaceDate(bookingId: string, date: string, startTime: string): Promise<Booking>;
  getBooking(bookingId: string): Promise<Booking>;
  listForPhone(customerPhone: string): Promise<Booking[]>;
}

export interface NotificationService {
  list(customerPhone: string): Promise<AppNotification[]>;
  markRead(customerPhone: string, ids: string[]): Promise<void>;
}
