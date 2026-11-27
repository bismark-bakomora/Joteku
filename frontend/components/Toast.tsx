import { useAnnounce } from '@/hooks/useAnnounce';
import { ToastMessage } from '@/hooks/useToast';
import { makeStyles, radii, shadows, spacing, typography, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

type ToastProps = {
  toast: ToastMessage | null;
  bottomOffset?: number;
};

export function Toast({ toast, bottomOffset = spacing.md }: ToastProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  useAnnounce(toast?.text);

  if (!toast) {
    return null;
  }

  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom: bottomOffset }]}>
      <View style={styles.toast}>
        <Ionicons color={colors.primarySoft} name={toast.icon} size={20} />
        <Text style={styles.text}>{toast.text}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
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
}));
