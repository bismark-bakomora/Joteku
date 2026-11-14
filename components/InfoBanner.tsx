import { colors, radii, sizes, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type InfoBannerProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
};

export function InfoBanner({ icon, title, body, actionLabel, onAction, children }: InfoBannerProps) {
  return (
    <View style={styles.banner}>
      <View style={styles.icon}>
        <Ionicons color={colors.onSecondarySoft} name={icon} size={18} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}
        {children}
        {actionLabel && onAction ? (
          <Pressable accessibilityRole="link" onPress={onAction} style={styles.action}>
            <Text style={styles.actionLabel}>{actionLabel}</Text>
            <Ionicons color={colors.primary} name="chevron-forward" size={16} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 4,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.titleSm,
    color: colors.text,
  },
  body: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  action: {
    minHeight: sizes.tapTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  actionLabel: {
    ...typography.labelMd,
    color: colors.primary,
  },
});
