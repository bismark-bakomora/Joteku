import { DecorationId, EventType } from '@/types/booking';
import { SpaceId } from '@/types/space';
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export const BOOKING_STEPS = ['Space & date', 'Extras', 'Summary & pay'];

export type BookingDraft = {
  eventType: EventType | null;
  spaceId: SpaceId | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  guestCount: number;
  notes: string;
  decorationId: DecorationId | null;
  cateringDetails: string;
};

const EMPTY_DRAFT: BookingDraft = {
  eventType: null,
  spaceId: null,
  date: null,
  startTime: null,
  endTime: null,
  guestCount: 10,
  notes: '',
  decorationId: null,
  cateringDetails: '',
};

type BookingDraftValue = {
  draft: BookingDraft;
  update: (changes: Partial<BookingDraft>) => void;
};

const BookingDraftContext = createContext<BookingDraftValue | undefined>(undefined);

// Holds the booking form while someone moves through its steps. It lives in the
// book-space layout, so leaving the flow starts the next booking fresh.
export function BookingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<BookingDraft>(EMPTY_DRAFT);
  const update = useCallback((changes: Partial<BookingDraft>) => {
    setDraft((current) => ({ ...current, ...changes }));
  }, []);
  const value = useMemo(() => ({ draft, update }), [draft, update]);
  return <BookingDraftContext.Provider value={value}>{children}</BookingDraftContext.Provider>;
}

export function useBookingDraft(): BookingDraftValue {
  const value = useContext(BookingDraftContext);
  if (!value) {
    throw new Error('useBookingDraft must be used inside BookingDraftProvider');
  }
  return value;
}
