import { MockAuthService } from './mock/auth';
import { MockBookingService } from './mock/bookings';
import { MockMenuService } from './mock/menu';
import { MockNotificationService } from './mock/notifications';
import { MockPaymentService } from './mock/payments';
import { MockVenueService } from './mock/venue';
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

// The only place that picks an implementation. Swap the mocks for the real
// backend and payment aggregator here.
export const services: Services = {
  auth: new MockAuthService(),
  venue: new MockVenueService(),
  menu: new MockMenuService(),
  payments: new MockPaymentService(),
  bookings: new MockBookingService(),
  notifications: new MockNotificationService(),
};

export type { SpaceBookingDraft, TableReservationDraft } from './types';
