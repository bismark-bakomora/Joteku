import { ActionRow } from '@/components/ActionRow';
import { AsyncView } from '@/components/AsyncView';
import { Button } from '@/components/Button';
import { FeatureCard } from '@/components/FeatureCard';
import { MenuItemRow } from '@/components/MenuItemRow';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { Pill } from '@/components/Pill';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionHeader } from '@/components/SectionHeader';
import { SpaceCard } from '@/components/SpaceCard';
import { PreOrderBar } from '@/components/PreOrderBar';
import { Toast } from '@/components/Toast';
import { contact } from '@/data/contact';
import { venue } from '@/data/venue';
import { useCart } from '@/context/CartContext';
import { useAsync } from '@/hooks/useAsync';
import { useTabBarClearance } from '@/hooks/useTabBarClearance';
import { useToast } from '@/hooks/useToast';
import { services } from '@/services';
import { colors, fontFamilies, radii, shadows, spacing, typography } from '@/theme';
import { MenuItem } from '@/types/menu';
import { Space } from '@/types/space';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const { toast, show } = useToast();
  const [barHeight, setBarHeight] = useState(0);
  const clearance = useTabBarClearance();
  const cart = useCart();
  const spaces = useAsync(() => services.venue.getSpaces());
  const popular = useAsync(() => services.menu.getPopularItems());

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => show('We could not open that. Please try again.', 'alert-circle'));
  };

  const addToPreOrder = (item: MenuItem) => {
    cart.add(item);
    show(`${item.name} added to pre-order`);
  };

  const bookSpace = (space: Space) => {
    router.push({ pathname: '/book-space/details', params: { spaceId: space.id } });
  };

  return (
    <View style={styles.root}>
      <ScreenContainer
        contentStyle={{ ...styles.content, paddingBottom: clearance + barHeight + spacing.xl }}
        scroll
      >
        <View style={styles.hero}>
          <PhotoPlaceholder
            accessibilityLabel="Joteku venue photo placeholder"
            icon="restaurant-outline"
            iconSize={64}
            iconStyle={styles.heroIcon}
            style={styles.heroPhoto}
            tone="green"
          >
            <View style={styles.heroOverlay}>
              <View>
                <Text style={styles.heroTitle}>{venue.heroTitle}</Text>
                <Text style={styles.heroSubtitle}>{venue.heroSubtitle}</Text>
              </View>
            </View>
          </PhotoPlaceholder>
          <View style={styles.contactStrip}>
            <View style={styles.locationRow}>
              <Ionicons color={colors.secondary} name="location" size={22} />
              <View style={styles.locationText}>
                <Text numberOfLines={1} style={styles.locationTitle}>
                  {contact.addressLine1}
                </Text>
                <Text numberOfLines={1} style={styles.locationBody}>
                  {contact.addressLine2}
                </Text>
              </View>
              <Pill label={venue.establishedLabel} tone="secondary" />
            </View>
            <View style={styles.contactButtons}>
              <Button
                label="Call Venue"
                leftIcon="call"
                onPress={() => openLink(`tel:${contact.phoneE164}`)}
                style={styles.contactButton}
                variant="neutral"
              />
              <Button
                label="WhatsApp Us"
                leftIcon="logo-whatsapp"
                onPress={() => openLink(contact.whatsappUrl)}
                style={styles.contactButton}
                variant="tonal"
              />
            </View>
          </View>
        </View>

        <View>
          <SectionHeader title="How Can We Serve You?" />
          <View style={styles.actions}>
            <FeatureCard
              badge="Popular Choice"
              ctaLabel="Choose Date & Space"
              description="Book a hut or the whole venue for weddings, engagements, birthdays and meetings."
              icon="business"
              onPress={() => router.push('/book-space/details')}
              title="Book an Event Space"
            />
            <ActionRow
              icon="restaurant-outline"
              onPress={() => router.push('/reserve-table')}
              subtitle="Pick a time and pre-order your meal"
              title="Reserve a Table"
            />
            <ActionRow
              icon="fast-food-outline"
              onPress={() => router.push('/menu')}
              subtitle="Tilapia, banku, light soup, cold beers and sobolo"
              title="Food & Drinks Menu"
              tone="secondary"
            />
            <ActionRow
              icon="ticket-outline"
              onPress={() => router.push('/bookings')}
              subtitle="See your bookings, receipts and payments"
              tone="primary"
              title="My Bookings"
            />
            <ActionRow
              icon="location-outline"
              onPress={() => router.push('/contact')}
              subtitle="Directions, opening hours, call or WhatsApp"
              title="Location & Contact"
            />
          </View>
        </View>

        <View>
          <SectionHeader
            actionLabel="View all"
            onAction={() => router.push('/spaces')}
            subtitle="Host under the huts or take the whole grounds"
            title="Bookable Spaces"
          />
          <AsyncView
            empty={{ title: 'No spaces yet', message: 'Spaces to book will show here soon.' }}
            state={spaces}
          >
            {(items) => (
              <ScrollView
                contentContainerStyle={styles.carousel}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.carouselBleed}
              >
                {items.map((space) => (
                  <SpaceCard key={space.id} onBook={() => bookSpace(space)} space={space} />
                ))}
              </ScrollView>
            )}
          </AsyncView>
        </View>

        <View>
          <SectionHeader
            actionLabel="Full Menu"
            onAction={() => router.push('/menu')}
            subtitle="Pre-order so it is ready when you arrive"
            title="Popular Food & Drinks"
          />
          <AsyncView
            empty={{ title: 'Menu coming soon', message: 'Our popular dishes will show here soon.' }}
            state={popular}
          >
            {(items) => (
              <View style={styles.dishes}>
                {items.map((item) => (
                  <MenuItemRow item={item} key={item.id} onAdd={() => addToPreOrder(item)} />
                ))}
              </View>
            )}
          </AsyncView>
        </View>

        <View style={styles.heritage}>
          <View style={styles.heritageHeader}>
            <View style={styles.heritageIcon}>
              <Ionicons color={colors.onGoldSoft} name="sparkles" size={20} />
            </View>
            <View style={styles.heritageText}>
              <Text style={styles.heritageTitle}>{venue.heritageTitle}</Text>
              <Text style={styles.heritageSubtitle}>{venue.heritageSubtitle}</Text>
            </View>
          </View>
          <Text style={styles.heritageBody}>{venue.aboutBody}</Text>
          <Button
            label="Read our story"
            onPress={() => router.push('/about')}
            rightIcon="arrow-forward"
            style={styles.heritageButton}
            variant="neutral"
          />
        </View>
      </ScreenContainer>
      <PreOrderBar onHeightChange={setBarHeight} />
      <Toast bottomOffset={clearance + barHeight + spacing.md} toast={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  heroPhoto: {
    height: 192,
  },
  // Lifts the icon clear of the welcome text at the bottom of the photo.
  heroIcon: {
    marginBottom: 80,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  heroTitle: {
    ...typography.headline,
    fontFamily: fontFamilies.greeting,
    color: colors.onPrimary,
  },
  heroSubtitle: {
    ...typography.caption,
    color: colors.primarySoftDim,
  },
  contactStrip: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    gap: spacing.sm + 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationText: {
    flex: 1,
  },
  locationTitle: {
    ...typography.labelMd,
    color: colors.text,
  },
  locationBody: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  contactButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
  carouselBleed: {
    marginHorizontal: -spacing.screen,
  },
  carousel: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  dishes: {
    gap: spacing.sm,
  },
  heritage: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  heritageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heritageIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heritageText: {
    flex: 1,
  },
  heritageTitle: {
    ...typography.titleSm,
    color: colors.text,
  },
  heritageSubtitle: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  heritageButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
  },
  heritageBody: {
    ...typography.caption,
    color: colors.textSubtle,
  },
});
