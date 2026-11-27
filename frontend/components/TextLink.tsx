import { makeStyles, sizes, typography } from '@/theme';
import { Pressable, Text } from 'react-native';

type TextLinkProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function TextLink({ label, onPress, disabled = false }: TextLinkProps) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.link}
    >
      <Text style={[styles.label, disabled ? styles.disabled : undefined]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  link: {
    minHeight: sizes.tapTarget,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  label: {
    ...typography.label,
    color: colors.primary,
    textAlign: 'center',
  },
  disabled: {
    color: colors.disabledText,
  },
}));
