import { colors, spacing, typography } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';

type EmptyStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.button} />
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
    color: colors.text,
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
