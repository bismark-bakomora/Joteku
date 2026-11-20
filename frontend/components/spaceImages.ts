import { SpaceId } from '@/types/space';
import { ImageSourcePropType, ImageStyle } from 'react-native';

// Fills a photo frame. The explicit width and height matter on web, where an image
// without them takes its full source size (1280x960) and spills out of the frame.
export const fillImageStyle: ImageStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
};

export const spaceImages: Record<SpaceId, ImageSourcePropType> = {
  'hut-1': require('../assets/hut1.jpg'),
  'hut-2': require('../assets/hut2.jpg'),
  'hut-3': require('../assets/hut3.jpg'),
  'hut-4': require('../assets/hut4.jpg'),
  'whole-venue': require('../assets/joteku3.jpg'),
};
