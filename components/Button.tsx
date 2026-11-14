import { colors, radii, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'gold' | 'tonal' | 'neutral';

type IconName = keyof typeof Ionicons.glyphMap;

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const palette = variantStyles[variant];
  const textColor = isDisabled ? colors.disabledText : palette.text;

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
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <Ionicons color={textColor} name={leftIcon} size={20} /> : null}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
          {rightIcon ? <Ionicons color={textColor} name={rightIcon} size={20} /> : null}
        </View>
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
  tonal: {
    backgroundColor: colors.primarySoft,
    border: colors.primarySoft,
    borderWidth: 0,
    text: colors.onPrimarySoft,
  },
  neutral: {
    backgroundColor: colors.surfaceContainer,
    border: colors.surfaceContainer,
    borderWidth: 0,
    text: colors.primary,
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
  },
});
