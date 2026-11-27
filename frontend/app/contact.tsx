import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { InfoBanner } from '@/components/InfoBanner';
import { Pill } from '@/components/Pill';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Toast } from '@/components/Toast';
import { venuePhotos } from '@/components/venuePhotos';
import { contact } from '@/data/contact';
import { useNow } from '@/hooks/useNow';
import { useToast } from '@/hooks/useToast';
import { isOpenNow } from '@/lib/hours';
import { makeStyles, radii, shadows, spacing, typography, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Linking, Text, View } from 'react-native';

export default function ContactScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const now = useNow();
  const { toast, show } = useToast();
  const open = isOpenNow(now, contact);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => show('We could not open that. Please try again.', 'alert-circle'));
  };

  return (
    <View style={styles.root}>
      <ScreenContainer contentStyle={styles.content} scroll>
        <View style={styles.locationCard}>
          <Image
            accessibilityLabel="The front of Joteku at Teshie 1st Junction"
            resizeMode="cover"
            source={venuePhotos.frontage}
            style={styles.photo}
          />
          <View style={styles.locationBody}>
            <View style={styles.row}>
              <Ionicons color={colors.secondary} name="location" size={24} />
              <View style={styles.flex}>
                <Text style={styles.title}>{contact.addressLine1}</Text>
                <Text style={styles.body}>{contact.addressLine2}</Text>
              </View>
            </View>
            <Button
              label="Get Directions"
              leftIcon="navigate"
              onPress={() => openLink(contact.directionsUrl)}
            />
          </View>
        </View>

        <Card>
          <View style={styles.row}>
            <Ionicons color={colors.primary} name="time-outline" size={24} />
            <View style={styles.flex}>
              <Text style={styles.title}>Opening hours</Text>
              <Text style={styles.body}>Every day, {contact.openingHours}</Text>
            </View>
            <Pill
              dotColor={open ? colors.primary : colors.error}
              label={open ? 'Open now' : 'Closed now'}
            />
          </View>
        </Card>

        <Card style={styles.callCard}>
          <Text style={styles.title}>Call or message us</Text>
          <Text selectable style={styles.phone}>
            {contact.phoneDisplay}
          </Text>
          <View style={styles.buttons}>
            <Button
              label="Call"
              leftIcon="call"
              onPress={() => openLink(`tel:${contact.phoneE164}`)}
              style={styles.flexButton}
            />
            <Button
              label="WhatsApp"
              leftIcon="logo-whatsapp"
              onPress={() => openLink(contact.whatsappUrl)}
              style={styles.flexButton}
              variant="tonal"
            />
          </View>
        </Card>

        <InfoBanner
          actionLabel="Venue & spaces"
          body="See our huts and the whole venue with prices, then book and pay in the app."
          icon="calendar-outline"
          onAction={() => router.push('/spaces')}
          title="Planning an event?"
        />
      </ScreenContainer>
      <Toast toast={toast} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  locationCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  photo: {
    width: '100%',
    height: 180,
    backgroundColor: colors.surfaceHigh,
  },
  locationBody: {
    padding: spacing.md,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  flex: {
    flex: 1,
  },
  title: {
    ...typography.titleMd,
    color: colors.text,
  },
  body: {
    ...typography.bodyMd,
    color: colors.textSubtle,
  },
  callCard: {
    gap: spacing.sm,
  },
  phone: {
    ...typography.amount,
    color: colors.primary,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
}));
