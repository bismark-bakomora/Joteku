import { Button } from '@/components/Button';
import { PhotoGallery } from '@/components/PhotoGallery';
import { Pill } from '@/components/Pill';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionHeader } from '@/components/SectionHeader';
import { galleryPhotos, venuePhotos } from '@/components/venuePhotos';
import { facilities, venue } from '@/data/venue';
import { colors, radii, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function AboutScreen() {
  return (
    <ScreenContainer contentStyle={styles.content} scroll>
      <Image
        accessibilityLabel="The lawn at Joteku, shaded by a large tree"
        resizeMode="cover"
        source={venuePhotos.treeLawn}
        style={styles.hero}
      />

      <View style={styles.story}>
        <View style={styles.badges}>
          <Pill icon="ribbon" label={venue.heritageBadge} tone="gold" uppercase />
          <Pill label={venue.establishedLabel} tone="secondary" />
        </View>
        <Text accessibilityRole="header" style={styles.heading}>
          {venue.aboutTitle}
        </Text>
        {venue.aboutStory.map((paragraph) => (
          <Text key={paragraph} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}
      </View>

      <View>
        <SectionHeader title="What you will find" />
        <View style={styles.facilities}>
          {facilities.map((facility) => (
            <View key={facility.title} style={styles.facility}>
              <View style={styles.facilityIcon}>
                <Ionicons color={colors.primary} name={facility.icon} size={22} />
              </View>
              <View style={styles.facilityText}>
                <Text style={styles.facilityTitle}>{facility.title}</Text>
                <Text style={styles.facilityBody}>{facility.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View>
        <SectionHeader subtitle="Tap a photo to see it full size" title="Photo gallery" />
        <PhotoGallery photos={galleryPhotos} />
      </View>

      <View style={styles.actions}>
        <Button label="See the spaces" onPress={() => router.push('/spaces')} rightIcon="arrow-forward" />
        <Button label="Location & contact" onPress={() => router.push('/contact')} variant="secondary" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  hero: {
    width: '100%',
    height: 200,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceHigh,
  },
  story: {
    gap: spacing.sm + 4,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  heading: {
    ...typography.headline,
    color: colors.primary,
  },
  paragraph: {
    ...typography.body,
    color: colors.textSubtle,
  },
  facilities: {
    gap: spacing.sm,
  },
  facility: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 4,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.sm + 4,
  },
  facilityIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facilityText: {
    flex: 1,
  },
  facilityTitle: {
    ...typography.titleMd,
    color: colors.text,
  },
  facilityBody: {
    ...typography.bodyMd,
    color: colors.textSubtle,
  },
  actions: {
    gap: spacing.sm,
  },
});
