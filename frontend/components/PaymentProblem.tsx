import { useAnnounce } from '@/hooks/useAnnounce';
import { colors, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';

type PaymentProblemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  error?: string | null;
  children: ReactNode;
};

export function PaymentProblem({ icon, title, message, error, children }: PaymentProblemProps) {
  useAnnounce(`${title}. ${message}`);

  return (
    <Card style={styles.card}>
      <Ionicons color={colors.error} name={icon} size={48} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.actions}>{children}</View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    ...typography.bodyMd,
    color: colors.textSubtle,
    textAlign: 'center',
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
