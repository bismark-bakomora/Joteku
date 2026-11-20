import { useNotifications } from '@/context/NotificationsContext';
import { useSession } from '@/context/SessionContext';
import { contact } from '@/data/contact';
import { colors, radii, shadows, sizes, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pill } from './Pill';

export function BrandHeader() {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { unreadCount } = useNotifications();
  const hours = contact.openingHours.replace(' to ', '–');

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <Pressable
          accessibilityLabel="Profile"
          accessibilityRole="button"
          onPress={() => router.push('/profile')}
          style={styles.iconButton}
        >
          <Ionicons
            color={colors.primary}
            name={session ? 'person-circle' : 'person-outline'}
            size={session ? 36 : 30}
          />
        </Pressable>
        <View style={styles.center}>
          <Text style={styles.title}>{contact.venueName}</Text>
          <Pill dotColor={colors.primary} label={`${contact.addressLine1} • ${hours}`} />
        </View>
        {session ? (
          <Pressable
            accessibilityLabel={
              unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
            }
            accessibilityRole="button"
            onPress={() => router.push('/notifications')}
            style={styles.iconButton}
          >
            <Ionicons color={colors.primary} name="notifications-outline" size={24} />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : (
          // Keeps the title centred when there is no bell to show.
          <View style={styles.iconButton} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.background,
    ...shadows.card,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.primary,
  },
  iconButton: {
    width: sizes.tapTarget,
    height: sizes.tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: radii.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...typography.labelSm,
    fontSize: 11,
    lineHeight: 14,
    color: colors.onSecondary,
  },
});
