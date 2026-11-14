import { Menu, MenuCategory, MenuItem, MenuKind } from '@/types/menu';

export type MenuSection = {
  category: MenuCategory;
  items: MenuItem[];
};

export type MenuFilter = {
  kind: MenuKind;
  categoryId: string | null;
  query: string;
};

function searchWords(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

function matchesSearch(item: MenuItem, category: MenuCategory, words: string[]): boolean {
  const text = `${item.name} ${item.description} ${category.name}`.toLowerCase();
  return words.every((word) => text.includes(word));
}

// A search looks across food and drinks; without one, the list shows the
// chosen kind and category.
export function filterMenu(menu: Menu, filter: MenuFilter): MenuSection[] {
  const words = searchWords(filter.query);
  const searching = words.length > 0;

  return menu.categories
    .filter(
      (category) =>
        searching ||
        (category.kind === filter.kind &&
          (filter.categoryId === null || category.id === filter.categoryId)),
    )
    .map((category) => ({
      category,
      items: menu.items.filter(
        (item) =>
          item.categoryId === category.id && (!searching || matchesSearch(item, category, words)),
      ),
    }))
    .filter((section) => section.items.length > 0);
}
