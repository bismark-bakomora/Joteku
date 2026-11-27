import { AsyncView } from '@/components/AsyncView';
import { Button } from '@/components/Button';
import { CalendarMonth, DayState } from '@/components/CalendarMonth';
import { ChoiceCard } from '@/components/ChoiceCard';
import { ErrorState } from '@/components/ErrorState';
import { FilterChips } from '@/components/FilterChips';
import { Input } from '@/components/Input';
import { NumberStepper } from '@/components/NumberStepper';
import { Pill } from '@/components/Pill';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionHeader } from '@/components/SectionHeader';
import { SignInGate } from '@/components/SignInGate';
import { fillImageStyle, spaceImages } from '@/components/spaceImages';
import { StepProgress } from '@/components/StepProgress';
import { TimeGrid } from '@/components/TimeGrid';
import { BOOKING_STEPS, useBookingDraft } from '@/context/BookingDraftContext';
import { useSession } from '@/context/SessionContext';
import { contact } from '@/data/contact';
import { eventTypes } from '@/data/eventTypes';
import { useAsync } from '@/hooks/useAsync';
import { useNow } from '@/hooks/useNow';
import { endTimeOptions, isDateFullyBooked, startTimeOptions } from '@/lib/availability';
import { addMonths, MonthRef, monthOf, monthRange } from '@/lib/calendar';
import { toDateKey } from '@/lib/dates';
import { formatDateLong, formatGhs, formatHours } from '@/lib/format';
import { joinWithAnd } from '@/lib/policies';
import { estimateSpaceBooking } from '@/lib/pricing';
import { services } from '@/services';
import { makeStyles, radii, spacing, typography, useTheme } from '@/theme';
import { Space, SpaceId } from '@/types/space';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

