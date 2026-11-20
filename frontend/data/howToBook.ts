import { contact } from './contact';

export type GuideStep = {
  title: string;
  body: string;
};

export const bookingSteps: GuideStep[] = [
  {
    title: 'Choose your event and space',
    body: 'Pick the type of event, then a hut or the whole venue.',
  },
  {
    title: 'Pick a date and time',
    body: `Choose the date, start and end time, and number of guests. Times already taken are greyed out. Bookings run from ${contact.openingHours}, every day.`,
  },
  {
    title: 'Add extras',
    body: 'Choose a decoration package if you want one, and tell us about any catering you need.',
  },
  {
    title: 'Check the price',
    body: 'Your price estimate updates as you go. Read and accept the cancellation policy.',
  },
  {
    title: 'Pay by mobile money',
    body: 'Enter your number, choose your network and approve the prompt on your phone.',
  },
  {
    title: 'Get your receipt',
    body: 'Your booking is confirmed straight away with a reference number and receipt. It appears in My Bookings.',
  },
];

export const tableSteps: GuideStep[] = [
  {
    title: 'Reserve a table',
    body: 'Choose the date, time and number of people, and add food or drinks if you like.',
  },
  {
    title: 'Pay the deposit',
    body: 'Pay a small deposit by mobile money. Your table is confirmed once it is paid.',
  },
];
