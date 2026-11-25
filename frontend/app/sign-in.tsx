import { Button } from '@/components/Button';
import { InfoBanner } from '@/components/InfoBanner';
import { Input } from '@/components/Input';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextLink } from '@/components/TextLink';
import { useSession } from '@/context/SessionContext';
import { AppErrorCode, errorCode, errorMessage } from '@/lib/errors';
import { formatPhoneLocal, normalizeGhanaPhone } from '@/lib/phone';
import { isValidOtp } from '@/lib/validation';
import { services } from '@/services';
import { colors, spacing, typography } from '@/theme';
import { OtpPurpose } from '@/types/auth';
import { Href, router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const RESEND_SECONDS = 30;

const TITLES: Record<OtpPurpose, string> = {
  login: 'Log in',
  signup: 'Sign up',
  guest: 'Continue as guest',
};

const INTROS: Record<OtpPurpose, string> = {
  login: 'Enter the phone number on your account. We will text you a code.',
  signup: 'Create an account with your phone number. We will text you a code to confirm it.',
  guest:
    'No account needed. Enter your phone number and we will text you a code. Use the same number later to find your bookings.',
};

type Step = 'details' | 'code';

export default function SignInScreen() {
  const params = useLocalSearchParams<{ mode?: string; redirect?: string }>();
  const purpose: OtpPurpose =
    params.mode === 'signup' || params.mode === 'guest' ? params.mode : 'login';
  const { setSession } = useSession();

  const [step, setStep] = useState<Step>('details');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [failure, setFailure] = useState<AppErrorCode | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) {
      return;
    }
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const details = purpose === 'signup' ? { name, email } : undefined;
  const normalizedPhone = normalizeGhanaPhone(phone);

  const showError = (caught: unknown, fallback: string) => {
    setError(errorMessage(caught, fallback));
    setFailure(errorCode(caught));
  };

  const switchMode = (mode: OtpPurpose) => {
    router.setParams({ mode });
    setStep('details');
    setError(null);
    setFailure(null);
  };

  const sendCode = async () => {
    setError(null);
    setFailure(null);
    if (!normalizedPhone) {
      setError('Enter a valid phone number, like 024 123 4567.');
      return;
    }
    setBusy(true);
    try {
      await services.auth.requestOtp(normalizedPhone, purpose, details);
      setCode('');
      setStep('code');
      setResendIn(RESEND_SECONDS);
    } catch (caught) {
      showError(caught, 'We could not send a code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const finish = () => {
    if (router.canDismiss()) {
      router.dismissAll();
    }
    if (params.redirect) {
      router.push(params.redirect as Href);
    }
  };

  const verify = async (value: string) => {
    if (!normalizedPhone) {
      setStep('details');
      return;
    }
    if (!isValidOtp(value)) {
      setError('Enter the 6-digit code.');
      return;
    }
    setError(null);
    setFailure(null);
    setBusy(true);
    try {
      const session = await services.auth.verifyOtp(normalizedPhone, value, purpose, details);
      setSession(session);
      finish();
    } catch (caught) {
      showError(caught, 'We could not check that code. Please try again.');
      setBusy(false);
    }
  };

  const changeCode = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6 && !busy) {
      verify(digits);
    }
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: TITLES[purpose] }} />
      <ScreenContainer contentStyle={styles.content} scroll>
        {step === 'details' ? (
          <>
            <Text style={styles.intro}>{INTROS[purpose]}</Text>
            <Input
              autoComplete="tel"
              keyboardType="phone-pad"
              label="Phone number"
              onChangeText={setPhone}
              onSubmitEditing={purpose === 'signup' ? undefined : sendCode}
              placeholder="024 123 4567"
              returnKeyType={purpose === 'signup' ? 'next' : 'send'}
              textContentType="telephoneNumber"
              value={phone}
            />
            {purpose === 'signup' ? (
              <>
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
              </>
            ) : null}

            {error ? (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                {error}
              </Text>
            ) : null}

            <Button label="Send code" loading={busy} onPress={sendCode} />

            {failure === 'account_missing' ? (
              <View style={styles.choices}>
                <Button label="Sign up instead" onPress={() => switchMode('signup')} variant="secondary" />
                <Button label="Continue as guest" onPress={() => switchMode('guest')} variant="neutral" />
              </View>
            ) : null}
            {failure === 'account_exists' ? (
              <Button label="Log in instead" onPress={() => switchMode('login')} variant="secondary" />
            ) : null}

            <View style={styles.links}>
              {purpose === 'login' ? (
                <>
                  <TextLink label="New to Joteku? Sign up" onPress={() => switchMode('signup')} />
                  <TextLink label="Continue as guest" onPress={() => switchMode('guest')} />
                </>
              ) : (
                <TextLink label="Already have an account? Log in" onPress={() => switchMode('login')} />
              )}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.intro}>
              Enter the 6-digit code we sent to{' '}
              <Text style={styles.phone}>{normalizedPhone ? formatPhoneLocal(normalizedPhone) : phone}</Text>.
            </Text>
            {services.auth.testHint ? (
              <InfoBanner
                body={services.auth.testHint}
                icon="construct-outline"
                title="Test mode"
              />
            ) : null}
            <Input
              autoComplete="sms-otp"
              autoFocus
              keyboardType="number-pad"
              label="Code"
              maxLength={6}
              onChangeText={changeCode}
              placeholder="000000"
              style={styles.codeInput}
              textContentType="oneTimeCode"
              value={code}
            />
            {error ? (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                {error}
              </Text>
            ) : null}
            <Button label="Verify" loading={busy} onPress={() => verify(code)} />
            <View style={styles.links}>
              <TextLink
                disabled={resendIn > 0 || busy}
                label={resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
                onPress={sendCode}
              />
              <TextLink
                label="Change number"
                onPress={() => {
                  setStep('details');
                  setError(null);
                }}
              />
            </View>
          </>
        )}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  intro: {
    ...typography.body,
    color: colors.textSubtle,
  },
  phone: {
    fontFamily: typography.titleMd.fontFamily,
    color: colors.text,
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
  },
  choices: {
    gap: spacing.sm,
  },
  links: {
    alignItems: 'center',
  },
  codeInput: {
    ...typography.headline,
    letterSpacing: 8,
    textAlign: 'center',
  },
});
