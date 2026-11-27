'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from './errors';

export type Load<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
};

// Runs a query when its key changes and keeps the last good result while it reloads.
export function useLoad<T>(fetcher: () => Promise<T>, key: string): Load<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let active = true;
    // Loading state is set by the effect that starts the load; it is the point of the hook.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    fetcherRef
      .current()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((caught) => {
        if (active) setError(errorMessage(caught, 'We could not load this. Check the connection and try again.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [key, tick]);

  const reload = useCallback(() => setTick((value) => value + 1), []);
  return { data, error, loading, reload };
}

// Returns the rows, or throws the Supabase error so useLoad can show it.
export function rows<T>(result: { data: unknown; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data as T;
}
