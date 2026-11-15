import { ActionRow } from '@/components/ActionRow';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { InfoBanner } from '@/components/InfoBanner';
import { Input } from '@/components/Input';
import { Pill } from '@/components/Pill';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionHeader } from '@/components/SectionHeader';
import { Toast } from '@/components/Toast';
import { useCart } from '@/context/CartContext';
import { useSession } from '@/context/SessionContext';
import { useToast } from '@/hooks/useToast';
import { errorMessage } from '@/lib/errors';
import { formatPhoneLocal } from '@/lib/phone';
import { colors, radii, spacing, typography } from '@/theme';
import { OtpPurpose, Session } from '@/types/auth';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function ProfileScreen() {
  const { session, ready, updateProfile, signOut } = useSession();
  const { itemCount } = useCart();
  const { toast, show } = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  const signIn = (mode: OtpPurpose) => {
    router.push({ pathname: '/sign-in', params: { mode } });
  };

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenContainer contentStyle={styles.content} scroll>
        {session ? (
          <ProfileCard onEdit={() => setEditing(true)} session={session} />
        ) : (
          <Card style={styles.signedOut}>
            <View style={styles.signedOutIcon}>
              <Ionicons color={colors.primary} name="person-outline" size={32} />
            </View>
            <Text style={styles.signedOutTitle}>You are browsing as a visitor</Text>
            <Text style={styles.signedOutBody}>
              Log in or continue as a guest to book a space, reserve a table and see your bookings.
            </Text>
            <View style={styles.signedOutActions}>
              <Button label="Log in" onPress={() => signIn('login')} />
              <Button label="Sign up" onPress={() => signIn('signup')} variant="gold" />
              <Button label="Continue as guest" onPress={() => signIn('guest')} variant="neutral" />
            </View>
          </Card>
        )}

        {session?.isGuest && !editing ? (
          <InfoBanner
            actionLabel="Create account"
            body="Add your name to turn this number into an account. Your bookings stay linked to it."
            icon="person-add-outline"
            onAction={() => setEditing(true)}
            title="Save your details"
          />
        ) : null}

        {session && editing ? (
          <EditDetails
            onCancel={() => setEditing(false)}
            onSave={async (changes) => {
              await updateProfile(changes);
              setEditing(false);
              show('Your details are saved');
            }}
            session={session}
          />
        ) : null}

        <View>
          <SectionHeader title="Your activity" />
          <View style={styles.rows}>
            <ActionRow
              icon="ticket-outline"
              onPress={() => router.navigate('/bookings')}
              subtitle="Bookings, reservations and receipts"
              title="My Bookings"
              tone="primary"
            />
            <ActionRow
              icon="bag-handle-outline"
              onPress={() => router.push('/cart')}
              subtitle={
                itemCount > 0 ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'} waiting` : 'Nothing added yet'
              }
              title="Your Pre-order"
              tone="secondary"
            />
          </View>
        </View>

        <View>
          <SectionHeader title="Help and information" />
          <View style={styles.rows}>
            <ActionRow
              icon="help-circle-outline"
              onPress={() => router.push('/how-to-book')}
              subtitle="Steps, prices and payment"
              title="How to Book"
            />
            <ActionRow
              icon="document-text-outline"
              onPress={() => router.push('/terms')}
              subtitle="Cancellation, refund and payment terms"
              title="Terms & Policies"
            />
            <ActionRow
              icon="location-outline"
              onPress={() => router.push('/contact')}
              subtitle="Directions, opening hours, call or WhatsApp"
              title="Location & Contact"
            />
            <ActionRow
              icon="leaf-outline"
              onPress={() => router.push('/about')}
              subtitle="Our story, facilities and photos"
              title="About Joteku"
            />
          </View>
        </View>

        {session ? (
          confirmingSignOut ? (
            <View style={styles.confirm}>
              <Text style={styles.confirmText}>Sign out of Joteku on this phone?</Text>
              <View style={styles.confirmButtons}>
                <Button
                  label="Stay signed in"
                  onPress={() => setConfirmingSignOut(false)}
                  style={styles.confirmButton}
                  variant="neutral"
                />
                <Button
                  label="Sign out"
                  onPress={async () => {
                    await signOut();
                    setConfirmingSignOut(false);
                    setEditing(false);
                  }}
                  style={styles.confirmButton}
                  variant="secondary"
                />
              </View>
            </View>
          ) : (
            <Button
              label="Sign out"
              leftIcon="log-out-outline"
              onPress={() => setConfirmingSignOut(true)}
              variant="secondary"
            />
          )
        ) : null}
      </ScreenContainer>
      <Toast toast={toast} />
    </View>
  );
}

