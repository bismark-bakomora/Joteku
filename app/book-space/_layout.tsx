import { stackScreenOptions } from '@/components/stackScreenOptions';
import { BookingDraftProvider } from '@/context/BookingDraftContext';
import { Stack } from 'expo-router';

export default function BookSpaceLayout() {
  return (
    <BookingDraftProvider>
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Screen name="details" options={{ title: 'Book a Space' }} />
        <Stack.Screen name="extras" options={{ title: 'Extras' }} />
        <Stack.Screen name="summary" options={{ title: 'Summary' }} />
      </Stack>
    </BookingDraftProvider>
  );
}
