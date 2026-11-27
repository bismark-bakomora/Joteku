import { AsyncView } from '@/components/AsyncView';
import { BookingCard } from '@/components/BookingCard';
import { EmptyState } from '@/components/EmptyState';
import { InfoBanner } from '@/components/InfoBanner';
import { PastBookingRow } from '@/components/PastBookingRow';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SignInGate } from '@/components/SignInGate';
import { useSession } from '@/context/SessionContext';
import { useAsync } from '@/hooks/useAsync';
import { useTabBarClearance } from '@/hooks/useTabBarClearance';
import { bookingStart } from '@/lib/availability';
import { formatPhoneLocal } from '@/lib/phone';
import { services } from '@/services';
import { makeStyles, spacing, typography, useTheme } from '@/theme';
import { Booking } from '@/types/booking';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

type Tab = 'upcoming' | 'past';

function isUpcoming(booking: Booking): boolean {
  return booking.status === 'pending_payment' || booking.status === 'confirmed';
}

export default function BookingsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { session, ready } = useSession();
  const [tab, setTab] = useState<Tab>('upcoming');
  const phone = session?.phone ?? null;
  const bookings = useAsync(
    () => (phone ? services.bookings.listMine() : Promise.resolve([])),
    [phone],
  );
  const spaces = useAsync(() => services.venue.getSpaces());
  const { reload } = bookings;
  const clearance = useTabBarClearance();
  const contentStyle = { ...styles.content, paddingBottom: clearance + spacing.xl };

  // Bookings change on other screens (paying, cancelling), so reload on return.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!session) {
    return (
      <ScreenContainer contentStyle={contentStyle} scroll>
        <SignInGate
          message="Your bookings and reservations are linked to your phone number. Log in or continue as a guest with the same number to see them."
          redirect="/bookings"
          title="Find your bookings"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentStyle={contentStyle} scroll>
      <AsyncView
        empty={{ title: 'No bookings yet', message: 'Your bookings will show here.' }}
        isEmpty={() => false}
        state={bookings}
      >
        {(items) => {
          const upcoming = items
            .filter(isUpcoming)
            .sort((a, b) => bookingStart(a).getTime() - bookingStart(b).getTime());
          const past = items.filter((booking) => !isUpcoming(booking));
          const shown = tab === 'upcoming' ? upcoming : past;
          const spaceFor = (booking: Booking) =>
            booking.kind === 'space'
              ? spaces.data?.find((candidate) => candidate.id === booking.spaceId)
              : undefined;

          return (
            <View style={styles.sections}>
              <SegmentedControl
                onSelect={setTab}
                segments={[
                  { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
                  { key: 'past', label: `Past (${past.length})` },
                ]}
                selected={tab}
              />
              <Text style={styles.phoneNote}>
                Bookings for {formatPhoneLocal(session.phone)}
              </Text>

              {shown.length === 0 ? (
                tab === 'upcoming' ? (
                  <EmptyState
                    actionLabel="Book a Space"
                    message="Book a space for your event or reserve a table, and it will show here."
                    onAction={() => router.push('/book-space/details')}
                    title="Nothing coming up"
                  />
                ) : (
                  <EmptyState message="Finished and cancelled bookings will show here." title="No past bookings" />
                )
              ) : tab === 'upcoming' ? (
                <View style={styles.list}>
                  {shown.map((booking) => (
                    <BookingCard
                      booking={booking}
                      key={booking.id}
                      onOpen={() =>
                        router.push({ pathname: '/booking/[bookingId]', params: { bookingId: booking.id } })
                      }
                      onPay={() =>
                        router.push({ pathname: '/pay/[bookingId]', params: { bookingId: booking.id } })
                      }
                      onPayBalance={() =>
                        router.push({ pathname: '/pay-balance/[bookingId]', params: { bookingId: booking.id } })
                      }
                      space={spaceFor(booking)}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.list}>
                  {shown.map((booking) => (
                    <PastBookingRow
                      booking={booking}
                      key={booking.id}
                      onPress={() =>
                        router.push({ pathname: '/booking/[bookingId]', params: { bookingId: booking.id } })
                      }
                    />
                  ))}
                </View>
              )}

              <InfoBanner
                actionLabel="Call or WhatsApp us"
                body="You can change the date of an event booking once, if the new time is free. Open the booking to change it."
                icon="calendar-outline"
                onAction={() => router.push('/contact')}
                title="Need to change your date?"
              />
            </View>
          );
        }}
      </AsyncView>
    </ScreenContainer>
  );
}

const useStyles = makeStyles((colors) => ({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.md,
  },
  sections: {
    gap: spacing.md,
  },
  phoneNote: {
    ...typography.caption,
    color: colors.textMuted,
  },
  list: {
    gap: spacing.md,
  },
}));
