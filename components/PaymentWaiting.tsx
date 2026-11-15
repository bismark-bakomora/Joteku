import { contact } from '@/data/contact';
import { formatGhs } from '@/lib/format';
import { formatPhoneLocal } from '@/lib/phone';
import { colors, spacing, typography } from '@/theme';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { StepList } from './StepList';

type PaymentWaitingProps = {
  phone: string;
  amount: number;
  outcome: string;
  note: string;
};

export function PaymentWaiting({ phone, amount, outcome, note }: PaymentWaitingProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.title}>Approve the payment on your phone</Text>
      </View>
      <StepList
        steps={[
          { title: 'Check your phone', body: `A payment prompt has been sent to ${formatPhoneLocal(phone)}.` },
          {
            title: 'Enter your mobile money PIN',
            body: `Approve ${formatGhs(amount)} to ${contact.venueName}.`,
          },
          { title: 'Wait here', body: outcome },
        ]}
      />
      <Text style={styles.note}>{note}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
