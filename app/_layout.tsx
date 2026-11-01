import { colors, fontFamilies } from '@/theme';
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
import { useEffect } from 'react';

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

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerTitleStyle: {
            fontFamily: fontFamilies.headline,
            color: colors.text,
          },
          headerStyle: { backgroundColor: colors.background },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="book-space" options={{ title: 'Book a Space' }} />
        <Stack.Screen name="reserve-table" options={{ title: 'Reserve a Table' }} />
      </Stack>
    </>
  );
}
