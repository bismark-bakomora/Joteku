import { preOrderTotal } from '@/lib/pricing';
import { storage } from '@/lib/storage';
import { MenuItem, PreOrderLine } from '@/types/menu';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CART_KEY = 'cart';

type CartValue = {
  lines: PreOrderLine[];
  itemCount: number;
  total: number;
  add: (item: MenuItem) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | undefined>(undefined);

function mergeLines(saved: PreOrderLine[], added: PreOrderLine[]): PreOrderLine[] {
  const merged = saved.map((line) => ({ ...line }));
  for (const line of added) {
    const existing = merged.find((candidate) => candidate.itemId === line.itemId);
    if (existing) {
      existing.quantity += line.quantity;
    } else {
      merged.push({ ...line });
    }
  }
  return merged;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<PreOrderLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    storage.get<PreOrderLine[]>(CART_KEY).then((saved) => {
      if (active) {
        setLines((current) => mergeLines(saved ?? [], current));
        setLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loaded) {
      storage.set(CART_KEY, lines).catch(() => undefined);
    }
  }, [lines, loaded]);

  const add = useCallback((item: MenuItem) => {
    setLines((current) =>
      mergeLines(current, [
        { itemId: item.id, name: item.name, unitPrice: item.price, quantity: 1 },
      ]),
    );
  }, []);

  const setQuantity = useCallback((itemId: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((line) => line.itemId !== itemId)
        : current.map((line) => (line.itemId === itemId ? { ...line, quantity } : line)),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartValue>(
    () => ({
      lines,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      total: preOrderTotal(lines),
      add,
      setQuantity,
      clear,
    }),
    [lines, add, setQuantity, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return value;
}
