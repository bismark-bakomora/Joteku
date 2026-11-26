import { AsyncView } from '@/components/AsyncView';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SignInGate } from '@/components/SignInGate';
import { useNotifications } from '@/context/NotificationsContext';
import { useSession } from '@/context/SessionContext';
import { useAsync } from '@/hooks/useAsync';
import { formatStamp } from '@/lib/format';
import { services } from '@/services';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import { AppNotification, NotificationKind } from '@/types/notification';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const ICONS: Record<NotificationKind, keyof typeof Ionicons.glyphMap> = {
  confirmed: 'checkmark-circle-outline',
  reminder: 'alarm-outline',
  catering_quoted: 'restaurant-outline',
  catering_paid: 'restaurant-outline',
  date_changed: 'calendar-outline',
  cancelled: 'close-circle-outline',
  refund: 'return-down-back-outline',
};

function NotificationRow({ item }: { item: AppNotification }) {
  return (
    <Pressable
      accessibilityLabel={`${item.read ? '' : 'New. '}${item.title}. ${item.body}`}
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/booking/[bookingId]', params: { bookingId: item.bookingId } })}
      style={[styles.row, item.read ? undefined : styles.rowUnread]}
    >
      <View style={styles.icon}>
        <Ionicons color={colors.primary} name={ICONS[item.kind]} size={22} />
      </View>
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.title}</Text>
          {item.read ? null : <View style={styles.dot} />}
        </View>
        <Text style={styles.body}>{item.body}</Text>
        <Text style={styles.meta}>
          {formatStamp(item.date)}
          {item.sentByText ? ' · also sent by text message' : ''}
        </Text>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { session } = useSession();
  const { refresh } = useNotifications();
  const phone = session?.phone ?? null;
  const notifications = useAsync(
    () => (phone ? services.notifications.list() : Promise.resolve([])),
    [phone],
  );

  // Opening the list marks everything as read, but this visit still shows which were new.
  useEffect(() => {
    const unread = (notifications.data ?? []).filter((item) => !item.read).map((item) => item.id);
    if (phone && unread.length > 0) {
      services.notifications.markRead(unread).then(refresh).catch(() => undefined);
    }
  }, [notifications.data, phone, refresh]);

  if (!session) {
    return (
      <ScreenContainer contentStyle={styles.content} scroll>
        <SignInGate
          message="Booking updates and reminders are linked to your phone number."
          redirect="/notifications"
          title="Sign in to see your notifications"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentStyle={styles.content} scroll>
      <AsyncView
        empty={{
          title: 'No notifications yet',
          message: 'Booking confirmations, reminders and refunds will show here.',
        }}
        state={notifications}
      >
        {(items) => (
          <View style={styles.list}>
            {items.map((item) => (
              <NotificationRow item={item} key={item.id} />
            ))}
          </View>
        )}
      </AsyncView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 4,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.sm + 4,
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadows.card,
  },
  rowUnread: {
    borderColor: colors.primarySoft,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.titleSm,
    color: colors.text,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.secondary,
  },
  body: {
    ...typography.bodyMd,
    color: colors.textSubtle,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
