'use client';

import { createContext, type ReactNode, useCallback, useContext, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DECORATION_SELECT, type Decoration, SPACE_SELECT, type Space } from '@/lib/types';
import { rows, useLoad } from '@/lib/useLoad';

type Catalog = {
  spaces: Space[];
  decorations: Decoration[];
  spaceName: (id: string | null) => string;
  unitsOf: (id: string | null) => string[];
  decorationName: (id: string | null) => string | null;
  reload: () => void;
};

const CatalogContext = createContext<Catalog | undefined>(undefined);

// Spaces and decoration packages, loaded once and shared, so every screen can
// name a space and draw its huts.
export function CatalogProvider({ children }: { children: ReactNode }) {
  const load = useLoad(async () => {
    const supabase = createClient();
    const [spaces, decorations] = await Promise.all([
      supabase.from('spaces').select(SPACE_SELECT).order('sort_order'),
      supabase.from('decoration_packages').select(DECORATION_SELECT).order('sort_order'),
    ]);
    return { spaces: rows<Space[]>(spaces), decorations: rows<Decoration[]>(decorations) };
  }, 'catalog');

  const { reload } = load;
  const spaces = useMemo(() => load.data?.spaces ?? [], [load.data]);
  const decorations = useMemo(() => load.data?.decorations ?? [], [load.data]);

  const spaceName = useCallback(
    (id: string | null) => (id ? (spaces.find((space) => space.id === id)?.name ?? id) : 'Whole venue'),
    [spaces],
  );
  // A block with no space closes the whole venue, so it takes every hut.
  const unitsOf = useCallback(
    (id: string | null) => {
      const space = spaces.find((candidate) => candidate.id === (id ?? 'whole-venue'));
      return space ? space.units.map((unit) => unit.unit) : [];
    },
    [spaces],
  );
  const decorationName = useCallback(
    (id: string | null) => (id ? (decorations.find((item) => item.id === id)?.name ?? id) : null),
    [decorations],
  );

  const value = useMemo(
    () => ({ spaces, decorations, spaceName, unitsOf, decorationName, reload }),
    [spaces, decorations, spaceName, unitsOf, decorationName, reload],
  );
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Catalog {
  const value = useContext(CatalogContext);
  if (!value) throw new Error('useCatalog must be used inside CatalogProvider');
  return value;
}
