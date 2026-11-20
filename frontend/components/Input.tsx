import { colors, radii, spacing, typography } from '@/theme';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

type InputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({ label, error, ...props }: InputProps) {
  const hasError = Boolean(error);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        {...props}
        style={[
          styles.input,
          hasError ? styles.inputError : undefined,
          props.style,
        ]}
      />
      {hasError ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.text,
  },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    ...typography.caption,
    color: colors.error,
  },
});
