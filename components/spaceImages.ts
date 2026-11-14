import { SpaceId } from '@/types/space';
import { ImageSourcePropType } from 'react-native';

export const spaceImages: Record<SpaceId, ImageSourcePropType> = {
  'hut-1': require('../assets/hut1.jpg'),
  'hut-2': require('../assets/hut2.jpg'),
  'hut-3': require('../assets/hut3.jpg'),
  'hut-4': require('../assets/hut4.jpg'),
  'whole-venue': require('../assets/joteku3.jpg'),
};
