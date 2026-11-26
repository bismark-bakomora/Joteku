import { services } from '@/services';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from './SessionContext';

const REFRESH_MS = 60000;

type NotificationsValue = {
  unreadCount: number;
  refresh: () => void;
};

const NotificationsContext = createContext<NotificationsValue | undefined>(undefined);

// Keeps the unread count for the header bell. Screens that change bookings call
// `refresh` so the count updates straight away rather than at the next check.
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const phone = session?.phone ?? null;
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    if (!phone) {
      setUnreadCount(0);
      return;
    }
    services.notifications
      .list()
      .then((items) => setUnreadCount(items.filter((item) => !item.read).length))
      .catch(() => undefined);
  }, [phone]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const value = useMemo(() => ({ unreadCount, refresh }), [unreadCount, refresh]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsValue {
  const value = useContext(NotificationsContext);
  if (!value) {
    throw new Error('useNotifications must be used inside NotificationsProvider');
  }
  return value;
}
