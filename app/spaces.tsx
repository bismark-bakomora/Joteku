import { AsyncView } from '@/components/AsyncView';
import { FilterChips } from '@/components/FilterChips';
import { InfoBanner } from '@/components/InfoBanner';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SpaceListCard } from '@/components/SpaceListCard';
import { contact } from '@/data/contact';
import { useAsync } from '@/hooks/useAsync';
import { networkNames, refundTierLines } from '@/lib/policies';
import { services } from '@/services';
import { spacing } from '@/theme';
import { SpaceCategory } from '@/types/space';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

type Filter = 'all' | SpaceCategory;

const CATEGORY_LABELS: Record<SpaceCategory, string> = {
  small: 'Meetings & small groups',
  medium: 'Receptions & parties',
  whole: 'Weddings & large events',
};

const CATEGORY_ORDER: SpaceCategory[] = ['small', 'medium', 'whole'];

export default function SpacesScreen() {
  const spaces = useAsync(() => services.venue.getSpaces());
  const settings = useAsync(() => services.venue.getSettings());
  const [filter, setFilter] = useState<Filter>('all');

  return (
    <ScreenContainer contentStyle={styles.content} scroll>
      <AsyncView
        empty={{ title: 'No spaces yet', message: 'Spaces to book will show here soon.' }}
        state={spaces}
      >
        {(items) => {
          const options: { key: Filter; label: string }[] = [
            { key: 'all', label: `All spaces (${items.length})` },
            ...CATEGORY_ORDER.filter((category) => items.some((space) => space.category === category)).map(
              (category) => ({ key: category, label: CATEGORY_LABELS[category] }),
            ),
          ];
          const shown = filter === 'all' ? items : items.filter((space) => space.category === filter);

          return (
            <View style={styles.list}>
              <FilterChips onSelect={setFilter} options={options} selected={filter} />
              <InfoBanner
                actionLabel="How booking works"
                body={`Pay in full upfront by mobile money (${networkNames()}) to lock in your date.`}
                icon="time-outline"
                onAction={() => router.push('/how-to-book')}
                title={`Open daily, ${contact.openingHours}`}
              />
              {shown.map((space) => (
                <SpaceListCard
                  key={space.id}
                  onBook={() => router.push({ pathname: '/book-space', params: { spaceId: space.id } })}
                  space={space}
                />
              ))}
            </View>
          );
        }}
      </AsyncView>

      <AsyncView
        empty={{ title: 'Policy unavailable', message: 'Please check back soon.' }}
        isEmpty={() => false}
        state={settings}
      >
        {(value) => (
          <InfoBanner
            actionLabel="Read the full terms"
            body={refundTierLines(value).join('\n')}
            icon="shield-checkmark-outline"
            onAction={() => router.push('/terms')}
            title="Cancellation policy"
          />
        )}
      </AsyncView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
});
