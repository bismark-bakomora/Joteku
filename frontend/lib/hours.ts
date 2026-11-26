import { timeToMinutes } from './dates';

type OpeningHours = {
  opensAt: string;
  closesAt: string;
};

export function isOpenNow(now: Date, hours: OpeningHours): boolean {
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  return minutes >= timeToMinutes(hours.opensAt) && minutes < timeToMinutes(hours.closesAt);
}