export default function BookingDetailsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { session, ready } = useSession();
  const params = useLocalSearchParams<{ spaceId?: string }>();
  const { draft, update } = useBookingDraft();
  const spacesState = useAsync(() => services.venue.getSpaces());
  const now = useNow();
  const today = toDateKey(now);
  const [month, setMonth] = useState<MonthRef>(() => monthOf(draft.date ?? toDateKey(new Date())));
  const [attempted, setAttempted] = useState(false);
  const minMonth = monthOf(today);
  const maxMonth = addMonths(minMonth, 12);
  const range = monthRange(month);

  const spaces = spacesState.data ?? [];
  const space = spaces.find((candidate) => candidate.id === draft.spaceId) ?? null;

  useEffect(() => {
    const requested = spaces.find((candidate) => candidate.id === params.spaceId);
    if (requested && !draft.spaceId) {
      update({ spaceId: requested.id });
    }
  }, [params.spaceId, spaces, draft.spaceId, update]);

  const monthBusy = useAsync(
    () =>
      draft.spaceId
        ? services.bookings.getBusySlots(draft.spaceId, range.first, range.last)
        : Promise.resolve([]),
    [draft.spaceId, range.first],
  );
  const dayBusy = useAsync(
    () =>
      draft.spaceId && draft.date
        ? services.bookings.getBusySlots(draft.spaceId, draft.date, draft.date)
        : Promise.resolve([]),
    [draft.spaceId, draft.date],
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
      <ScreenContainer contentStyle={styles.content} scroll>
        <SignInGate
          message="Log in or continue as a guest with your phone number. You can find the booking later with the same number."
          redirect={params.spaceId ? `/book-space/details?spaceId=${params.spaceId}` : '/book-space/details'}
          title="Sign in to book a space"
        />
      </ScreenContainer>
    );
  }

  const chooseSpace = (id: SpaceId) => {
    update({ spaceId: id, startTime: null, endTime: null });
  };

  const chooseDate = (dateKey: string) => {
    update({ date: dateKey, startTime: null, endTime: null });
  };

  const dayState = (dateKey: string): DayState => {
    if (dateKey < today || !space) {
      return dateKey < today ? 'past' : 'available';
    }
    if (dateKey === today && isDateFullyBooked(space, dateKey, [], now, contact)) {
      return 'past';
    }
    return isDateFullyBooked(space, dateKey, monthBusy.data ?? [], now, contact) ? 'full' : 'available';
  };

  const dayBusySlots = dayBusy.loading ? null : dayBusy.data ?? [];
  const startOptions =
    space && draft.date && dayBusySlots
      ? startTimeOptions(space, draft.date, dayBusySlots, now, contact)
      : [];
  const endOptions =
    space && draft.date && draft.startTime && dayBusySlots
      ? endTimeOptions(space, draft.date, draft.startTime, dayBusySlots, contact)
      : [];

  const tooManyGuests = space !== null && space.maxGuests !== null && draft.guestCount > space.maxGuests;
  const missing: string[] = [];
  if (!draft.eventType) {
    missing.push('the type of event (at the top)');
  }
  if (!space) {
    missing.push('a space');
  }
  if (!draft.date) {
    missing.push('a date');
  }
  if (!draft.startTime) {
    missing.push('a start time');
  } else if (!draft.endTime) {
    missing.push('an end time');
  }
  const canContinue = missing.length === 0 && !tooManyGuests;
  const estimate =
    space && draft.startTime && draft.endTime
      ? estimateSpaceBooking(space, draft.startTime, draft.endTime, null)
      : null;

  // The button stays tappable so people are told what is missing, rather than
  // facing a grey button with no reason.
  const continueToExtras = () => {
    if (canContinue) {
      router.push('/book-space/extras');
    } else {
      setAttempted(true);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.content} scroll>
      <StepProgress current={0} steps={BOOKING_STEPS} />

      {space ? <SpaceHero space={space} /> : null}

      <View>
        <SectionHeader title="Type of event" />
        <FilterChips
          onSelect={(eventType) => update({ eventType })}
          options={eventTypes.map((type) => ({ key: type.id, label: type.label }))}
          selected={draft.eventType}
        />
        {attempted && !draft.eventType ? (
          <Text style={styles.error}>Choose the type of event to continue.</Text>
        ) : null}
      </View>

      <View>
        <SectionHeader
          subtitle={draft.eventType === 'meeting' ? 'Huts 1 and 2 suit meetings.' : undefined}
          title="Choose a space"
        />
        <AsyncView
          empty={{ title: 'No spaces yet', message: 'Spaces to book will show here soon.' }}
          state={spacesState}
        >
          {(items) => (
            <View style={styles.list}>
              {items.map((candidate) => {
                const tooSmall = candidate.maxGuests !== null && draft.guestCount > candidate.maxGuests;
                const meetingFit = draft.eventType === 'meeting' && candidate.suitableForMeetings;
                return (
                  <ChoiceCard
                    disabled={tooSmall}
                    disabledReason={tooSmall ? `Fits up to ${candidate.maxGuests} guests` : undefined}
                    key={candidate.id}
                    leading={
                      <Image
                        accessibilityIgnoresInvertColors
                        source={spaceImages[candidate.id]}
                        style={styles.thumb}
                      />
                    }
                    onPress={() => chooseSpace(candidate.id)}
                    selected={candidate.id === draft.spaceId}
                    subtitle={`${candidate.capacityLabel} · minimum ${formatHours(candidate.minHours)}${meetingFit ? ' · good for meetings' : ''}`}
                    title={candidate.name}
                    value={formatGhs(candidate.hourlyRate)}
                    valueNote="per hour"
                  />
                );
              })}
            </View>
          )}
        </AsyncView>
      </View>

      <View>
        <SectionHeader title="Number of guests" />
        <NumberStepper
          label="guests"
          min={1}
          onChange={(guestCount) => update({ guestCount })}
          value={draft.guestCount}
        />
        {tooManyGuests && space ? (
          <Text style={styles.error}>
            {space.name} fits up to {space.maxGuests} guests. Choose a bigger space or fewer guests.
          </Text>
        ) : null}
      </View>

      <View>
        <SectionHeader
          subtitle={space ? 'Fully booked days are greyed out.' : undefined}
          title="Date"
        />
        {space ? (
          monthBusy.error && !monthBusy.data ? (
            <ErrorState
              message="We could not check which days are free. Please try again."
              onRetry={monthBusy.reload}
            />
          ) : (
            <CalendarMonth
              dayState={dayState}
              loading={monthBusy.loading}
              maxMonth={maxMonth}
              minMonth={minMonth}
              month={month}
              onChangeMonth={setMonth}
              onSelect={chooseDate}
              selected={draft.date}
            />
          )
        ) : (
          <Text style={styles.hint}>Choose a space to see the days it is free.</Text>
        )}
      </View>

      {space && draft.date ? (
        <View style={styles.times}>
          <SectionHeader
            subtitle={`${formatDateLong(draft.date)}. Taken times are greyed out. ${space.name} has a minimum of ${formatHours(space.minHours)}.`}
            title="Start time"
          />
          {dayBusy.error && !dayBusy.data ? (
            <ErrorState
              message="We could not check which times are free. Please try again."
              onRetry={dayBusy.reload}
            />
          ) : dayBusySlots === null ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <TimeGrid
              onSelect={(startTime) => update({ startTime, endTime: null })}
              options={startOptions}
              selected={draft.startTime}
            />
          )}
          {draft.startTime && dayBusySlots ? (
            <>
              <SectionHeader title="End time" />
              <TimeGrid
                onSelect={(endTime) => update({ endTime })}
                options={endOptions}
                selected={draft.endTime}
              />
            </>
          ) : null}
        </View>
      ) : null}

      <Input
        label="Notes for Joteku (optional)"
        multiline
        onChangeText={(notes) => update({ notes })}
        placeholder="Anything we should know about your event"
        style={styles.notes}
        textAlignVertical="top"
        value={draft.notes}
      />

      {estimate ? (
        <View style={styles.estimate}>
          <Text style={styles.estimateLabel}>
            Venue hire, {formatHours(estimate.chargeableHours)}
          </Text>
          <Text style={styles.estimateAmount}>{formatGhs(estimate.venueHire)}</Text>
        </View>
      ) : null}

      {attempted && !canContinue ? (
        <View accessibilityLiveRegion="polite" style={styles.missing}>
          <Ionicons color={colors.error} name="alert-circle" size={22} />
          <Text style={styles.missingText}>
            {missing.length > 0
              ? `To continue, choose ${joinWithAnd(missing)}.`
              : 'Choose a bigger space or fewer guests to continue.'}
          </Text>
        </View>
      ) : null}

      <Button label="Continue to extras" onPress={continueToExtras} rightIcon="arrow-forward" />
    </ScreenContainer>
  );
}

