import { ActionRow } from '@/components/ActionRow';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChoiceCard } from '@/components/ChoiceCard';
import { DetailRow } from '@/components/DetailRow';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionHeader } from '@/components/SectionHeader';
import { useSession } from '@/context/SessionContext';
import { errorMessage } from '@/lib/errors';
import { formatPhoneLocal } from '@/lib/phone';
import {
  AppearancePreference,
  makeStyles,
  radii,
  sizes,
  spacing,
  typography,
  useTheme,
} from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

const APPEARANCE_OPTIONS: {
  value: AppearancePreference;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: 'system',
    title: 'Same as my phone',
    subtitle: "Changes with your phone's light or dark setting",
    icon: 'phone-portrait-outline',
  },
  { value: 'light', title: 'Light', subtitle: 'Cream background with dark text', icon: 'sunny-outline' },
  { value: 'dark', title: 'Dark', subtitle: 'Dark background, easier on the eyes at night', icon: 'moon-outline' },
];

export default function SettingsScreen() {
  const styles = useStyles();
  const { colors, preference, setPreference } = useTheme();
  const { session } = useSession();
  const version = Constants.expoConfig?.version;

  return (
    <ScreenContainer contentStyle={styles.content} scroll>
      <View>
        <SectionHeader subtitle="How Joteku looks on this phone" title="Appearance" />
        <View accessibilityRole="radiogroup" style={styles.rows}>
          {APPEARANCE_OPTIONS.map((option) => (
            <ChoiceCard
              key={option.value}
              leading={
                <View style={styles.iconTile}>
                  <Ionicons color={colors.primary} name={option.icon} size={22} />
                </View>
              }
              onPress={() => setPreference(option.value)}
              selected={preference === option.value}
              subtitle={option.subtitle}
              title={option.title}
            />
          ))}
        </View>
      </View>

      {session ? (
        <View>
          <SectionHeader title="Account" />
          <View style={styles.rows}>
            <Card>
              <DetailRow label="Phone number" value={formatPhoneLocal(session.phone)} />
              <DetailRow label="Signed in as" value={session.isGuest ? 'Guest' : (session.name ?? 'Account')} />
            </Card>
            <DeleteAccount />
          </View>
        </View>
      ) : null}

      <View>
        <SectionHeader title="About" />
        <View style={styles.rows}>
          <ActionRow
            icon="document-text-outline"
            onPress={() => router.push('/terms')}
            subtitle="Cancellation, refund and payment terms"
            title="Terms & Policies"
          />
          {version ? (
            <Card>
              <DetailRow label="App version" value={version} />
            </Card>
          ) : null}
        </View>
      </View>
    </ScreenContainer>
  );
}

function DeleteAccount() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { deleteAccount } = useSession();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setError(null);
    setDeleting(true);
    try {
      await deleteAccount();
      router.back();
    } catch (caught) {
      setError(errorMessage(caught, 'We could not delete your account. Please try again.'));
      setDeleting(false);
    }
  };

  if (!confirming) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => setConfirming(true)}
        style={({ pressed }) => [styles.deleteRow, pressed ? styles.pressed : undefined]}
      >
        <Ionicons color={colors.error} name="trash-outline" size={22} />
        <Text style={styles.deleteLabel}>Delete account</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.confirm}>
      <Text style={styles.confirmTitle}>Delete your account?</Text>
      <Text style={styles.confirmBody}>
        Your name, email and phone number are removed from Joteku and you are signed out. You will no
        longer see your bookings or receipts in the app. Joteku keeps a record of past bookings and
        payments for its accounts, without your name.
      </Text>
      <Text style={styles.confirmBody}>
        If you have a booking still to come, cancel it first. This cannot be undone.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.confirmButtons}>
        <Button
          disabled={deleting}
          label="Keep account"
          onPress={() => {
            setConfirming(false);
            setError(null);
          }}
          style={styles.confirmButton}
          variant="neutral"
        />
        <Button label="Delete" loading={deleting} onPress={remove} style={styles.confirmButton} variant="danger" />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  rows: {
    gap: spacing.sm,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteRow: {
    minHeight: sizes.tapTarget + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  pressed: {
    opacity: 0.8,
  },
  deleteLabel: {
    ...typography.titleMd,
    color: colors.error,
  },
  confirm: {
    backgroundColor: colors.cancelledBackground,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  confirmTitle: {
    ...typography.titleMd,
    color: colors.text,
  },
  confirmBody: {
    ...typography.bodyMd,
    color: colors.text,
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  confirmButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
}));
