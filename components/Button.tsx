import { colors, radii, spacing, typography } from '@/theme';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'gold';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const palette = variantStyles[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isDisabled ? colors.disabled : palette.backgroundColor,
          borderColor: isDisabled ? colors.disabled : palette.border,
          borderWidth: palette.borderWidth,
          opacity: pressed && !isDisabled ? 0.92 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isDisabled ? colors.disabledText : palette.text} />
      ) : (
        <Text
          style={[
            styles.label,
            { color: isDisabled ? colors.disabledText : palette.text },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const variantStyles = {
  primary: {
    backgroundColor: colors.primary,
    border: colors.primary,
    borderWidth: 0,
    text: colors.onPrimary,
  },
  secondary: {
    backgroundColor: 'transparent',
    border: colors.secondary,
    borderWidth: 1.5,
    text: colors.secondary,
  },
  gold: {
    backgroundColor: colors.gold,
    border: colors.gold,
    borderWidth: 0,
    text: colors.onGold,
  },
} as const;

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  label: {
    ...typography.label,
  },
});
