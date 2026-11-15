import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncState<T> = {
  data: T | null;
  error: Error | null;
  loading: boolean;
  reload: () => void;
};

type Snapshot<T> = Omit<AsyncState<T>, 'reload'>;

// Loads on mount, and again whenever a value in `deps` changes.
export function useAsync<T>(load: () => Promise<T>, deps: readonly unknown[] = []): AsyncState<T> {
  const loadRef = useRef(load);
  loadRef.current = load;
  const requestId = useRef(0);
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({
    data: null,
    error: null,
    loading: true,
  });

  const run = useCallback(() => {
    requestId.current += 1;
    const id = requestId.current;
    setSnapshot((previous) => ({ ...previous, error: null, loading: true }));
    loadRef.current().then(
      (data) => {
        if (id === requestId.current) {
          setSnapshot({ data, error: null, loading: false });
        }
      },
      (error: unknown) => {
        if (id === requestId.current) {
          setSnapshot((previous) => ({
            data: previous.data,
            error: error instanceof Error ? error : new Error('Something went wrong'),
            loading: false,
          }));
        }
      },
    );
  }, []);

  useEffect(() => {
    run();
    return () => {
      requestId.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, ...deps]);

  return { ...snapshot, reload: run };
}
