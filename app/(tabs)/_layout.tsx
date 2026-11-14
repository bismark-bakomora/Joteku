import { BrandHeader } from '@/components/BrandHeader';
import { colors, fontFamilies } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
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
