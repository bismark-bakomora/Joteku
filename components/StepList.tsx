import { GuideStep } from '@/data/howToBook';
import { colors, radii, spacing, typography } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';

type StepListProps = {
  steps: GuideStep[];
};

export function StepList({ steps }: StepListProps) {
  return (
    <View style={styles.list}>
      {steps.map((step, index) => (
        <View key={step.title} style={styles.step}>
          <View style={styles.number}>
            <Text style={styles.numberText}>{index + 1}</Text>
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.body}>{step.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 4,
  },
  number: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    ...typography.labelMd,
    color: colors.onPrimary,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.titleMd,
    color: colors.text,
  },
  body: {
    ...typography.bodyMd,
    color: colors.textSubtle,
  },
});
