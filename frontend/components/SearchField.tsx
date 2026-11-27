import { makeStyles, radii, shadows, sizes, spacing, typography, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, View } from 'react-native';

type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  accessibilityLabel: string;
};

export function SearchField({ value, onChangeText, placeholder, accessibilityLabel }: SearchFieldProps) {
  const styles = useStyles();
  const { colors } = useTheme();
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

const useStyles = makeStyles((colors) => ({
  field: {
    minHeight: sizes.field,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    paddingLeft: spacing.md + 4,
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
    borderRadius: radii.full,
    marginRight: spacing.xs,
  },
}));
