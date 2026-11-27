'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

// Keeps the chosen item and filters in the address, so Back, refresh and shared
// links all land on the same screen.
export function useParam(name: string): [string | null, (value: string | null) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const value = params.get(name);

  const set = useCallback(
    (next: string | null) => {
      const updated = new URLSearchParams(params.toString());
      if (next === null) updated.delete(name);
      else updated.set(name, next);
      const query = updated.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [name, params, pathname, router],
  );

  return [value, set];
}
