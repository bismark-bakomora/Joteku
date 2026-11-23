import { sizes, spacing } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Space between the floating tab bar and the bottom edge of the screen.
export function useTabBarOffset(): number {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom + spacing.xs, spacing.md);
}

// How much of the bottom of a tab screen the floating tab bar covers. Tab
// screens add this to their scroll padding and to anything floating over them.
export function useTabBarClearance(): number {
  return useTabBarOffset() + sizes.tabBar;
}
