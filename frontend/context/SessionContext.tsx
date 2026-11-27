import { services } from '@/services';
import { ProfileChanges } from '@/services/types';
import { Session } from '@/types/auth';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type SessionValue = {
  session: Session | null;
  ready: boolean;
  setSession: (session: Session) => void;
  updateProfile: (changes: ProfileChanges) => Promise<Session>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    services.auth
      .getSession()
      .catch(() => null)
      .then((saved) => {
        if (active) {
          setSessionState(saved);
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const setSession = useCallback((next: Session) => setSessionState(next), []);

  const updateProfile = useCallback(async (changes: ProfileChanges) => {
    const updated = await services.auth.updateProfile(changes);
    setSessionState(updated);
    return updated;
  }, []);

  const signOut = useCallback(async () => {
    await services.auth.signOut();
    setSessionState(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    await services.auth.deleteAccount();
    setSessionState(null);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({ session, ready, setSession, updateProfile, signOut, deleteAccount }),
    [session, ready, setSession, updateProfile, signOut, deleteAccount],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return value;
}
