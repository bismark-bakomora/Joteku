import { AnimatedSplash } from '@/components/AnimatedSplash';
import { stackScreenOptions } from '@/components/stackScreenOptions';
import { CartProvider } from '@/context/CartContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { SessionProvider } from '@/context/SessionContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { fontFamilies, useTheme } from '@/theme';
import {
  Epilogue_600SemiBold,
  Epilogue_700Bold,
} from '@expo-google-fonts/epilogue';
import { NotoSans_600SemiBold, NotoSans_700Bold } from '@expo-google-fonts/noto-sans';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect, useState } from 'react';

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
    [fontFamilies.greeting]: NotoSans_600SemiBold,
    [fontFamilies.greetingBold]: NotoSans_700Bold,
  });

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <ThemedApp>
        <SessionProvider>
          <NotificationsProvider>
            <CartProvider>
              <Screens />
            </CartProvider>
          </NotificationsProvider>
        </SessionProvider>
      </ThemedApp>
    </ThemeProvider>
  );
}

// Waits for the saved light or dark choice, so the first screen is drawn in the right mode.
function ThemedApp({ children }: { children: ReactNode }) {
  const { ready, scheme } = useTheme();
  // The animated splash takes over from the launch image once it is on screen.
  const [showSplash, setShowSplash] = useState(true);

  if (!ready) {
    return null;
  }

  return (
    <>
      <StatusBar style={showSplash || scheme === 'dark' ? 'light' : 'dark'} />
      {children}
      {showSplash ? (
        <AnimatedSplash onFinish={() => setShowSplash(false)} onReady={() => SplashScreen.hideAsync()} />
      ) : null}
    </>
  );
}

function Screens() {
  const { colors, scheme } = useTheme();
  // Navigation draws header borders and screen edges from its own theme, so it gets ours.
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      notification: colors.error,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack screenOptions={stackScreenOptions(colors)}>
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
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </NavigationThemeProvider>
  );
}
