import { useSession } from '@/context/SessionContext';
import { mobileMoneyNetworks } from '@/data/networks';
import { formatGhs } from '@/lib/format';
import { formatPhoneLocal, normalizeGhanaPhone, suggestNetwork } from '@/lib/phone';
import { services } from '@/services';
import { colors, spacing, typography } from '@/theme';
import { MobileMoneyNetwork } from '@/types/payment';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { ChoiceCard } from './ChoiceCard';
import { InfoBanner } from './InfoBanner';
import { Input } from './Input';
import { NetworkLogo } from './NetworkLogo';
import { SectionHeader } from './SectionHeader';

type MobileMoneyFormProps = {
  amount: number;
  busy: boolean;
  error: string | null;
  onPay: (phone: string, network: MobileMoneyNetwork) => void;
};

// Network choice and wallet number, shared by every mobile money payment. The
// network is guessed from the number until the customer picks one themselves.
export function MobileMoneyForm({ amount, busy, error, onPay }: MobileMoneyFormProps) {
  const { session } = useSession();
  const [phone, setPhone] = useState(session ? formatPhoneLocal(session.phone) : '');
  const [network, setNetwork] = useState<MobileMoneyNetwork | null>(
    session ? suggestNetwork(session.phone) : null,
  );
  const [networkChosen, setNetworkChosen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const changePhone = (text: string) => {
    setPhone(text);
    const normalized = normalizeGhanaPhone(text);
    if (normalized && !networkChosen) {
      setNetwork(suggestNetwork(normalized));
    }
  };

  const submit = () => {
    setFormError(null);
    const normalized = normalizeGhanaPhone(phone);
    if (!normalized) {
      setFormError('Enter the mobile money number, like 024 123 4567.');
      return;
    }
    if (!network) {
      setFormError('Choose your mobile money network.');
      return;
    }
    onPay(normalized, network);
  };

  const shownError = formError ?? error;

  return (
    <View style={styles.wrap}>
      <View>
        <SectionHeader title="Your mobile money network" />
        <View style={styles.list}>
          {mobileMoneyNetworks.map((option) => (
            <ChoiceCard
              key={option.id}
              leading={<NetworkLogo network={option.id} />}
              onPress={() => {
                setNetwork(option.id);
                setNetworkChosen(true);
              }}
              selected={network === option.id}
              title={`${option.name} Mobile Money`}
            />
          ))}
        </View>
      </View>
      <Input
        autoComplete="tel"
        keyboardType="phone-pad"
        label="Mobile money number"
        onChangeText={changePhone}
        placeholder="024 123 4567"
        textContentType="telephoneNumber"
        value={phone}
      />
      {services.payments.testHint ? (
        <InfoBanner body={services.payments.testHint} icon="construct-outline" title="Test mode" />
      ) : null}
      {shownError ? <Text style={styles.error}>{shownError}</Text> : null}
      <Button
        label={`Pay ${formatGhs(amount)}`}
        leftIcon="lock-closed-outline"
        loading={busy}
        onPress={submit}
        variant="gold"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
  },
});
