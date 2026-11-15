export type NotificationKind =
  | 'confirmed'
  | 'reminder'
  | 'catering_quoted'
  | 'catering_paid'
  | 'date_changed'
  | 'cancelled'
  | 'refund';

export type AppNotification = {
  id: string;
  bookingId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  date: string;
  sentByText: boolean;
  read: boolean;
};
