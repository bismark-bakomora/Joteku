import { colors, spacing, typography } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Button label="Try again" onPress={onRetry} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.error,
    textAlign: 'center',
  },
  message: {
    ...typography.bodyMd,
    color: colors.textMuted,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
});
