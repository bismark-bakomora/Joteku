import { colors, radii, sizes, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={styles.row}
    >
      <View style={[styles.box, checked ? styles.boxChecked : undefined]}>
        {checked ? <Ionicons color={colors.onPrimary} name="checkmark" size={18} /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: sizes.tapTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  box: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.text,
  },
});
