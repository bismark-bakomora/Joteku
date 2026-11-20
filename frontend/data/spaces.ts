import { Space, SpaceId } from '@/types/space';

export const spaces: Space[] = [
  {
    id: 'hut-1',
    category: 'small',
    name: 'Hut 1',
    description: 'A private hut for meetings, club gatherings and small celebrations.',
    capacityLabel: 'Up to 20 guests',
    maxGuests: 20,
    suitableForMeetings: true,
    hourlyRate: 150,
    minHours: 2,
  },
  {
    id: 'hut-2',
    category: 'small',
    name: 'Hut 2',
    description: 'A private hut that suits meetings, family lunches and birthdays.',
    capacityLabel: 'Up to 20 guests',
    maxGuests: 20,
    suitableForMeetings: true,
    hourlyRate: 150,
    minHours: 2,
  },
  {
    id: 'hut-3',
    category: 'medium',
    name: 'Hut 3',
    description: 'A spacious hut for birthdays, anniversaries and reunions.',
    capacityLabel: 'Up to 40 guests',
    maxGuests: 40,
    suitableForMeetings: false,
    hourlyRate: 250,
    minHours: 3,
  },
  {
    id: 'hut-4',
    category: 'medium',
    name: 'Hut 4',
    description: 'A spacious hut with room for a bigger group of family and friends.',
    capacityLabel: 'Up to 40 guests',
    maxGuests: 40,
    suitableForMeetings: false,
    hourlyRate: 250,
    minHours: 3,
  },
  {
    id: 'whole-venue',
    category: 'whole',
    name: 'Whole Venue',
    description: 'The whole venue for weddings, engagement receptions and large events.',
    capacityLabel: '150+ guests',
    maxGuests: null,
    suitableForMeetings: false,
    hourlyRate: 1500,
    minHours: 5,
  },
];

export function getSpace(id: SpaceId): Space {
  const space = spaces.find((candidate) => candidate.id === id);
  if (!space) {
    throw new Error(`Unknown space: ${id}`);
  }
  return space;
}
