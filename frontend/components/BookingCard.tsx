import { formatDateShort, formatGhs, formatTime12, formatTimeRange } from '@/lib/format';
import { bookingTitle } from '@/lib/receipt';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import { Booking } from '@/types/booking';
import { Space } from '@/types/space';
import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { Pill } from './Pill';
import { fillImageStyle, spaceImages } from './spaceImages';
import { StatusBadge } from './StatusBadge';

type BookingCardProps = {
  booking: Booking;
  space?: Space;
  onOpen: () => void;
  onPay: () => void;
  onPayBalance: () => void;
};

function InfoLine({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.infoLine}>
      <Ionicons color={colors.secondary} name={icon} size={18} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

// An upcoming booking or reservation, following the Stitch "My Bookings" card.
export function BookingCard({ booking, space, onOpen, onPay, onPayBalance }: BookingCardProps) {
  const catering = booking.kind === 'space' ? booking.catering : undefined;

  return (
    <View style={styles.card}>
      {booking.kind === 'space' ? (
        <View style={styles.photo}>
          <Image
            accessibilityLabel={`${space?.name ?? 'Space'} at Joteku`}
            resizeMode="cover"
            source={spaceImages[booking.spaceId]}
            style={fillImageStyle}
          />
          <View style={styles.photoPills}>
            <StatusBadge status={booking.status} />
            <Pill label={booking.reference} tone="light" />
          </View>
        </View>
      ) : (
        <View style={styles.tableHeader}>
          <StatusBadge status={booking.status} />
          <Pill label={booking.reference} tone="secondary" />
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.title}>{bookingTitle(booking)}</Text>
        <View style={styles.info}>
          {booking.kind === 'space' ? (
            <>
              <InfoLine
                icon="calendar-outline"
                text={`${formatDateShort(booking.date)} · ${formatTimeRange(booking.startTime, booking.endTime)}`}
              />
              <InfoLine icon="people-outline" text={`${booking.guestCount} guests`} />
            </>
          ) : (
            <>
              <InfoLine
                icon="calendar-outline"
                text={`${formatDateShort(booking.date)} · ${formatTime12(booking.time)}`}
              />
              <InfoLine
                icon="restaurant-outline"
                text={
                  booking.preOrder.length > 0
                    ? `Pre-order of ${formatGhs(booking.preOrderTotal)}, ${formatGhs(booking.balanceAtVenue)} to pay at the venue`
                    : 'No pre-order'
                }
              />
            </>
          )}
          <InfoLine
            icon="wallet-outline"
            text={
              booking.status === 'pending_payment'
                ? `Waiting for payment of ${formatGhs(booking.amountDue)}`
                : `Paid ${formatGhs(booking.amountPaid)}`
            }
          />
        </View>

        {catering?.status === 'quoted' && catering.quoteAmount ? (
          <View style={styles.quote}>
            <View style={styles.quoteHeader}>
              <Text style={styles.quoteTitle}>Catering quote</Text>
              <Pill label="Action needed" tone="gold" />
            </View>
            <Text style={styles.quoteAmount}>{formatGhs(catering.quoteAmount)}</Text>
            <Button label="Pay Balance" leftIcon="wallet-outline" onPress={onPayBalance} variant="gold" />
          </View>
        ) : null}

        {booking.status === 'pending_payment' ? (
          <Button label="Pay now" leftIcon="lock-closed-outline" onPress={onPay} variant="gold" />
        ) : null}
        <Button label="View details" onPress={onOpen} rightIcon="chevron-forward" variant="neutral" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  photo: {
    height: 128,
    overflow: 'hidden',
    backgroundColor: colors.surfaceHigh,
  },
  photoPills: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.sm + 4,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm + 4,
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm + 4,
  },
  title: {
    ...typography.titleLg,
    color: colors.text,
  },
  info: {
    gap: spacing.xs + 2,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoText: {
    ...typography.bodyMd,
    color: colors.textSubtle,
    flex: 1,
  },
  quote: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radii.lg,
    padding: spacing.sm + 4,
    gap: spacing.sm,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quoteTitle: {
    ...typography.titleSm,
    color: colors.text,
  },
  quoteAmount: {
    ...typography.headline,
    color: colors.primary,
  },
});
