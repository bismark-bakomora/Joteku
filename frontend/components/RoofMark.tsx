import { lightColors } from '@/theme';
import Svg, { Circle, Path } from 'react-native-svg';

type RoofMarkProps = {
  width: number;
};

// The Joteku mark: a gold thatched hut roof. The same shape is drawn into the
// launch image by scripts/generate-assets.mjs, so keep the two in step.
// The logo keeps its colours in light and dark mode.
const colors = lightColors;

export function RoofMark({ width }: RoofMarkProps) {
  return (
    <Svg height={width / 2} viewBox="0 0 160 80" width={width}>
      <Path d="M80 8 L154 64 Q80 54 6 64 Z" fill={colors.gold} />
      <Path
        d="M80 8 L58 60 M80 8 L102 60 M80 8 L36 62 M80 8 L124 62 M80 8 L80 58"
        fill="none"
        stroke={colors.onGold}
        strokeLinecap="round"
        strokeOpacity={0.4}
        strokeWidth={2}
      />
      <Path d="M6 64 Q80 54 154 64" fill="none" stroke={colors.onGold} strokeOpacity={0.5} strokeWidth={2.5} />
      <Circle cx={80} cy={7} fill={colors.gold} r={5} />
    </Svg>
  );
}
