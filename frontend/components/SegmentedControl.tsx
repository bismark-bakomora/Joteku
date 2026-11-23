import { colors, fontFamilies, pillHitSlop, radii, sizes, spacing, typography } from '@/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SlidingPill } from './SlidingPill';

type Segment<K extends string> = {
  key: K;
  label: string;
};

type SegmentedControlProps<K extends string> = {
  segments: Segment<K>[];
  selected: K;
  onSelect: (key: K) => void;
};

export function SegmentedControl<K extends string>({
  segments,
  selected,
  onSelect,
}: SegmentedControlProps<K>) {
  return (
    <View style={styles.track}>
      <View accessibilityRole="tablist" style={styles.row}>
        <SlidingPill
          color={colors.primary}
          count={segments.length}
          index={segments.findIndex((segment) => segment.key === selected)}
        />
        {segments.map((segment) => {
          const active = segment.key === selected;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              hitSlop={pillHitSlop}
              key={segment.key}
              onPress={() => onSelect(segment.key)}
              style={styles.segment}
            >
              <Text numberOfLines={1} style={[styles.label, active ? styles.labelActive : undefined]}>
                {segment.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surfaceHighest,
    borderRadius: radii.full,
    padding: spacing.xs,
  },
  row: {
    flexDirection: 'row',
  },
  segment: {
    flex: 1,
    // With the track's padding, the control is as tall as the search field.
    minHeight: sizes.field - spacing.xs * 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
  },
  label: {
    ...typography.label,
    color: colors.textSubtle,
  },
  labelActive: {
    fontFamily: fontFamilies.bodyBold,
    color: colors.onPrimary,
  },
});
