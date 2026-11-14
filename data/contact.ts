const MAPS_QUERY = 'Joteku, Teshie 1st Junction, Teshie-Nungua Road, Accra';

export const contact = {
  venueName: 'Joteku',
  phoneDisplay: '+233 24 000 0000',
  phoneE164: '+233240000000',
  whatsappUrl: 'https://wa.me/233240000000',
  addressLine1: 'Teshie 1st Junction',
  addressLine2: 'Teshie-Nungua Road, Greater Accra',
  openingHours: '10am to 11pm',
  opensAt: '10:00',
  closesAt: '23:00',
  directionsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAPS_QUERY)}`,
} as const;
