import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionHeader } from '@/components/SectionHeader';
import { contact } from '@/data/contact';
import { venue } from '@/data/venue';
import { colors, radii, spacing, typography } from '@/theme';
import { router } from 'expo-router';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const openCall = () => {
    Linking.openURL(`tel:${contact.phoneE164}`);
  };

  const openWhatsApp = () => {
    Linking.openURL(contact.whatsappUrl);
  };

  return (
    <ScreenContainer scroll>
      <View style={styles.header}>
        <Text style={styles.brand}>{contact.venueName}</Text>
        <Text style={styles.welcome}>{venue.welcomeLine}</Text>
        <Text style={styles.hours}>Open daily {contact.openingHours}</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.row}>
          <IconTile
            icon="business-outline"
            label="Book a Space"
            onPress={() => router.push('/book-space')}
          />
          <IconTile
            icon="restaurant-outline"
            label="Reserve a Table"
            onPress={() => router.push('/reserve-table')}
          />
        </View>
        <View style={styles.row}>
          <IconTile
            icon="fast-food-outline"
            label="Menu"
            onPress={() => router.push('/menu')}
          />
          <IconTile
            icon="calendar-outline"
            label="My Bookings"
            onPress={() => router.push('/bookings')}
          />
        </View>
      </View>

      <SectionHeader title={venue.aboutTitle} />
      <Card style={styles.aboutCard}>
        <Image
          accessibilityLabel="Joteku venue at Teshie 1st Junction"
          source={require('../../assets/about-placeholder.png')}
          style={styles.aboutImage}
        />
        <Text style={styles.aboutBody}>{venue.aboutBody}</Text>
      </Card>

      <SectionHeader title="Location and Contact" subtitle={contact.addressLine2} />
      <Card>
        <Text style={styles.addressTitle}>{contact.addressLine1}</Text>
        <Text style={styles.addressBody}>{contact.addressLine2}</Text>
        <Text style={styles.phone}>{contact.phoneDisplay}</Text>
        <View style={styles.actions}>
          <Button label="Call" onPress={openCall} style={styles.actionButton} variant="secondary" />
          <Button label="WhatsApp" onPress={openWhatsApp} style={styles.actionButton} variant="gold" />
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  brand: {
    ...typography.headline,
    color: colors.primary,
  },
  welcome: {
    ...typography.body,
    color: colors.text,
  },
  hours: {
    ...typography.caption,
    color: colors.textMuted,
  },
  grid: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  aboutCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  aboutImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  aboutBody: {
    ...typography.bodyMd,
    color: colors.textSubtle,
    padding: spacing.md,
  },
  addressTitle: {
    ...typography.titleMd,
    color: colors.text,
  },
  addressBody: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  phone: {
    ...typography.bodyMd,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
