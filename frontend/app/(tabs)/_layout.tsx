import { BrandHeader } from '@/components/BrandHeader';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { useSession } from '@/context/SessionContext';
import { hasSeenWelcome } from '@/lib/welcome';
import { useTheme } from '@/theme';
import { router, Tabs } from 'expo-router';
import { useEffect, useRef } from 'react';

// Shows the welcome screen once, on first launch, to people who are not signed in.
function useWelcomeOnFirstLaunch() {
  const { session, ready } = useSession();
  const checked = useRef(false);

  useEffect(() => {
    if (!ready || checked.current) {
      return;
    }
    checked.current = true;
    if (session) {
      return;
    }
    hasSeenWelcome().then((seen) => {
      if (!seen) {
        router.push('/welcome');
      }
    });
  }, [ready, session]);
}

export default function TabLayout() {
  useWelcomeOnFirstLaunch();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{ header: () => <BrandHeader />, sceneStyle: { backgroundColor: colors.background } }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="menu" options={{ title: 'Menu' }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
