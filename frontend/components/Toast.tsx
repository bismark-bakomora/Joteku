import { ToastMessage } from '@/hooks/useToast';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

type ToastProps = {
  toast: ToastMessage | null;
  bottomOffset?: number;
};

export function Toast({ toast, bottomOffset = spacing.md }: ToastProps) {
  if (!toast) {
    return null;
  }

  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom: bottomOffset }]}>
      <View accessibilityLiveRegion="polite" style={styles.toast}>
        <Ionicons color={colors.primarySoft} name={toast.icon} size={20} />
        <Text style={styles.text}>{toast.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.inverseSurface,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    ...shadows.raised,
  },
  text: {
    ...typography.caption,
    color: colors.onInverseSurface,
    flexShrink: 1,
  },
});
