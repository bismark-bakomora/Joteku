import { cachedFetch } from '@/lib/cache';
import { supabase } from '@/lib/supabase';
import { Menu, MenuCategory, MenuItem, MenuKind } from '@/types/menu';
import { MenuService } from '../types';
import { unwrap } from './rows';

type ItemRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  tag: string | null;
  popular: boolean;
  available: boolean;
  category: { kind: MenuKind } | null;
};

// The menu as the admin keeps it. Items the admin made unavailable are never
// returned. The last good copy stays on the phone so the menu opens offline.
export class SupabaseMenuService implements MenuService {
  getMenu(): Promise<Menu> {
    return cachedFetch('menu', async () => {
      const [categories, items] = await Promise.all([
        supabase.from('menu_categories').select('id, name, kind').order('sort_order').returns<MenuCategory[]>(),
        supabase
          .from('menu_items')
          .select(
            'id, name, description, price, category_id, tag, popular, available, category:menu_categories(kind)',
          )
          .order('sort_order')
          .returns<ItemRow[]>(),
      ]);
      return {
        categories: unwrap(categories),
        items: unwrap(items).map(
          (row): MenuItem => ({
            id: row.id,
            name: row.name,
            description: row.description,
            price: Number(row.price),
            categoryId: row.category_id,
            kind: row.category?.kind ?? 'food',
            tag: row.tag ?? undefined,
            popular: row.popular,
            available: row.available,
          }),
        ),
      };
    });
  }

  async getPopularItems(): Promise<MenuItem[]> {
    const { items } = await this.getMenu();
    return items.filter((item) => item.popular);
  }
}
