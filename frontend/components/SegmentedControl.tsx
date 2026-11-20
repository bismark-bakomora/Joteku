import { colors, radii, sizes, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Segment<K extends string> = {
  key: K;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
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
    <View accessibilityRole="tablist" style={styles.track}>
      {segments.map((segment) => {
        const active = segment.key === selected;
        const color = active ? colors.onPrimary : colors.textSubtle;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            key={segment.key}
            onPress={() => onSelect(segment.key)}
            style={[styles.segment, active ? styles.segmentActive : undefined]}
          >
            <Ionicons color={color} name={segment.icon} size={20} />
            <Text style={[styles.label, { color }]}>{segment.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radii.lg,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: sizes.tapTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  label: {
    ...typography.label,
  },
});
