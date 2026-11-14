import { EventType } from '@/types/booking';

export const eventTypes: { id: EventType; label: string }[] = [
  { id: 'wedding', label: 'Wedding' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'birthday', label: 'Birthday' },
  { id: 'other_reception', label: 'Other reception' },
  { id: 'meeting', label: 'Meeting' },
];
