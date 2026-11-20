import { formatDateShort } from '@/lib/format';
import { colors, radii, sizes, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

type DateChipsProps = {
  dates: string[];
  today: string;
  tomorrow: string;
  selected: string | null;
  onSelect: (dateKey: string) => void;
  onMoreDates: () => void;
  moreDatesActive: boolean;
};

export function DateChips({
  dates,
  today,
  tomorrow,
  selected,
  onSelect,
  onMoreDates,
  moreDatesActive,
}: DateChipsProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.row}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.bleed}
    >
      {dates.map((dateKey) => {
        const active = dateKey === selected;
        const [weekday, day, month] = formatDateShort(dateKey).split(' ');
        const label = dateKey === today ? 'Today' : dateKey === tomorrow ? 'Tomorrow' : weekday;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={dateKey}
            onPress={() => onSelect(dateKey)}
            style={[styles.chip, active ? styles.chipActive : undefined]}
          >
            <Text style={[styles.top, active ? styles.textActive : undefined]}>{label}</Text>
            <Text style={[styles.bottom, active ? styles.textActive : undefined]}>
              {day} {month}
            </Text>
          </Pressable>
        );
      })}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: moreDatesActive }}
        onPress={onMoreDates}
        style={[styles.chip, moreDatesActive ? styles.chipOutline : undefined]}
      >
        <Ionicons color={colors.secondary} name="calendar-outline" size={20} />
        <Text style={styles.more}>Other date</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bleed: {
    marginHorizontal: -spacing.screen,
    flexGrow: 0,
  },
  row: {
    paddingHorizontal: spacing.screen,
    gap: spacing.sm,
  },
  chip: {
    minWidth: 88,
    minHeight: sizes.tapTarget + 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.sm + 4,
    borderWidth: 2,
    borderColor: colors.surfaceContainer,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipOutline: {
    borderColor: colors.secondary,
  },
  top: {
    ...typography.labelSm,
    color: colors.textSubtle,
    textTransform: 'uppercase',
  },
  bottom: {
    ...typography.titleMd,
    color: colors.text,
  },
  textActive: {
    color: colors.onPrimary,
  },
  more: {
    ...typography.labelMd,
    color: colors.secondary,
  },
});
