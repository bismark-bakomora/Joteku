import { makeStyles, spacing, typography } from '@/theme';
import { Text, View } from 'react-native';

type DetailRowProps = {
  label: string;
  value: string;
};

export function DetailRow({ label, value }: DetailRowProps) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  label: {
    ...typography.bodyMd,
    color: colors.textMuted,
  },
  value: {
    ...typography.titleSm,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
}));
