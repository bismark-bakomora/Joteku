import { AsyncView } from '@/components/AsyncView';
import { ReceiptCard } from '@/components/ReceiptCard';
import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextLink } from '@/components/TextLink';
import { Toast } from '@/components/Toast';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import {
  CalendarEntry,
  googleCalendarUrl,
  receiptHtml,
  receiptText,
  spaceBookingReceipt,
  spaceCalendarEntry,
  tableCalendarEntry,
  tableReservationReceipt,
} from '@/lib/receipt';
import { services } from '@/services';
import { colors, radii, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar/legacy';
import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Linking, Platform, Share, StyleSheet, Text, View } from 'react-native';

async function downloadReceipt(html: string): Promise<void> {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Save or share your receipt',
  });
}

async function addToCalendar(entry: CalendarEntry): Promise<void> {
  if (Platform.OS === 'web') {
    await Linking.openURL(googleCalendarUrl(entry));
    return;
  }
  if (Platform.OS === 'ios') {
    const { granted } = await Calendar.requestCalendarPermissionsAsync();
    if (!granted) {
      await Linking.openURL(googleCalendarUrl(entry));
      return;
    }
  }
  await Calendar.createEventInCalendarAsync({
    title: entry.title,
    startDate: entry.startDate,
    endDate: entry.endDate,
    location: entry.location,
    notes: entry.notes,
  });
}

export default function ReceiptScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { toast, show } = useToast();
  const data = useAsync(async () => {
    const booking = await services.bookings.getBooking(bookingId);
    const [spaces, decorations, payment] = await Promise.all([
      services.venue.getSpaces(),
      services.venue.getDecorations(),
      booking.paymentId ? services.payments.getPayment(booking.paymentId) : Promise.resolve(null),
    ]);
    if (booking.kind === 'table') {
      return {
        booking,
        receipt: tableReservationReceipt(booking, payment),
        calendarEntry: tableCalendarEntry(booking),
      };
    }
    const space = spaces.find((candidate) => candidate.id === booking.spaceId);
    if (!space) {
      throw new Error('Space not found');
    }
    const decoration = decorations.find((candidate) => candidate.id === booking.decorationId) ?? null;
    return {
      booking,
      receipt: spaceBookingReceipt(booking, space, decoration, payment),
      calendarEntry: spaceCalendarEntry(booking, space),
    };
  }, [bookingId]);

  const run = async (action: () => Promise<void>, failure: string) => {
    try {
      await action();
    } catch {
      show(failure, 'alert-circle');
    }
  };

  return (
    <View style={styles.root}>
      <ScreenContainer contentStyle={styles.content} scroll>
        <AsyncView
          empty={{ title: 'Receipt not found', message: 'Find your booking in My Bookings.' }}
          isEmpty={() => false}
          state={data}
        >
          {({ booking, receipt, calendarEntry }) => (
            <View style={styles.sections}>
              <View style={styles.banner}>
                <View style={styles.bannerIcon}>
                  <Ionicons color={colors.onPrimarySoft} name="checkmark-circle" size={32} />
                </View>
                <View style={styles.bannerText}>
                  <Text style={styles.bannerLabel}>
                    {booking.status === 'confirmed'
                      ? booking.kind === 'table'
                        ? 'Table reserved'
                        : 'Booking confirmed'
                      : 'Booking'}
                  </Text>
                  <Text selectable style={styles.bannerReference}>
                    {receipt.reference}
                  </Text>
                  <Text style={styles.bannerNote}>Keep this reference for any questions.</Text>
                </View>
              </View>

              <ReceiptCard receipt={receipt} status={booking.status} />

              <View style={styles.actions}>
                <Button
                  label="Download receipt"
                  leftIcon="download-outline"
                  onPress={() =>
                    run(() => downloadReceipt(receiptHtml(receipt)), 'We could not create the receipt file.')
                  }
                />
                <View style={styles.actionRow}>
                  <Button
                    label="Share"
                    leftIcon="share-social-outline"
                    onPress={() =>
                      run(
                        async () => {
                          await Share.share({ message: receiptText(receipt), title: 'Joteku receipt' });
                        },
                        'Sharing is not available here.',
                      )
                    }
                    style={styles.half}
                    variant="neutral"
                  />
                  <Button
                    label="Add to calendar"
                    leftIcon="calendar-outline"
                    onPress={() =>
                      run(() => addToCalendar(calendarEntry), 'We could not open your calendar.')
                    }
                    style={styles.half}
                    variant="neutral"
                  />
                </View>
                <Button
                  label="My Bookings"
                  leftIcon="ticket-outline"
                  onPress={() => router.navigate('/bookings')}
                  variant="secondary"
                />
                <TextLink label="Back to Home" onPress={() => router.navigate('/')} />
              </View>
            </View>
          )}
        </AsyncView>
      </ScreenContainer>
      <Toast toast={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.md,
  },
  sections: {
    gap: spacing.lg,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  bannerIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    flex: 1,
  },
  bannerLabel: {
    ...typography.labelSm,
    color: colors.primarySoftDim,
    textTransform: 'uppercase',
  },
  bannerReference: {
    ...typography.headline,
    color: colors.onPrimary,
  },
  bannerNote: {
    ...typography.caption,
    color: colors.onPrimaryMuted,
  },
  actions: {
    gap: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  half: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
});

