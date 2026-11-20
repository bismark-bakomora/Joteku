import { DecorationId, DecorationPackage } from '@/types/booking';

export const decorations: DecorationPackage[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Simple table settings and entrance decor.',
    price: 1000,
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Themed table settings, stage backdrop and lighting.',
    price: 2500,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Full themed decor with stage, floral pieces and ambient lighting.',
    price: 5000,
  },
];

export function getDecoration(id: DecorationId): DecorationPackage {
  const decoration = decorations.find((candidate) => candidate.id === id);
  if (!decoration) {
    throw new Error(`Unknown decoration package: ${id}`);
  }
  return decoration;
}
