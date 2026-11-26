import { cachedFetch } from '@/lib/cache';
import { supabase } from '@/lib/supabase';
import { DecorationPackage } from '@/types/booking';
import { PricingSettings } from '@/types/pricing';
import { Space } from '@/types/space';
import { VenueService } from '../types';
import { unwrap } from './rows';

type SpaceRow = {
  id: Space['id'];
  category: Space['category'];
  name: string;
  description: string;
  capacity_label: string;
  max_guests: number | null;
  suitable_for_meetings: boolean;
  hourly_rate: number;
  min_hours: number;
};

type SettingsRow = {
  hold_minutes: number;
  table_deposit_rate: number;
  table_deposit_flat: number;
  table_full_refund_hours: number;
  free_date_change_days: number;
  refund_working_days: number;
};

// Spaces, decoration packages and the price settings, as the admin set them.
// Each keeps its last good copy on the phone for weak networks.
export class SupabaseVenueService implements VenueService {
  getSpaces(): Promise<Space[]> {
    return cachedFetch('spaces', async () => {
      const rows = unwrap(
        await supabase
          .from('spaces')
          .select(
            'id, category, name, description, capacity_label, max_guests, suitable_for_meetings, hourly_rate, min_hours',
          )
          .order('sort_order')
          .returns<SpaceRow[]>(),
      );
      return rows.map((row) => ({
        id: row.id,
        category: row.category,
        name: row.name,
        description: row.description,
        capacityLabel: row.capacity_label,
        maxGuests: row.max_guests,
        suitableForMeetings: row.suitable_for_meetings,
        hourlyRate: Number(row.hourly_rate),
        minHours: row.min_hours,
      }));
    });
  }

  getDecorations(): Promise<DecorationPackage[]> {
    return cachedFetch('decorations', async () => {
      const rows = unwrap(
        await supabase
          .from('decoration_packages')
          .select('id, name, description, price')
          .order('sort_order')
          .returns<DecorationPackage[]>(),
      );
      return rows.map((row) => ({ ...row, price: Number(row.price) }));
    });
  }

  getSettings(): Promise<PricingSettings> {
    return cachedFetch('pricing', async () => {
      const [settings, tiers] = await Promise.all([
        supabase
          .from('settings')
          .select(
            'hold_minutes, table_deposit_rate, table_deposit_flat, table_full_refund_hours, free_date_change_days, refund_working_days',
          )
          .single<SettingsRow>(),
        supabase
          .from('refund_tiers')
          .select('min_days_before, refund_rate')
          .order('min_days_before', { ascending: false })
          .returns<{ min_days_before: number; refund_rate: number }[]>(),
      ]);
      const row = unwrap(settings);
      return {
        holdMinutes: row.hold_minutes,
        tableDepositRate: Number(row.table_deposit_rate),
        tableDepositFlat: Number(row.table_deposit_flat),
        tableFullRefundHours: row.table_full_refund_hours,
        spaceRefundTiers: unwrap(tiers).map((tier) => ({
          minDaysBefore: tier.min_days_before,
          refundRate: Number(tier.refund_rate),
        })),
        freeDateChangeDays: row.free_date_change_days,
        refundWorkingDays: row.refund_working_days,
      };
    });
  }
}
