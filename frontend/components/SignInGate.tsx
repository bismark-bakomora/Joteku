import { colors, radii, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';

type SignInGateProps = {
  title: string;
  message: string;
  redirect: Href;
};

// Asks people to log in or continue as a guest, then brings them back to `redirect`.
export function SignInGate({ title, message, redirect }: SignInGateProps) {
  const signIn = (mode: 'login' | 'guest' | 'signup') => {
    router.push({ pathname: '/sign-in', params: { mode, redirect: String(redirect) } });
  };

  return (
    <Card style={styles.card}>
      <View style={styles.icon}>
        <Ionicons color={colors.primary} name="lock-closed-outline" size={28} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        <Button label="Log in" onPress={() => signIn('login')} />
        <Button label="Continue as guest" onPress={() => signIn('guest')} variant="gold" />
        <Button label="Sign up" onPress={() => signIn('signup')} variant="neutral" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    ...typography.bodyMd,
    color: colors.textSubtle,
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
