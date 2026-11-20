export type MenuKind = 'food' | 'drink';

export type MenuCategory = {
  id: string;
  name: string;
  kind: MenuKind;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  kind: MenuKind;
  tag?: string;
  popular: boolean;
  available: boolean;
};

export type Menu = {
  categories: MenuCategory[];
  items: MenuItem[];
};

export type PreOrderLine = {
  itemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
};
