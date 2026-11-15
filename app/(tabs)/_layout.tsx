import { BrandHeader } from '@/components/BrandHeader';
import { useSession } from '@/context/SessionContext';
import { hasSeenWelcome } from '@/lib/welcome';
import { colors, fontFamilies } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
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
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
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
