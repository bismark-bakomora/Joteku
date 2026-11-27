'use client';

import { Clock, LogOut, Percent, Plus, Sparkles, UtensilsCrossed } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCatalog } from '@/components/CatalogContext';
import { HutMap } from '@/components/HutMap';
import { Button, EmptyState, ErrorState, Pill, Skeleton } from '@/components/ui';
import { DetailBlank, ListButton, Workspace } from '@/components/Workspace';
import { cedis, percent } from '@/lib/format';
import { createClient } from '@/lib/supabase/client';
import type { RefundTier, Settings } from '@/lib/types';
import { rows, useLoad } from '@/lib/useLoad';
import { useParam } from '@/lib/useSelection';
import { DecorationEditor, HoursEditor, RefundsEditor, SpaceEditor, TablesEditor } from './editors';
import styles from './settings.module.css';

export function SettingsWorkspace() {
  const router = useRouter();
  const [selected, setSelected] = useParam('item');
  const catalog = useCatalog();

  const load = useLoad(async () => {
    const supabase = createClient();
    const [settings, tiers] = await Promise.all([
      supabase.from('settings').select('*').single(),
      supabase.from('refund_tiers').select('*').order('min_days_before', { ascending: false }),
    ]);
    return { settings: rows<Settings>(settings), tiers: rows<RefundTier[]>(tiers) };
  }, 'settings');

  const reloadAll = () => {
    load.reload();
    catalog.reload();
  };

  const signOut = async () => {
    await createClient().auth.signOut();
    router.replace('/login');
    router.refresh();
  };

  let list: React.ReactNode;
  if (load.error && !load.data) {
    list = <ErrorState message={load.error} onRetry={load.reload} />;
  } else if (!load.data) {
    list = [0, 1, 2, 3, 4].map((index) => <Skeleton height={64} key={index} />);
  } else {
    const { settings, tiers } = load.data;
    list = (
      <>
        <h2 className={styles.groupTitle}>Venue rules</h2>
        <ListButton onSelect={() => setSelected('hours')} selected={selected === 'hours'}>
          <Row icon={<Clock aria-hidden="true" size={20} />} title="Opening hours and holds">
            {settings.opens_at.slice(0, 5)} to {settings.closes_at.slice(0, 5)} · slots held {settings.hold_minutes} min
          </Row>
        </ListButton>
        <ListButton onSelect={() => setSelected('tables')} selected={selected === 'tables'}>
          <Row icon={<UtensilsCrossed aria-hidden="true" size={20} />} title="Table reservations">
            Deposit {percent(settings.table_deposit_rate)} of pre-order, or {cedis(settings.table_deposit_flat)}
          </Row>
        </ListButton>
        <ListButton onSelect={() => setSelected('refunds')} selected={selected === 'refunds'}>
          <Row icon={<Percent aria-hidden="true" size={20} />} title="Cancellations and refunds">
            {refundSummary(tiers)}
          </Row>
        </ListButton>

        <h2 className={styles.groupTitle}>Spaces and prices</h2>
        {catalog.spaces.map((space) => (
          <ListButton key={space.id} onSelect={() => setSelected(`space:${space.id}`)} selected={selected === `space:${space.id}`}>
            <span className={styles.spaceRow}>
              <span className={styles.rowText}>
                <b>{space.name}</b>
                <span className="num">
                  {cedis(space.hourly_rate)} an hour · at least {space.min_hours} hours
                </span>
              </span>
              {!space.active ? <Pill tone="neutral">Hidden</Pill> : null}
              <HutMap units={space.units.map((unit) => unit.unit)} />
            </span>
          </ListButton>
        ))}

        <h2 className={styles.groupTitle}>Decoration packages</h2>
        {catalog.decorations.map((decoration) => (
          <ListButton
            key={decoration.id}
            onSelect={() => setSelected(`decoration:${decoration.id}`)}
            selected={selected === `decoration:${decoration.id}`}
          >
            <span className={styles.spaceRow}>
              <span className={styles.rowText}>
                <b>{decoration.name}</b>
                <span className="num">{cedis(decoration.price)}</span>
              </span>
              {!decoration.active ? <Pill tone="neutral">Hidden</Pill> : null}
              <Sparkles aria-hidden="true" className={styles.rowIcon} size={20} />
            </span>
          </ListButton>
        ))}
        <Button icon={<Plus aria-hidden="true" size={18} />} onClick={() => setSelected('decoration:new')} variant="quiet">
          Add a package
        </Button>

        <div className={styles.account}>
          <Button icon={<LogOut aria-hidden="true" size={18} />} onClick={signOut} variant="outline">
            Sign out
          </Button>
        </div>
      </>
    );
  }

  let detail: React.ReactNode = (
    <DetailBlank>
      <p>Choose a price or rule to change it. Changes apply to new bookings; paid bookings keep their price.</p>
    </DetailBlank>
  );
  if (load.data && selected) {
    const { settings, tiers } = load.data;
    if (selected === 'hours') detail = <HoursEditor key="hours" onSaved={reloadAll} settings={settings} />;
    else if (selected === 'tables') detail = <TablesEditor key="tables" onSaved={reloadAll} settings={settings} />;
    else if (selected === 'refunds') detail = <RefundsEditor key="refunds" onSaved={reloadAll} settings={settings} tiers={tiers} />;
    else if (selected.startsWith('space:')) {
      const space = catalog.spaces.find((candidate) => `space:${candidate.id}` === selected);
      detail = space ? <SpaceEditor key={space.id} onSaved={reloadAll} space={space} /> : <Missing />;
    } else if (selected === 'decoration:new') {
      detail = (
        <DecorationEditor
          decoration={null}
          key="new"
          onSaved={(id) => {
            reloadAll();
            setSelected(`decoration:${id}`);
          }}
          takenIds={catalog.decorations.map((decoration) => decoration.id)}
        />
      );
    } else if (selected.startsWith('decoration:')) {
      const decoration = catalog.decorations.find((candidate) => `decoration:${candidate.id}` === selected);
      detail = decoration ? (
        <DecorationEditor
          decoration={decoration}
          key={decoration.id}
          onSaved={reloadAll}
          takenIds={catalog.decorations.map((item) => item.id)}
        />
      ) : (
        <Missing />
      );
    }
  }

  return (
    <Workspace
      backLabel="All settings"
      detail={detail}
      hasSelection={Boolean(selected)}
      list={list}
      onBack={() => setSelected(null)}
      title="Prices & settings"
    />
  );
}

// "80% at 14+ days · 50% at 7 to 13 days · none under 7 days", the way the brief says it.
function refundSummary(tiers: RefundTier[]): string {
  const sorted = [...tiers].sort((a, b) => b.min_days_before - a.min_days_before);
  return sorted
    .map((tier, index) => {
      const above = index > 0 ? sorted[index - 1].min_days_before : null;
      const rate = Number(tier.refund_rate);
      if (rate === 0) return above === null ? 'no refunds' : `none under ${above} days`;
      if (above === null) return `${percent(rate)} at ${tier.min_days_before}+ days`;
      if (tier.min_days_before === 0) return `${percent(rate)} under ${above} days`;
      return `${percent(rate)} at ${tier.min_days_before} to ${above - 1} days`;
    })
    .join(' · ');
}

function Row({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <span className={styles.spaceRow}>
      <span className={styles.rowIconTile}>{icon}</span>
      <span className={styles.rowText}>
        <b>{title}</b>
        <span className="num">{children}</span>
      </span>
    </span>
  );
}

function Missing() {
  return <EmptyState body="It may have been changed elsewhere. Choose it again from the list." title="Not found" />;
}
