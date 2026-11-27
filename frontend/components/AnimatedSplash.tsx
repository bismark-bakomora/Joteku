import { fontFamilies, lightColors, spacing, typography } from '@/theme';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { RoofMark } from './RoofMark';

// The splash continues the green launch image, so it looks the same in light and dark mode.
const colors = lightColors;

// Must match `imageWidth` for expo-splash-screen in app.json, so the roof here
// starts exactly where the phone's launch image left it.
const MARK_WIDTH = 200;
const WORD_HEIGHT = 72;
const TAGLINE_GAP = 16;
const TAGLINE_HEIGHT = 18;
// The launch image shows the roof at the screen centre. Here it sits above the
// name and tagline, so it starts half their height lower and then rises.
const ROOF_START = (WORD_HEIGHT + TAGLINE_GAP + TAGLINE_HEIGHT) / 2;

type AnimatedSplashProps = {
  onReady: () => void;
  onFinish: () => void;
};

// Plays once at launch over the app, then fades away and calls onFinish.
export function AnimatedSplash({ onReady, onFinish }: AnimatedSplashProps) {
  const roofShift = useRef(new Animated.Value(ROOF_START)).current;
  const roofScale = useRef(new Animated.Value(1)).current;
  const word = useRef(new Animated.Value(0)).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const screen = useRef(new Animated.Value(1)).current;
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    let active = true;
    const useNativeDriver = Platform.OS !== 'web';
    const to = (value: Animated.Value, toValue: number, duration: number, easing = Easing.out(Easing.cubic)) =>
      Animated.timing(value, { toValue, duration, easing, useNativeDriver });

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduceMotion) => {
        if (!active) {
          return;
        }
        const animation = reduceMotion
          ? Animated.sequence([
              Animated.parallel([to(roofShift, 0, 0), to(word, 1, 0), to(tagline, 1, 0)]),
              Animated.delay(700),
              to(screen, 0, 250),
            ])
          : Animated.sequence([
              Animated.delay(150),
              Animated.parallel([
                Animated.spring(roofShift, { toValue: 0, friction: 6, tension: 60, useNativeDriver }),
                Animated.sequence([
                  to(roofScale, 1.08, 180),
                  Animated.spring(roofScale, { toValue: 1, friction: 4, useNativeDriver }),
                ]),
                Animated.sequence([Animated.delay(150), to(word, 1, 450)]),
                Animated.sequence([Animated.delay(450), to(tagline, 1, 400)]),
              ]),
              Animated.delay(800),
              to(screen, 0, 350, Easing.in(Easing.quad)),
            ]);
        animation.start(({ finished }) => {
          if (finished) {
            onFinishRef.current();
          }
        });
      });

    return () => {
      active = false;
    };
  }, [roofShift, roofScale, word, tagline, screen]);

  return (
    <Animated.View
      accessibilityLabel="Joteku. Eat, drink, celebrate."
      accessible
      onLayout={onReady}
      style={[
        styles.root,
        {
          opacity: screen,
          transform: [{ scale: screen.interpolate({ inputRange: [0, 1], outputRange: [1.04, 1] }) }],
        },
      ]}
    >
      <Animated.View style={{ transform: [{ translateY: roofShift }, { scale: roofScale }] }}>
        <RoofMark width={MARK_WIDTH} />
      </Animated.View>
      <Animated.Text
        style={[
          styles.word,
          {
            opacity: word,
            transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
          },
        ]}
      >
        Joteku
      </Animated.Text>
      <Animated.View style={[styles.tagline, { opacity: tagline }]}>
        <View style={styles.rule} />
        <Text style={styles.taglineText}>Eat · Drink · Celebrate</Text>
        <View style={styles.rule} />
      </Animated.View>
      <Animated.Text style={[styles.place, { opacity: tagline }]}>Teshie 1st Junction, Accra</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  word: {
    height: WORD_HEIGHT,
    fontFamily: fontFamilies.headlineBold,
    fontSize: 64,
    lineHeight: WORD_HEIGHT,
    letterSpacing: -2,
    color: colors.background,
  },
  tagline: {
    height: TAGLINE_HEIGHT,
    marginTop: TAGLINE_GAP,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  rule: {
    width: 28,
    height: 2,
    backgroundColor: colors.gold,
  },
  taglineText: {
    ...typography.labelSm,
    fontSize: 13,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: colors.goldSoft,
  },
  place: {
    position: 'absolute',
    bottom: spacing.xxl + spacing.sm,
    ...typography.caption,
    fontFamily: fontFamilies.bodySemiBold,
    color: colors.primarySoftDim,
  },
});
