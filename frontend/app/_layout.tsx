import { AnimatedSplash } from '@/components/AnimatedSplash';
import { stackScreenOptions } from '@/components/stackScreenOptions';
import { CartProvider } from '@/context/CartContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { SessionProvider } from '@/context/SessionContext';
import { fontFamilies } from '@/theme';
import {
  Epilogue_600SemiBold,
  Epilogue_700Bold,
} from '@expo-google-fonts/epilogue';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    [fontFamilies.headline]: Epilogue_600SemiBold,
    [fontFamilies.headlineBold]: Epilogue_700Bold,
    [fontFamilies.body]: PlusJakartaSans_400Regular,
    [fontFamilies.bodySemiBold]: PlusJakartaSans_600SemiBold,
    [fontFamilies.bodyBold]: PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  // The animated splash takes over from the launch image once it is on screen.
  const [showSplash, setShowSplash] = useState(true);

  if (!loaded) {
    return null;
  }

  return (
    <SessionProvider>
      <NotificationsProvider>
        <CartProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={stackScreenOptions}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="reserve-table" options={{ title: 'Reserve a Table' }} />
            <Stack.Screen name="spaces" options={{ title: 'Venue & Spaces' }} />
            <Stack.Screen name="about" options={{ title: 'About Joteku' }} />
            <Stack.Screen name="how-to-book" options={{ title: 'How to Book' }} />
            <Stack.Screen name="contact" options={{ title: 'Location & Contact' }} />
            <Stack.Screen name="terms" options={{ title: 'Terms & Policies' }} />
            <Stack.Screen name="cart" options={{ title: 'Your Pre-order' }} />
            <Stack.Screen
              name="welcome"
              options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
            />
            <Stack.Screen name="sign-in" options={{ title: 'Log in' }} />
            <Stack.Screen name="book-space" options={{ headerShown: false }} />
            <Stack.Screen name="pay/[bookingId]" options={{ title: 'Payment' }} />
            <Stack.Screen name="receipt/[bookingId]" options={{ title: 'Receipt' }} />
            <Stack.Screen name="booking/[bookingId]" options={{ title: 'Booking' }} />
            <Stack.Screen name="change-date/[bookingId]" options={{ title: 'Change Date' }} />
            <Stack.Screen name="pay-balance/[bookingId]" options={{ title: 'Pay Balance' }} />
            <Stack.Screen name="transactions" options={{ title: 'Transactions' }} />
            <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
          </Stack>
          {showSplash ? (
            <AnimatedSplash
              onFinish={() => setShowSplash(false)}
              onReady={() => SplashScreen.hideAsync()}
            />
          ) : null}
        </CartProvider>
      </NotificationsProvider>
    </SessionProvider>
  );
}
