import { TimeOption } from '@/lib/availability';
import { formatTime12 } from '@/lib/format';
import { makeStyles, radii, sizes, spacing, typography } from '@/theme';
import { Pressable, Text, View } from 'react-native';

type TimeGridProps = {
  options: TimeOption[];
  selected: string | null;
  onSelect: (time: string) => void;
};

// Taken times stay visible but greyed out and struck through, as the brief asks.
export function TimeGrid({ options, selected, onSelect }: TimeGridProps) {
  const styles = useStyles();
  return (
    <View style={styles.grid}>
      {options.map((option) => {
        const active = option.time === selected;
        return (
          <Pressable
            accessibilityLabel={`${formatTime12(option.time)}${option.available ? '' : ', taken'}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: active, disabled: !option.available }}
            disabled={!option.available}
            key={option.time}
            onPress={() => onSelect(option.time)}
            style={[
              styles.slot,
              active ? styles.slotActive : undefined,
              option.available ? undefined : styles.slotTaken,
            ]}
          >
            <Text
              style={[
                styles.label,
                active ? styles.labelActive : undefined,
                option.available ? undefined : styles.labelTaken,
              ]}
            >
              {formatTime12(option.time)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slot: {
    width: '31.5%',
    minHeight: sizes.tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  slotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotTaken: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
  },
  label: {
    ...typography.label,
    color: colors.text,
  },
  labelActive: {
    color: colors.onPrimary,
  },
  labelTaken: {
    color: colors.disabledText,
    textDecorationLine: 'line-through',
  },
}));
