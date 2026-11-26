import { SupabaseAuthService } from './supabase/auth';
import { SupabaseBookingService } from './supabase/bookings';
import { SupabaseMenuService } from './supabase/menu';
import { SupabaseNotificationService } from './supabase/notifications';
import { SupabasePaymentService } from './supabase/payments';
import { SupabaseVenueService } from './supabase/venue';
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

// The only place that picks an implementation. Everything runs on Supabase.
// Payments go through the server's mock provider until a real mobile money
// aggregator is connected there; the app does not change when it is.
const venue = new SupabaseVenueService();
const payments = new SupabasePaymentService();
const bookings = new SupabaseBookingService();

export const services: Services = {
  auth: new SupabaseAuthService(),
  venue,
  menu: new SupabaseMenuService(),
  payments,
  bookings,
  notifications: new SupabaseNotificationService(bookings, payments, venue),
};

export type { SpaceBookingDraft, TableReservationDraft } from './types';
