import { storage } from './storage';

const WELCOME_SEEN_KEY = 'welcome-seen';

export async function hasSeenWelcome(): Promise<boolean> {
  return (await storage.get<boolean>(WELCOME_SEEN_KEY)) === true;
}

export function markWelcomeSeen(): Promise<void> {
  return storage.set(WELCOME_SEEN_KEY, true).catch(() => undefined);
}
