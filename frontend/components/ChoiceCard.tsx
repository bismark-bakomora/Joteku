import { makeStyles, radii, shadows, sizes, spacing, typography, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

type ChoiceCardProps = {
  title: string;
  subtitle?: string;
  value?: string;
  valueNote?: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  disabledReason?: string;
  leading?: ReactNode;
};

// A selectable card that behaves like a radio button.
export function ChoiceCard({
  title,
  subtitle,
  value,
  valueNote,
  selected,
  onPress,
  disabled = false,
  disabledReason,
  leading,
}: ChoiceCardProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityHint={disabled ? disabledReason : undefined}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.card, selected ? styles.selected : undefined, disabled ? styles.disabled : undefined]}
    >
      {leading}
      <View style={styles.text}>
        <Text style={[styles.title, selected ? styles.titleSelected : undefined]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {disabled && disabledReason ? <Text style={styles.reason}>{disabledReason}</Text> : null}
      </View>
      {value ? (
        <View style={styles.valueWrap}>
          <Text style={styles.value}>{value}</Text>
          {valueNote ? <Text style={styles.valueNote}>{valueNote}</Text> : null}
        </View>
      ) : null}
      <View style={[styles.radio, selected ? styles.radioSelected : undefined]}>
        {selected ? <Ionicons color={colors.onPrimary} name="checkmark" size={16} /> : null}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    minHeight: sizes.tapTarget + 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.surface,
    padding: spacing.sm + 4,
    ...shadows.card,
  },
  selected: {
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.titleMd,
    color: colors.text,
  },
  titleSelected: {
    color: colors.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  reason: {
    ...typography.caption,
    color: colors.error,
  },
  valueWrap: {
    alignItems: 'flex-end',
  },
  value: {
    ...typography.titleMd,
    color: colors.primary,
  },
  valueNote: {
    ...typography.caption,
    color: colors.textMuted,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
}));
