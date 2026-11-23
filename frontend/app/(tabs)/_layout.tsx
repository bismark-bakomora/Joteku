import { BrandHeader } from '@/components/BrandHeader';
import { useSession } from '@/context/SessionContext';
import { hasSeenWelcome } from '@/lib/welcome';
import { colors, fontFamilies, sizes, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  // Phones without a home indicator keep the original 10px breathing room.
  const bottomPadding = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: {
          fontFamily: fontFamilies.bodySemiBold,
          fontSize: 12,
        },
        // Grows by the home-indicator inset so labels never sit on it.
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          height: sizes.tabBar + bottomPadding,
          paddingTop: spacing.sm,
          paddingBottom: bottomPadding,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: true,
          header: () => <BrandHeader />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons color={color as string} name={focused ? 'home' : 'home-outline'} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          headerShown: true,
          header: () => <BrandHeader />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              color={color as string}
              name={focused ? 'restaurant' : 'restaurant-outline'}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          headerShown: true,
          header: () => <BrandHeader />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              color={color as string}
              name={focused ? 'ticket' : 'ticket-outline'}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: true,
          header: () => <BrandHeader />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              color={color as string}
              name={focused ? 'person' : 'person-outline'}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
