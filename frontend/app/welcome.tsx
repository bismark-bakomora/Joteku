import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { TextLink } from '@/components/TextLink';
import { venuePhotos } from '@/components/venuePhotos';
import { venue } from '@/data/venue';
import { markWelcomeSeen } from '@/lib/welcome';
import { colors, radii, spacing, typography } from '@/theme';
import { OtpPurpose } from '@/types/auth';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    markWelcomeSeen();
  }, []);

  const signIn = (mode: OtpPurpose) => {
    router.push({ pathname: '/sign-in', params: { mode } });
  };

  const browse = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <ScrollView
      bounces={false}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
      style={styles.root}
    >
      <Image
        accessibilityLabel="The lawn walkway between the huts at Joteku"
        resizeMode="cover"
        source={venuePhotos.walkway}
        style={[styles.hero, { height: 280 + insets.top }]}
      />
      <View style={styles.body}>
        <Pill icon="ribbon" label={venue.heritageBadge} tone="gold" uppercase />
        <Text accessibilityRole="header" style={styles.title}>
          {venue.heroTitle}
        </Text>
        <Text style={styles.subtitle}>
          Eat, drink and book your next celebration or meeting at Teshie 1st Junction.
        </Text>

        <View style={styles.actions}>
          <Button label="Log in" onPress={() => signIn('login')} />
          <Button label="Sign up" onPress={() => signIn('signup')} variant="gold" />
          <Button label="Continue as guest" onPress={() => signIn('guest')} variant="neutral" />
        </View>

        <TextLink label="Just browse for now" onPress={browse} />
        <Text style={styles.note}>You can look at the menu and venue without an account.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
  },
  hero: {
    width: '100%',
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    backgroundColor: colors.surfaceHigh,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm + 4,
  },
  title: {
    ...typography.display,
    color: colors.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSubtle,
  },
  actions: {
    gap: spacing.sm + 4,
    marginTop: spacing.sm,
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
