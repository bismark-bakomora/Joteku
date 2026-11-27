import { makeStyles, radii, sizes, spacing, typography, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

type NumberStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max?: number;
  label: string;
};

// Buttons for small changes, and the number can be typed for big ones like 150 guests.
export function NumberStepper({ value, onChange, min, max, label }: NumberStepperProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const clamp = (next: number) => Math.max(min, max === undefined ? next : Math.min(max, next));
  const [text, setText] = useState(String(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) {
      setText(String(value));
    }
  }, [value, editing]);

  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityLabel={`Fewer ${label}`}
        accessibilityRole="button"
        disabled={value <= min}
        onPress={() => onChange(clamp(value - 1))}
        style={styles.button}
      >
        <Ionicons color={value <= min ? colors.disabledText : colors.primary} name="remove" size={22} />
      </Pressable>
      <TextInput
        accessibilityLabel={`Number of ${label}`}
        keyboardType="number-pad"
        maxLength={4}
        onBlur={() => {
          setEditing(false);
          const next = text ? clamp(Number(text)) : min;
          onChange(next);
          setText(String(next));
        }}
        onChangeText={(typed) => {
          const digits = typed.replace(/\D/g, '');
          setText(digits);
          if (digits) {
            onChange(clamp(Number(digits)));
          }
        }}
        onFocus={() => setEditing(true)}
        selectTextOnFocus
        style={styles.input}
        value={text}
      />
      <Pressable
        accessibilityLabel={`More ${label}`}
        accessibilityRole="button"
        disabled={max !== undefined && value >= max}
        onPress={() => onChange(clamp(value + 1))}
        style={styles.button}
      >
        <Ionicons
          color={max !== undefined && value >= max ? colors.disabledText : colors.primary}
          name="add"
          size={22}
        />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  button: {
    width: sizes.tapTarget,
    height: sizes.tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minWidth: 64,
    minHeight: sizes.tapTarget,
    textAlign: 'center',
    ...typography.title,
    color: colors.primary,
    paddingHorizontal: spacing.xs,
  },
}));
