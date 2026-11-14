import { menu } from '@/data/menu';
import { delay } from '@/lib/async';
import { cachedFetch } from '@/lib/cache';
import { Menu, MenuItem } from '@/types/menu';
import { MenuService } from '../types';
import { MOCK_LATENCY_MS } from './latency';

export class MockMenuService implements MenuService {
  getMenu(): Promise<Menu> {
    return cachedFetch('menu', async () => {
      await delay(MOCK_LATENCY_MS);
      return {
        categories: menu.categories,
        items: menu.items.filter((item) => item.available),
      };
    });
  }

  async getPopularItems(): Promise<MenuItem[]> {
    const { items } = await this.getMenu();
    return items.filter((item) => item.popular);
  }
}
