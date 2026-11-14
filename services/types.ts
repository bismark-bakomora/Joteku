import { CancelledBy } from '@/lib/refunds';
import {
  Booking,
  BusySlot,
  DecorationId,
  DecorationPackage,
  EventType,
} from '@/types/booking';
import { Session } from '@/types/auth';
import { Menu, MenuItem } from '@/types/menu';
import { Payment, PaymentRequest, RefundRequest, Transaction } from '@/types/payment';
import { PricingSettings } from '@/types/pricing';
import { Space, SpaceId } from '@/types/space';

export type SignInOptions = {
  guest?: boolean;
  name?: string;
  email?: string;
};

export interface AuthService {
  requestOtp(phone: string): Promise<void>;
  verifyOtp(phone: string, code: string, options?: SignInOptions): Promise<Session>;
  getSession(): Promise<Session | null>;
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

export interface BookingService {
  getBusySlots(spaceId: SpaceId, fromDate: string, toDate: string): Promise<BusySlot[]>;
  createSpaceBooking(draft: SpaceBookingDraft): Promise<Booking>;
  createTableReservation(draft: TableReservationDraft): Promise<Booking>;
  markPaid(bookingId: string, paymentId: string): Promise<Booking>;
  releaseHold(bookingId: string): Promise<void>;
  restartHold(bookingId: string): Promise<Booking>;
  cancelBooking(bookingId: string, cancelledBy?: CancelledBy): Promise<CancellationResult>;
  getBooking(bookingId: string): Promise<Booking>;
  listForPhone(customerPhone: string): Promise<Booking[]>;
}
