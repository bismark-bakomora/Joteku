import { Ionicons } from '@expo/vector-icons';

type Facility = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
};

export const venue = {
  heroTitle: 'Oobakɛ to Joteku!',
  heroSubtitle: 'Over 40 years of good food and cherished moments in Teshie',
  heritageBadge: '40+ Years of Heritage',
  establishedLabel: 'Est. 1984',
  heritageTitle: 'The Heart of Teshie Hospitality',
  heritageSubtitle: 'Serving Teshie since 1984',
  aboutTitle: 'About Joteku',
  aboutBody:
    'For over 40 years, Joteku has welcomed families, friends and celebrations at Teshie 1st Junction on the Teshie-Nungua Road. Come for a meal, a cold drink, or a space for your next event.',
  aboutStory: [
    'For over 40 years, Joteku has been a gathering place at Teshie 1st Junction on the Teshie-Nungua Road.',
    'Families and friends come to eat and drink together. People celebrate here too: weddings, engagement receptions, birthdays and every kind of reception. Clubs and associations hold their meetings in our huts.',
    'We are open every day, and you can book an event for any day of the week.',
  ],
} as const;

export const facilities: Facility[] = [
  {
    icon: 'restaurant-outline',
    title: 'Restaurant',
    body: 'Ghanaian favourites like jollof, banku with fish and goat light soup.',
  },
  {
    icon: 'beer-outline',
    title: 'Bar',
    body: 'Cold beers, spirits, wine and soft drinks.',
  },
  {
    icon: 'home-outline',
    title: 'Four private huts',
    body: 'Two huts for up to 20 guests and two for up to 40.',
  },
  {
    icon: 'business-outline',
    title: 'The whole venue',
    body: 'The full grounds for weddings and large events of over 150 guests.',
  },
  {
    icon: 'leaf-outline',
    title: 'Garden grounds',
    body: 'Lawns and walkways lined with palms, shaded by trees and sails.',
  },
  {
    icon: 'time-outline',
    title: 'Open daily',
    body: '10am to 11pm, every day of the week.',
  },
];
