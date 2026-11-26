import { AsyncView } from '@/components/AsyncView';
import { Button } from '@/components/Button';
import { CalendarMonth, DayState } from '@/components/CalendarMonth';
import { Card } from '@/components/Card';
import { Checkbox } from '@/components/Checkbox';
import { DateChips } from '@/components/DateChips';
import { InfoBanner } from '@/components/InfoBanner';
import { NumberStepper } from '@/components/NumberStepper';
import { PolicyList } from '@/components/PolicyList';
import { PriceRow } from '@/components/PriceRow';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionHeader } from '@/components/SectionHeader';
import { SignInGate } from '@/components/SignInGate';
import { TextLink } from '@/components/TextLink';
import { TimeGrid } from '@/components/TimeGrid';
import { useCart } from '@/context/CartContext';
import { useSession } from '@/context/SessionContext';
import { contact } from '@/data/contact';
import { useAsync } from '@/hooks/useAsync';
import { useNow } from '@/hooks/useNow';
import { tableTimeOptions } from '@/lib/availability';
import { addMonths, MonthRef, monthOf } from '@/lib/calendar';
import { addDays, timeToMinutes, toDateKey } from '@/lib/dates';
import { errorMessage } from '@/lib/errors';
import { formatDateLong, formatGhs } from '@/lib/format';
import { tableReservationPolicy } from '@/lib/policies';
import { tablePayment } from '@/lib/pricing';
import { services } from '@/services';
import { colors, radii, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const QUICK_DAYS = 7;
const EVENING_FROM = timeToMinutes('17:00');
// Above this, a private hut usually suits the group better than a table.
const LARGE_GROUP = 20;

export default function ReserveTableScreen() {
  const { session, ready } = useSession();
  const cart = useCart();
  const settings = useAsync(() => services.venue.getSettings());
  const now = useNow();
  const today = toDateKey(now);
  const tomorrow = toDateKey(addDays(now, 1));

  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [includePreOrder, setIncludePreOrder] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [month, setMonth] = useState<MonthRef>(() => monthOf(toDateKey(new Date())));
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!session) {
    return (
      <ScreenContainer contentStyle={styles.content} scroll>
        <SignInGate
          message="Log in or continue as a guest with your phone number to reserve a table and pay the deposit."
          redirect="/reserve-table"
          title="Sign in to reserve a table"
        />
      </ScreenContainer>
    );
  }

  const hasFreeTime = (dateKey: string) =>
    tableTimeOptions(dateKey, now, contact).some((option) => option.available);
  const quickDates = Array.from({ length: QUICK_DAYS }, (_, index) => toDateKey(addDays(now, index))).filter(
    hasFreeTime,
  );
  const dayState = (dateKey: string): DayState => (hasFreeTime(dateKey) ? 'available' : 'past');

  const timeOptions = date ? tableTimeOptions(date, now, contact) : [];
  const daytime = timeOptions.filter((option) => timeToMinutes(option.time) < EVENING_FROM);
  const evening = timeOptions.filter((option) => timeToMinutes(option.time) >= EVENING_FROM);

  const preOrderLines = includePreOrder ? cart.lines : [];
  const preOrderAmount = includePreOrder ? cart.total : 0;

  const chooseDate = (dateKey: string) => {
    setDate(dateKey);
    setTime(null);
  };

  const reserve = async () => {
    if (!date || !time) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const reservation = await services.bookings.createTableReservation({
        date,
        time,
        partySize,
        preOrder: preOrderLines.map((line) => ({ itemId: line.itemId, quantity: line.quantity })),
      });
      router.push({ pathname: '/pay/[bookingId]', params: { bookingId: reservation.id } });
    } catch (caught) {
      setError(errorMessage(caught, 'We could not hold your table. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.content} scroll>
      <View style={styles.intro}>
        <View style={styles.introIcon}>
          <Ionicons color={colors.onPrimarySoft} name="restaurant" size={22} />
        </View>
        <View style={styles.introText}>
          <Text style={styles.introTitle}>Reserve a table at Joteku</Text>
          <Text style={styles.introBody}>
            {contact.addressLine1} · open daily, {contact.openingHours}. Pay a small deposit to hold your table.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Date" />
        <DateChips
          dates={quickDates}
          moreDatesActive={showCalendar}
          onMoreDates={() => setShowCalendar((open) => !open)}
          onSelect={chooseDate}
          selected={date}
          today={today}
          tomorrow={tomorrow}
        />
        {showCalendar ? (
          <CalendarMonth
            dayState={dayState}
            loading={false}
            maxMonth={addMonths(monthOf(today), 6)}
            minMonth={monthOf(today)}
            month={month}
            onChangeMonth={setMonth}
            onSelect={(dateKey) => {
              chooseDate(dateKey);
              setShowCalendar(false);
            }}
            selected={date}
          />
        ) : null}
        {date && !quickDates.includes(date) ? (
          <Text style={styles.chosen}>{formatDateLong(date)}</Text>
        ) : null}
      </View>

      {date ? (
        <View style={styles.section}>
          <SectionHeader subtitle={formatDateLong(date)} title="Time" />
          {daytime.length > 0 ? (
            <>
              <Text style={styles.groupLabel}>Daytime</Text>
              <TimeGrid onSelect={setTime} options={daytime} selected={time} />
            </>
          ) : null}
          <Text style={styles.groupLabel}>Evening</Text>
          <TimeGrid onSelect={setTime} options={evening} selected={time} />
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Number of people" />
        <NumberStepper label="people" min={1} onChange={setPartySize} value={partySize} />
        {partySize > LARGE_GROUP ? (
          <InfoBanner
            actionLabel="Book a space"
            body={`For more than ${LARGE_GROUP} people, booking a hut gives your group its own space.`}
            icon="people-outline"
            onAction={() => router.push('/book-space/details')}
            title="Planning for a big group?"
          />
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionHeader subtitle="Optional. Your food and drinks are ready when you arrive." title="Pre-order" />
        {cart.lines.length === 0 ? (
          <InfoBanner
            body="Your pre-order is empty. Add food and drinks from the menu, then reserve from your pre-order."
            icon="fast-food-outline"
            title="Nothing to pre-order yet"
          />
        ) : (
          <Card style={styles.preOrder}>
            <Checkbox
              checked={includePreOrder}
              label="Include my pre-order with this reservation"
              onChange={setIncludePreOrder}
            />
            {includePreOrder ? (
              <>
                {cart.lines.map((line) => (
                  <PriceRow
                    amount={formatGhs(line.unitPrice * line.quantity)}
                    key={line.itemId}
                    label={`${line.name} x ${line.quantity}`}
                  />
                ))}
                <PriceRow amount={formatGhs(cart.total)} label="Pre-order total" last />
                <TextLink label="Change my pre-order" onPress={() => router.push('/cart')} />
              </>
            ) : null}
          </Card>
        )}
      </View>

      <AsyncView
        empty={{ title: 'Deposit unavailable', message: 'Please try again.' }}
        isEmpty={() => false}
        state={settings}
      >
        {(value) => {
          const { deposit, balanceAtVenue } = tablePayment(preOrderAmount, value);
          const canReserve = date !== null && time !== null && accepted;
          return (
            <View style={styles.section}>
              <Card style={styles.deposit}>
                <Text accessibilityRole="header" style={styles.depositTitle}>
                  Deposit
                </Text>
                {preOrderAmount > 0 ? (
                  <>
                    <PriceRow amount={formatGhs(preOrderAmount)} label="Food and drinks" />
                    <PriceRow
                      amount={formatGhs(balanceAtVenue)}
                      detail="Plus anything else you order"
                      label="Paid at the venue"
                    />
                  </>
                ) : (
                  <Text style={styles.venueNote}>
                    You order and pay for your food and drinks at the venue.
                  </Text>
                )}
                <View style={styles.depositTotal}>
                  <Text style={styles.depositLabel}>Deposit to pay now</Text>
                  <Text style={styles.depositAmount}>{formatGhs(deposit)}</Text>
                </View>
                <PolicyList section={tableReservationPolicy(value)} />
                <Checkbox
                  checked={accepted}
                  label="I accept the reservation and refund terms"
                  onChange={setAccepted}
                />
              </Card>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Button
                disabled={!canReserve}
                label={`Continue to pay deposit · ${formatGhs(deposit)}`}
                leftIcon="wallet-outline"
                loading={submitting}
                onPress={reserve}
                variant="gold"
              />
              {!canReserve ? (
                <Text style={styles.hint}>
                  Choose a date and time, and accept the terms, to continue.
                </Text>
              ) : null}
            </View>
          );
        }}
      </AsyncView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  introIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: {
    flex: 1,
    gap: 2,
  },
  introTitle: {
    ...typography.title,
    color: colors.onPrimary,
  },
  introBody: {
    ...typography.caption,
    color: colors.onPrimaryMuted,
  },
  section: {
    gap: spacing.sm,
  },
  chosen: {
    ...typography.titleSm,
    color: colors.primary,
  },
  groupLabel: {
    ...typography.labelMd,
    color: colors.textSubtle,
  },
  preOrder: {
    gap: spacing.xs,
  },
  deposit: {
    gap: spacing.sm,
  },
  depositTitle: {
    ...typography.titleMd,
    color: colors.primary,
  },
  venueNote: {
    ...typography.bodyMd,
    color: colors.textSubtle,
  },
  depositTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.sm + 4,
  },
  depositLabel: {
    ...typography.titleSm,
    color: colors.text,
  },
  depositAmount: {
    ...typography.amount,
    color: colors.primary,
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
  },
  hint: {
    ...typography.bodyMd,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
