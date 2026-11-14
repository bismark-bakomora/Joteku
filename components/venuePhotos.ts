import { ImageSourcePropType } from 'react-native';
import { spaceImages } from './spaceImages';

export type GalleryPhoto = {
  key: string;
  source: ImageSourcePropType;
  caption: string;
};

export const venuePhotos = {
  frontage: require('../assets/entrance.jpg'),
  gate: require('../assets/entrance1.jpg'),
  courtyard: require('../assets/jotetu1.jpg'),
  shadedWalkway: require('../assets/joteku2.jpg'),
  walkway: require('../assets/joteku3.jpg'),
  pavedCourtyard: require('../assets/joteku4.jpg'),
  lawn: require('../assets/joteku5.jpg'),
  treeLawn: require('../assets/joteku6.jpg'),
} satisfies Record<string, ImageSourcePropType>;

export const galleryPhotos: GalleryPhoto[] = [
  { key: 'frontage', source: venuePhotos.frontage, caption: 'The front of Joteku at Teshie 1st Junction' },
  { key: 'gate', source: venuePhotos.gate, caption: 'The wooden entrance gate, lined with palms' },
  { key: 'walkway', source: venuePhotos.walkway, caption: 'The lawn walkway between the huts' },
  { key: 'shaded-walkway', source: venuePhotos.shadedWalkway, caption: 'Huts on both sides of the walkway, under a shade sail' },
  { key: 'tree-lawn', source: venuePhotos.treeLawn, caption: 'The lawn shaded by a large tree' },
  { key: 'courtyard', source: venuePhotos.courtyard, caption: 'The open courtyard beside a bamboo hut' },
  { key: 'paved-courtyard', source: venuePhotos.pavedCourtyard, caption: 'The paved courtyard and a wooden hut' },
  { key: 'lawn', source: venuePhotos.lawn, caption: 'Huts and potted palms along the lawn' },
  { key: 'hut-1', source: spaceImages['hut-1'], caption: 'Hut 1' },
  { key: 'hut-2', source: spaceImages['hut-2'], caption: 'Hut 2' },
  { key: 'hut-3', source: spaceImages['hut-3'], caption: 'Hut 3' },
  { key: 'hut-4', source: spaceImages['hut-4'], caption: 'Hut 4' },
];
