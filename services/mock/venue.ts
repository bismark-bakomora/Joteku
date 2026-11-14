import { decorations } from '@/data/decorations';
import { pricingSettings } from '@/data/pricing';
import { spaces } from '@/data/spaces';
import { delay } from '@/lib/async';
import { cachedFetch } from '@/lib/cache';
import { DecorationPackage } from '@/types/booking';
import { PricingSettings } from '@/types/pricing';
import { Space } from '@/types/space';
import { VenueService } from '../types';
import { MOCK_LATENCY_MS } from './latency';

export class MockVenueService implements VenueService {
  getSpaces(): Promise<Space[]> {
    return cachedFetch('spaces', async () => {
      await delay(MOCK_LATENCY_MS);
      return spaces;
    });
  }

  getDecorations(): Promise<DecorationPackage[]> {
    return cachedFetch('decorations', async () => {
      await delay(MOCK_LATENCY_MS);
      return decorations;
    });
  }

  getSettings(): Promise<PricingSettings> {
    return cachedFetch('pricing', async () => {
      await delay(MOCK_LATENCY_MS);
      return pricingSettings;
    });
  }
}
