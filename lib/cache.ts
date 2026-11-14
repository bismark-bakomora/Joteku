import { withTimeout } from './async';
import { storage } from './storage';

const SLOW_NETWORK_MS = 5000;

// Returns fresh data when the network answers in time. On a slow or failed
// request it falls back to the last copy saved on the phone, so content that
// loaded once (like the menu) stays viewable on a weak connection.
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  timeoutMs: number = SLOW_NETWORK_MS,
): Promise<T> {
  const cacheKey = `cache:${key}`;
  const fetching = fetcher().then(async (fresh) => {
    await storage.set(cacheKey, fresh).catch(() => undefined);
    return fresh;
  });
  fetching.catch(() => undefined);

  try {
    return await withTimeout(fetching, timeoutMs);
  } catch {
    const cached = await storage.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    return fetching;
  }
}
