import { MockBookingService } from './mock/bookings';
import { MockMenuService } from './mock/menu';
import { MockNotificationService } from './mock/notifications';
import { MockPaymentService } from './mock/payments';
import { MockVenueService } from './mock/venue';
import { SupabaseAuthService } from './supabase/auth';
import {
  AuthService,
  BookingService,
  MenuService,
  NotificationService,
  PaymentService,
  VenueService,
} from './types';

type Services = {
  auth: AuthService;
  venue: VenueService;
  menu: MenuService;
  payments: PaymentService;
  bookings: BookingService;
  notifications: NotificationService;
};

// The only place that picks an implementation. Sign-in runs on Supabase; the
// rest still uses the mocks until they move to Supabase, and payments stay
// mocked until a real mobile money aggregator is connected.
export const services: Services = {
  auth: new SupabaseAuthService(),
  venue: new MockVenueService(),
  menu: new MockMenuService(),
  payments: new MockPaymentService(),
  bookings: new MockBookingService(),
  notifications: new MockNotificationService(),
};

export type { SpaceBookingDraft, TableReservationDraft } from './types';
