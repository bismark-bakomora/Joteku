import { colors, pillHitSlop, radii, shadows, sizes, spacing, typography } from '@/theme';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

type ChipOption<K extends string> = {
  key: K;
  label: string;
};

type FilterChipsProps<K extends string> = {
  options: ChipOption<K>[];
  selected: K | null;
  onSelect: (key: K) => void;
};

export function FilterChips<K extends string>({ options, selected, onSelect }: FilterChipsProps<K>) {
  return (
    <ScrollView
      contentContainerStyle={styles.row}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.bleed}
    >
      {options.map((option) => {
        const active = option.key === selected;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            hitSlop={pillHitSlop}
            key={option.key}
            onPress={() => onSelect(option.key)}
            style={[styles.chip, active ? styles.chipActive : undefined]}
          >
            <Text style={[styles.label, active ? styles.labelActive : undefined]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
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
    paddingVertical: pillHitSlop.top,
    gap: spacing.sm,
  },
  chip: {
    minHeight: sizes.pill,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  label: {
    ...typography.labelMd,
    color: colors.textSubtle,
  },
  labelActive: {
    color: colors.onPrimary,
  },
});
