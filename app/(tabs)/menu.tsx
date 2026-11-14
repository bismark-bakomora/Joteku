import { AsyncView } from '@/components/AsyncView';
import { DrinkRow } from '@/components/DrinkRow';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { FoodCard } from '@/components/FoodCard';
import { PreOrderBar } from '@/components/PreOrderBar';
import { SearchField } from '@/components/SearchField';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Toast } from '@/components/Toast';
import { useCart } from '@/context/CartContext';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import { filterMenu } from '@/lib/menu';
import { services } from '@/services';
import { colors, radii, sizes, spacing, typography } from '@/theme';
import { MenuItem, MenuKind } from '@/types/menu';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const KIND_SEGMENTS: { key: MenuKind; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'food', label: 'Food', icon: 'restaurant-outline' },
  { key: 'drink', label: 'Drinks', icon: 'beer-outline' },
];

export default function MenuScreen() {
  const menu = useAsync(() => services.menu.getMenu());
  const cart = useCart();
  const { toast, show } = useToast();
  const [kind, setKind] = useState<MenuKind>('food');
  const [categoryId, setCategoryId] = useState('all');
  const [query, setQuery] = useState('');
  const [showSavedNotice, setShowSavedNotice] = useState(true);
  const [barHeight, setBarHeight] = useState(0);

  const quantities = useMemo(
    () => new Map(cart.lines.map((line) => [line.itemId, line.quantity])),
    [cart.lines],
  );
  const searching = query.trim().length > 0;

  const addItem = (item: MenuItem) => {
    cart.add(item);
    show(`${item.name} added to pre-order`);
  };

  const changeKind = (next: MenuKind) => {
    setKind(next);
    setCategoryId('all');
  };

  return (
    <View style={styles.root}>
      <AsyncView
        empty={{ title: 'Menu coming soon', message: 'Our food and drinks will show here soon.' }}
        isEmpty={(data) => data.items.length === 0}
        state={menu}
      >
        {(data) => {
          const sections = filterMenu(data, {
            kind,
            categoryId: categoryId === 'all' ? null : categoryId,
            query,
          });
          const chips = [
            { key: 'all', label: 'All' },
            ...data.categories
              .filter(
                (category) =>
                  category.kind === kind && data.items.some((item) => item.categoryId === category.id),
              )
              .map((category) => ({ key: category.id, label: category.name })),
          ];

          return (
            <ScrollView
              contentContainerStyle={{ paddingBottom: barHeight + spacing.xl }}
              keyboardShouldPersistTaps="handled"
              stickyHeaderIndices={[1]}
            >
              <View style={styles.noticeSlot}>
                {showSavedNotice ? (
                  <View style={styles.notice}>
                    <View style={styles.noticeIcon}>
                      <Ionicons color={colors.primary} name="cloud-done" size={18} />
                    </View>
                    <View style={styles.noticeText}>
                      <Text style={styles.noticeTitle}>Saved for offline use</Text>
                      <Text style={styles.noticeBody}>
                        The menu is saved on your phone, so you can view it on a weak network.
                      </Text>
                    </View>
                    <Pressable
                      accessibilityLabel="Dismiss"
                      accessibilityRole="button"
                      onPress={() => setShowSavedNotice(false)}
                      style={styles.noticeClose}
                    >
                      <Ionicons color={colors.outline} name="close" size={20} />
                    </Pressable>
                  </View>
                ) : null}
              </View>

              <View style={styles.controls}>
                <SegmentedControl onSelect={changeKind} segments={KIND_SEGMENTS} selected={kind} />
                <SearchField
                  accessibilityLabel="Search the menu"
                  onChangeText={setQuery}
                  placeholder="Search jollof, banku, club beer..."
                  value={query}
                />
                {searching ? (
                  <Text style={styles.results}>Results for “{query.trim()}”</Text>
                ) : (
                  <FilterChips onSelect={setCategoryId} options={chips} selected={categoryId} />
                )}
              </View>

              <View style={styles.sections}>
                {sections.length === 0 ? (
                  <EmptyState
                    actionLabel="Clear search"
                    message={`We could not find “${query.trim()}”. Try another word.`}
                    onAction={() => setQuery('')}
                    title="No matches"
                  />
                ) : (
                  sections.map((section) => (
                    <View key={section.category.id} style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <View
                          style={[
                            styles.sectionBar,
                            section.category.kind === 'food' ? styles.foodBar : styles.drinkBar,
                          ]}
                        />
                        <Text accessibilityRole="header" style={styles.sectionTitle}>
                          {section.category.name}
                        </Text>
                      </View>
                      {section.items.map((item) => {
                        const itemProps = {
                          item,
                          quantity: quantities.get(item.id) ?? 0,
                          onAdd: () => addItem(item),
                          onChangeQuantity: (quantity: number) => cart.setQuantity(item.id, quantity),
                        };
                        return item.kind === 'food' ? (
                          <FoodCard key={item.id} {...itemProps} />
                        ) : (
                          <DrinkRow key={item.id} {...itemProps} />
                        );
                      })}
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          );
        }}
      </AsyncView>
      <PreOrderBar onHeightChange={setBarHeight} />
      <Toast bottomOffset={barHeight + spacing.md} toast={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  noticeSlot: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radii.lg,
    paddingLeft: spacing.sm + 4,
    paddingVertical: spacing.xs,
  },
  noticeIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeText: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  noticeTitle: {
    ...typography.titleSm,
    color: colors.primary,
  },
  noticeBody: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  noticeClose: {
    width: sizes.tapTarget,
    height: sizes.tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  results: {
    ...typography.labelMd,
    color: colors.textSubtle,
    paddingVertical: spacing.sm,
  },
  sections: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm + 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionBar: {
    width: 10,
    height: 24,
    borderRadius: radii.full,
  },
  foodBar: {
    backgroundColor: colors.secondary,
  },
  drinkBar: {
    backgroundColor: colors.primary,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.primary,
  },
});
