import { colors, radii, shadows, sizes, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  accessibilityLabel: string;
};

export function SearchField({ value, onChangeText, placeholder, accessibilityLabel }: SearchFieldProps) {
  return (
    <View style={styles.field}>
      <Ionicons color={colors.secondary} name="search" size={22} />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.outline}
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          onPress={() => onChangeText('')}
          style={styles.clear}
        >
          <Ionicons color={colors.outline} name="close-circle" size={22} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: sizes.tapTarget + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingLeft: spacing.md,
    ...shadows.card,
  },
  input: {
    flex: 1,
    minHeight: sizes.tapTarget,
    ...typography.body,
    color: colors.text,
  },
  clear: {
    width: sizes.tapTarget,
    height: sizes.tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
