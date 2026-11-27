import { stackScreenOptions } from '@/components/stackScreenOptions';
import { BookingDraftProvider } from '@/context/BookingDraftContext';
import { useTheme } from '@/theme';
import { Stack } from 'expo-router';

export default function BookSpaceLayout() {
  const { colors } = useTheme();

  return (
    <BookingDraftProvider>
      <Stack screenOptions={stackScreenOptions(colors)}>
        <Stack.Screen name="details" options={{ title: 'Book a Space' }} />
        <Stack.Screen name="extras" options={{ title: 'Extras' }} />
        <Stack.Screen name="summary" options={{ title: 'Summary' }} />
      </Stack>
    </BookingDraftProvider>
  );
}