function ProfileCard({ session, onEdit }: { session: Session; onEdit: () => void }) {
  return (
    <Card style={styles.profile}>
      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          {session.name ? (
            <Text style={styles.avatarText}>{initials(session.name)}</Text>
          ) : (
            <Ionicons color={colors.onPrimary} name="person" size={28} />
          )}
        </View>
        <View style={styles.profileText}>
          <Text style={styles.profileName}>{session.name ?? 'Guest'}</Text>
          <Text style={styles.profileDetail}>{formatPhoneLocal(session.phone)}</Text>
          {session.email ? <Text style={styles.profileDetail}>{session.email}</Text> : null}
        </View>
      </View>
      <View style={styles.profileFooter}>
        <Pill label={session.isGuest ? 'Guest' : 'Account'} tone={session.isGuest ? 'neutral' : 'gold'} />
        {!session.isGuest ? (
          <Button
            label="Edit details"
            leftIcon="create-outline"
            onPress={onEdit}
            style={styles.editButton}
            variant="neutral"
          />
        ) : null}
      </View>
    </Card>
  );
}

type EditDetailsProps = {
  session: Session;
  onSave: (changes: { name: string; email?: string }) => Promise<void>;
  onCancel: () => void;
};

function EditDetails({ session, onSave, onCancel }: EditDetailsProps) {
  const [name, setName] = useState(session.name ?? '');
  const [email, setEmail] = useState(session.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      await onSave({ name, email });
    } catch (caught) {
      setError(errorMessage(caught, 'We could not save your details. Please try again.'));
      setSaving(false);
    }
  };

  return (
    <Card style={styles.form}>
      <Text style={styles.formTitle}>{session.isGuest ? 'Create your account' : 'Edit your details'}</Text>
      <Input
        autoCapitalize="words"
        autoComplete="name"
        label="Your name"
        onChangeText={setName}
        placeholder="Ama Mensah"
        textContentType="name"
        value={name}
      />
      <Input
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        label="Email (optional)"
        onChangeText={setEmail}
        placeholder="you@example.com"
        textContentType="emailAddress"
        value={email}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.confirmButtons}>
        <Button label="Cancel" onPress={onCancel} style={styles.confirmButton} variant="neutral" />
        <Button label="Save" loading={saving} onPress={save} style={styles.confirmButton} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  signedOut: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  signedOutIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signedOutTitle: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  signedOutBody: {
    ...typography.bodyMd,
    color: colors.textSubtle,
    textAlign: 'center',
  },
  signedOutActions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  profile: {
    gap: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.headline,
    color: colors.onPrimary,
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    ...typography.title,
    color: colors.text,
  },
  profileDetail: {
    ...typography.bodyMd,
    color: colors.textSubtle,
  },
  profileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  editButton: {
    paddingHorizontal: spacing.md,
  },
  form: {
    gap: spacing.md,
  },
  formTitle: {
    ...typography.titleMd,
    color: colors.text,
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
  },
  rows: {
    gap: spacing.sm,
  },
  confirm: {
    backgroundColor: colors.cancelledBackground,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  confirmText: {
    ...typography.titleSm,
    color: colors.text,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  confirmButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
});
