import { useAnnounce } from '@/hooks/useAnnounce';
import { makeStyles, spacing, typography, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Card } from './Card';

type PaymentProblemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  error?: string | null;
  children: ReactNode;
};

export function PaymentProblem({ icon, title, message, error, children }: PaymentProblemProps) {
  const styles = useStyles();
  const { colors } = useTheme();
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

const useStyles = makeStyles((colors) => ({
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
}));
