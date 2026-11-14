import { PreOrderLine } from './menu';
import { SpaceId } from './space';

export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

export type EventType =
  | 'wedding'
  | 'engagement'
  | 'birthday'
  | 'other_reception'
  | 'meeting';

export type DecorationId = 'basic' | 'standard' | 'premium';

export type DecorationPackage = {
  id: DecorationId;
  name: string;
  description: string;
  price: number;
};

export type CateringRequest = {
  details: string;
  status: 'requested' | 'quoted' | 'paid';
  quoteAmount?: number;
};

type BookingBase = {
  id: string;
  reference: string;
  status: BookingStatus;
  phone: string;
  createdAt: string;
  holdExpiresAt?: string;
  amountDue: number;
  amountPaid: number;
  paymentId?: string;
  refundedAmount: number;
  cancelledAt?: string;
};

export type SpaceBooking = BookingBase & {
  kind: 'space';
  eventType: EventType;
  spaceId: SpaceId;
  date: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  notes?: string;
  decorationId: DecorationId | null;
  venueHireAmount: number;
  decorationAmount: number;
  catering?: CateringRequest;
  dateChangeUsed: boolean;
};

export type TableReservation = BookingBase & {
  kind: 'table';
  date: string;
  time: string;
  partySize: number;
  preOrder: PreOrderLine[];
  preOrderTotal: number;
  balanceAtVenue: number;
};

export type Booking = SpaceBooking | TableReservation;

export type BusySlot = {
  date: string;
  startTime: string;
  endTime: string;
};
