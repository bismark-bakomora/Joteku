import { addMonths, compareMonths, MonthRef, monthWeeks } from '@/lib/calendar';
import { formatDateLong, monthName } from '@/lib/format';
import { makeStyles, radii, sizes, spacing, typography, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

export type DayState = 'available' | 'past' | 'full';

type CalendarMonthProps = {
  month: MonthRef;
  minMonth: MonthRef;
  maxMonth: MonthRef;
  onChangeMonth: (month: MonthRef) => void;
  selected: string | null;
  onSelect: (dateKey: string) => void;
  dayState: (dateKey: string) => DayState;
  loading: boolean;
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarMonth({
  month,
  minMonth,
  maxMonth,
  onChangeMonth,
  selected,
  onSelect,
  dayState,
  loading,
}: CalendarMonthProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const canGoBack = compareMonths(month, minMonth) > 0;
  const canGoForward = compareMonths(month, maxMonth) < 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Previous month"
          accessibilityRole="button"
          disabled={!canGoBack}
          onPress={() => onChangeMonth(addMonths(month, -1))}
          style={styles.nav}
        >
          <Ionicons color={canGoBack ? colors.primary : colors.disabledText} name="chevron-back" size={24} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text accessibilityRole="header" style={styles.title}>
            {monthName(month.month)} {month.year}
          </Text>
          {loading ? <ActivityIndicator color={colors.primary} size="small" /> : null}
        </View>
        <Pressable
          accessibilityLabel="Next month"
          accessibilityRole="button"
          disabled={!canGoForward}
          onPress={() => onChangeMonth(addMonths(month, 1))}
          style={styles.nav}
        >
          <Ionicons color={canGoForward ? colors.primary : colors.disabledText} name="chevron-forward" size={24} />
        </Pressable>
      </View>

      <View style={styles.row}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>

      {monthWeeks(month).map((week, weekIndex) => (
        <View key={weekIndex} style={styles.row}>
          {week.map((dateKey, dayIndex) => {
            if (!dateKey) {
              return <View key={`blank-${dayIndex}`} style={styles.cell} />;
            }
            const state = loading ? 'past' : dayState(dateKey);
            const active = dateKey === selected;
            const label = `${formatDateLong(dateKey)}${state === 'full' ? ', fully booked' : ''}`;
            return (
              <Pressable
                accessibilityLabel={label}
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: state !== 'available' }}
                disabled={state !== 'available'}
                key={dateKey}
                onPress={() => onSelect(dateKey)}
                style={styles.cell}
              >
                <View
                  style={[
                    styles.day,
                    active ? styles.dayActive : undefined,
                    state === 'full' ? styles.dayFull : undefined,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      active ? styles.dayTextActive : undefined,
                      state === 'past' ? styles.dayTextPast : undefined,
                      state === 'full' ? styles.dayTextFull : undefined,
                    ]}
                  >
                    {Number(dateKey.slice(8))}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.dayActive]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.dayFull]} />
          <Text style={styles.legendText}>Fully booked</Text>
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nav: {
    width: sizes.tapTarget,
    height: sizes.tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    ...typography.labelSm,
    color: colors.textMuted,
    paddingVertical: spacing.xs,
  },
  cell: {
    flex: 1,
    height: sizes.tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayActive: {
    backgroundColor: colors.primary,
  },
  dayFull: {
    backgroundColor: colors.disabled,
  },
  dayText: {
    ...typography.label,
    color: colors.text,
  },
  dayTextActive: {
    color: colors.onPrimary,
  },
  dayTextPast: {
    color: colors.disabledText,
  },
  dayTextFull: {
    color: colors.disabledText,
    textDecorationLine: 'line-through',
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: radii.full,
  },
  legendText: {
    ...typography.caption,
    color: colors.textSubtle,
  },
}));
