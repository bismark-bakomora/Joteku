import { useReduceMotion } from '@/hooks/useReduceMotion';
import { radii } from '@/theme';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

type SlidingPillProps = {
  count: number;
  index: number;
  color: string;
};

// The rounded highlight behind the selected option of a row of equal-width
// options. Put it first inside the row; it fills the row and slides to `index`.
export function SlidingPill({ count, index, color }: SlidingPillProps) {
  const reduceMotion = useReduceMotion();
  const [rowWidth, setRowWidth] = useState(0);
  const position = useRef(new Animated.Value(index)).current;
  const width = rowWidth / count;

  useEffect(() => {
    if (reduceMotion) {
      position.setValue(index);
      return;
    }
    const slide = Animated.timing(position, {
      toValue: index,
      duration: 240,
      easing: Easing.out(Easing.exp),
      useNativeDriver: Platform.OS !== 'web',
    });
    slide.start();
    return () => slide.stop();
  }, [index, position, reduceMotion]);

  return (
    <View
      onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}
      style={styles.fill}
    >
      <Animated.View
        style={[
          styles.pill,
          { width, backgroundColor: color, transform: [{ translateX: Animated.multiply(position, width) }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    pointerEvents: 'none',
  },
  pill: {
    height: '100%',
    borderRadius: radii.full,
  },
});
