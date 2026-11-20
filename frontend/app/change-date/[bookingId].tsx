import { AsyncView } from '@/components/AsyncView';
import { Button } from '@/components/Button';
import { CalendarMonth, DayState } from '@/components/CalendarMonth';
import { Card } from '@/components/Card';
import { DetailRow } from '@/components/DetailRow';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { InfoBanner } from '@/components/InfoBanner';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionHeader } from '@/components/SectionHeader';
import { TimeGrid } from '@/components/TimeGrid';
import { useNotifications } from '@/context/NotificationsContext';
import { useSession } from '@/context/SessionContext';
import { contact } from '@/data/contact';
import { useAsync } from '@/hooks/useAsync';
import { useNow } from '@/hooks/useNow';
import { isDateFullyBooked, startTimeOptions } from '@/lib/availability';
import { addMonths, MonthRef, monthOf, monthRange } from '@/lib/calendar';
import { minutesToTime, timeToMinutes, toDateKey } from '@/lib/dates';
import { errorMessage } from '@/lib/errors';
import { formatDateLong, formatDateShort, formatHours, formatTime12, formatTimeRange } from '@/lib/format';
import { bookingTitle } from '@/lib/receipt';
import { services } from '@/services';
import { colors, spacing, typography } from '@/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ChangeDateScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { session } = useSession();
  const { refresh } = useNotifications();
  const now = useNow();
  const today = toDateKey(now);

  const data = useAsync(async () => {
    const [booking, spaces] = await Promise.all([
      services.bookings.getBooking(bookingId),
      services.venue.getSpaces(),
    ]);
    const space = booking.kind === 'space' ? spaces.find((candidate) => candidate.id === booking.spaceId) : undefined;
    return { booking, space };
  }, [bookingId]);

  const [month, setMonth] = useState<MonthRef>(() => monthOf(toDateKey(new Date())));
  const [date, setDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const booking = data.data?.booking;
  const spaceId = booking?.kind === 'space' ? booking.spaceId : null;
  const range = monthRange(month);
  const monthBusy = useAsync(
    () =>
      spaceId ? services.bookings.getBusySlots(spaceId, range.first, range.last, bookingId) : Promise.resolve([]),
    [spaceId, range.first, bookingId],
  );
  const dayBusy = useAsync(
    () =>
      spaceId && date ? services.bookings.getBusySlots(spaceId, date, date, bookingId) : Promise.resolve([]),
    [spaceId, date, bookingId],
  );

  return (
    <ScreenContainer contentStyle={styles.content} scroll>
      <AsyncView
        empty={{ title: 'Booking not found', message: 'Find your bookings in My Bookings.' }}
        isEmpty={() => false}
        state={data}
      >
        {({ booking: current, space }) => {
          if (
            current.kind !== 'space' ||
            !space ||
            current.status !== 'confirmed' ||
            current.dateChangeUsed ||
            current.phone !== session?.phone
          ) {
            return (
              <EmptyState
                actionLabel="Back to booking"
                message="Only a confirmed event booking can change its date, and only once."
                onAction={() => router.back()}
                title="This date cannot be changed"
              />
            );
          }

          const lengthMinutes = timeToMinutes(current.endTime) - timeToMinutes(current.startTime);
          // Treat the booking's own length as the minimum, so every start offered fits it.
          const sameLength = { ...space, minHours: lengthMinutes / 60 };
          const dayState = (dateKey: string): DayState => {
            if (dateKey < today) {
              return 'past';
            }
            return isDateFullyBooked(sameLength, dateKey, monthBusy.data ?? [], now, contact) ? 'full' : 'available';
          };
          const options =
            date && !dayBusy.loading
              ? startTimeOptions(sameLength, date, dayBusy.data ?? [], now, contact).map((option) => ({
                  ...option,
                  available:
                    option.available && !(date === current.date && option.time === current.startTime),
                }))
              : [];
          const endTime = startTime ? minutesToTime(timeToMinutes(startTime) + lengthMinutes) : null;

          const save = async () => {
            if (!date || !startTime) {
              return;
            }
            setError(null);
            setSaving(true);
            try {
              await services.bookings.changeSpaceDate(current.id, date, startTime);
              refresh();
              router.back();
            } catch (caught) {
              setError(errorMessage(caught, 'We could not change the date. Please try again.'));
              setSaving(false);
            }
          };

          return (
            <View style={styles.sections}>
              <Card>
                <Text style={styles.cardTitle}>{bookingTitle(current)}</Text>
                <DetailRow label="Now booked for" value={formatDateLong(current.date)} />
                <DetailRow label="Time" value={formatTimeRange(current.startTime, current.endTime)} />
                <DetailRow label="Length" value={formatHours(lengthMinutes / 60)} />
              </Card>

              <InfoBanner
                body="You can change the date once. The space, length and price stay the same."
                icon="information-circle-outline"
                title="One free date change"
              />

              <View>
                <SectionHeader subtitle="Fully booked days are greyed out." title="New date" />
                {monthBusy.error && !monthBusy.data ? (
                  <ErrorState message="We could not check which days are free." onRetry={monthBusy.reload} />
                ) : (
                  <CalendarMonth
                    dayState={dayState}
                    loading={monthBusy.loading}
                    maxMonth={addMonths(monthOf(today), 12)}
                    minMonth={monthOf(today)}
                    month={month}
                    onChangeMonth={setMonth}
                    onSelect={(dateKey) => {
                      setDate(dateKey);
                      setStartTime(null);
                    }}
                    selected={date}
                  />
                )}
              </View>

              {date ? (
                <View style={styles.times}>
                  <SectionHeader
                    subtitle={`${formatDateLong(date)}. Your booking runs for ${formatHours(lengthMinutes / 60)}.`}
                    title="New start time"
                  />
                  {dayBusy.error && !dayBusy.data ? (
                    <ErrorState message="We could not check which times are free." onRetry={dayBusy.reload} />
                  ) : (
                    <TimeGrid onSelect={setStartTime} options={options} selected={startTime} />
                  )}
                </View>
              ) : null}

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Button
                disabled={!date || !startTime}
                label={
                  date && startTime && endTime
                    ? `Change to ${formatDateShort(date)}, ${formatTime12(startTime)}`
                    : 'Choose a new date and time'
                }
                leftIcon="calendar"
                loading={saving}
                onPress={save}
              />
            </View>
          );
        }}
      </AsyncView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
  },
  sections: {
    gap: spacing.lg,
  },
  cardTitle: {
    ...typography.titleMd,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  times: {
    gap: spacing.sm,
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
  },
});
