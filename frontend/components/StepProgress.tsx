import { makeStyles, radii, spacing, typography } from '@/theme';
import { Text, View } from 'react-native';

type StepProgressProps = {
  steps: string[];
  current: number;
};

export function StepProgress({ steps, current }: StepProgressProps) {
  const styles = useStyles();
  return (
    <View
      accessibilityLabel={`Step ${current + 1} of ${steps.length}: ${steps[current]}`}
      style={styles.wrap}
    >
      <Text style={styles.counter}>
        Step {current + 1} of {steps.length}
      </Text>
      <View style={styles.track}>
        {steps.map((step, index) => (
          <View
            key={step}
            style={[
              styles.segment,
              index < current ? styles.done : index === current ? styles.active : styles.todo,
            ]}
          />
        ))}
      </View>
      <View style={styles.labels}>
        {steps.map((step, index) => (
          <Text
            key={step}
            style={[styles.label, index === current ? styles.labelActive : undefined]}
          >
            {step}
          </Text>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    padding: spacing.sm + 4,
    gap: spacing.sm,
  },
  counter: {
    ...typography.labelSm,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  track: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  segment: {
    flex: 1,
    height: 8,
    borderRadius: radii.full,
  },
  done: {
    backgroundColor: colors.primary,
  },
  active: {
    backgroundColor: colors.primarySoftDim,
  },
  todo: {
    backgroundColor: colors.surfaceHighest,
  },
  labels: {
    flexDirection: 'row',
  },
  label: {
    flex: 1,
    ...typography.labelMd,
    color: colors.textMuted,
    textAlign: 'center',
  },
  labelActive: {
    color: colors.primary,
  },
}));
