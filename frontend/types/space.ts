export type SpaceId = 'hut-1' | 'hut-2' | 'hut-3' | 'hut-4' | 'whole-venue';

export type SpaceCategory = 'small' | 'medium' | 'whole';

export type Space = {
  id: SpaceId;
  category: SpaceCategory;
  name: string;
  description: string;
  capacityLabel: string;
  maxGuests: number | null;
  suitableForMeetings: boolean;
  hourlyRate: number;
  minHours: number;
};