function SpaceHero({ space }: { space: Space }) {
  const styles = useStyles();
  return (
    <View style={styles.hero}>
      <Image
        accessibilityLabel={`${space.name} at Joteku`}
        resizeMode="cover"
        source={spaceImages[space.id]}
        style={fillImageStyle}
      />
      <View style={styles.heroPills}>
        <Pill label={space.name} tone="light" />
        <Pill label={`${formatGhs(space.hourlyRate)} / hr`} tone="gold" />
      </View>
    </View>
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
    gap: spacing.lg,
  },
  hero: {
    height: 144,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceHigh,
    justifyContent: 'flex-end',
  },
  heroPills: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm + 4,
  },
  list: {
    gap: spacing.sm,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
    marginTop: spacing.sm,
  },
  hint: {
    ...typography.bodyMd,
    color: colors.textMuted,
  },
  missing: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.cancelledBackground,
    borderRadius: radii.md,
    padding: spacing.sm + 4,
  },
  missingText: {
    ...typography.bodyMd,
    color: colors.text,
    flex: 1,
  },
  times: {
    gap: spacing.sm,
  },
  notes: {
    minHeight: 96,
    paddingTop: spacing.sm + 4,
  },
  estimate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm + 4,
  },
  estimateLabel: {
    ...typography.bodyMd,
    color: colors.textSubtle,
  },
  estimateAmount: {
    ...typography.titleLg,
    color: colors.primary,
  },
}));
