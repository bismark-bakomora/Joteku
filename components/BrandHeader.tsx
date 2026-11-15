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
  const hours = contact.openingHours.replace(' to ', '–');

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={styles.mark}>
          <Text style={styles.markLetter}>J</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.title}>{contact.venueName}</Text>
          <Pill dotColor={colors.primary} label={`${contact.addressLine1} • ${hours}`} />
        </View>
        <Pressable
          accessibilityLabel="Profile"
          accessibilityRole="button"
          onPress={() => router.push('/profile')}
          style={styles.profile}
        >
          <Ionicons
            color={colors.primary}
            name={session ? 'person-circle' : 'person-outline'}
            size={session ? 30 : 24}
          />
        </Pressable>
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
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  mark: {
    width: sizes.tapTarget,
    height: sizes.tapTarget,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLetter: {
    ...typography.title,
    color: colors.onPrimary,
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
  profile: {
    width: sizes.tapTarget,
    height: sizes.tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
