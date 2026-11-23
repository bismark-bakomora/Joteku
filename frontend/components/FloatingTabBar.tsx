import { useTabBarClearance, useTabBarOffset } from '@/hooks/useTabBarClearance';
import { colors, fontFamilies, radii, shadows, sizes, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { SlidingPill } from './SlidingPill';

type TabIcon = {
  outline: keyof typeof Ionicons.glyphMap;
  filled: keyof typeof Ionicons.glyphMap;
};

const TAB_ICONS: Record<string, TabIcon> = {
  index: { outline: 'home-outline', filled: 'home' },
  menu: { outline: 'restaurant-outline', filled: 'restaurant' },
  bookings: { outline: 'ticket-outline', filled: 'ticket' },
  profile: { outline: 'person-outline', filled: 'person' },
};

// A rounded bar that floats over the tab screens. Screens scroll behind it and
// use useTabBarClearance to keep their last content above it.
export function FloatingTabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const offset = useTabBarOffset();
  const clearance = useTabBarClearance();
  const keyboardOpen = useKeyboardOpen();

  if (keyboardOpen) {
    return null;
  }

  return (
    <View style={[styles.wrap, { height: clearance }]}>
      <View style={styles.fade}>
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="tabBarFade" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor={colors.background} stopOpacity={0} />
              <Stop offset="1" stopColor={colors.background} stopOpacity={0.95} />
            </LinearGradient>
          </Defs>
          <Rect fill="url(#tabBarFade)" height="100%" width="100%" />
        </Svg>
      </View>
      <View style={[styles.bar, { marginBottom: offset }]}>
        <View accessibilityRole="tablist" style={styles.row}>
          <SlidingPill color={colors.tabBarActive} count={state.routes.length} index={state.index} />
          {state.routes.map((route, index) => {
            const focused = index === state.index;
            const label = descriptors[route.key].options.title ?? route.name;
            const icon = TAB_ICONS[route.name];
            const color = focused ? colors.primary : colors.textSubtle;

            const press = () => {
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                navigateToTab(route.key);
              }
            };

            return (
              <Pressable
                accessibilityLabel={label}
                accessibilityLargeContentTitle={label}
                accessibilityRole="tab"
                accessibilityShowsLargeContentViewer
                accessibilityState={{ selected: focused }}
                key={route.key}
                onPress={press}
                style={styles.tab}
              >
                <Ionicons color={color} name={focused ? icon.filled : icon.outline} size={24} />
                <Text
                  maxFontSizeMultiplier={1.2}
                  numberOfLines={1}
                  style={[styles.label, { color }, focused ? styles.labelActive : undefined]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// Android lifts the bar above the keyboard, where it would cover the search
// results, so it steps aside while someone is typing.
function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', () => setOpen(true));
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return open;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    pointerEvents: 'box-none',
  },
  fade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    pointerEvents: 'none',
  },
  bar: {
    width: '100%',
    maxWidth: sizes.tabBarMaxWidth,
    height: sizes.tabBar,
    backgroundColor: colors.tabBar,
    borderRadius: radii.full,
    padding: spacing.xs,
    ...shadows.floating,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
  },
  label: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  labelActive: {
    fontFamily: fontFamilies.bodyBold,
  },
});
