'use client';

import { Plus, Save, Trash2 } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { HutMap } from '@/components/HutMap';
import { Button, Card, Check, Field, Notice, TextArea } from '@/components/ui';
import { errorMessage } from '@/lib/errors';
import { uniqueSlug } from '@/lib/slug';
import { createClient } from '@/lib/supabase/client';
import type { Decoration, RefundTier, Settings, Space } from '@/lib/types';
import styles from './settings.module.css';

type Message = { tone: 'error' | 'success'; text: string } | null;

// One editor's frame: title, explanation, fields, a message and Save.
function Editor({
  title,
  intro,
  children,
  message,
  busy,
  onSubmit,
  saveLabel = 'Save changes',
}: {
  title: string;
  intro: string;
  children: ReactNode;
  message: Message;
  busy: boolean;
  onSubmit: () => void;
  saveLabel?: string;
}) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };
  return (
    <form className={styles.editor} noValidate onSubmit={submit}>
      <header className={styles.editorHead}>
        <h2>{title}</h2>
        <p>{intro}</p>
      </header>
      <Card className={styles.editorCard}>{children}</Card>
      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
      <div className={styles.saveRow}>
        <Button icon={<Save aria-hidden="true" size={18} />} loading={busy} type="submit">
          {saveLabel}
        </Button>
      </div>
    </form>
  );
}

// Runs a save and turns the result into a message.
function useSave(onSaved: () => void) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const run = async (validate: () => string | null, save: () => PromiseLike<{ error: unknown }>, success = 'Saved.') => {
    setMessage(null);
    const problem = validate();
    if (problem) {
      setMessage({ tone: 'error', text: problem });
      return false;
    }
    setBusy(true);
    const { error } = await save();
    setBusy(false);
    if (error) {
      setMessage({ tone: 'error', text: errorMessage(error, 'That was not saved. Check the numbers and try again.') });
      return false;
    }
    setMessage({ tone: 'success', text: success });
    onSaved();
    return true;
  };
  return { busy, message, run };
}

const whole = (value: string) => /^\d+$/.test(value.trim());
const money = (value: string) => Number.isFinite(Number(value)) && Number(value) >= 0 && value.trim() !== '';

export function HoursEditor({ settings, onSaved }: { settings: Settings; onSaved: () => void }) {
  const [opens, setOpens] = useState(settings.opens_at.slice(0, 5));
  const [closes, setCloses] = useState(settings.closes_at.slice(0, 5));
  const [hold, setHold] = useState(String(settings.hold_minutes));
  const { busy, message, run } = useSave(onSaved);

  return (
    <Editor
      busy={busy}
      intro="When customers can book, and how long a slot is kept for someone while they pay."
      message={message}
      onSubmit={() =>
        run(
          () => {
            if (closes <= opens) return 'Closing time must be after opening time.';
            if (!whole(hold) || Number(hold) < 1 || Number(hold) > 60) return 'Hold a slot for between 1 and 60 minutes.';
            return null;
          },
          () =>
            createClient()
              .from('settings')
              .update({ opens_at: opens, closes_at: closes, hold_minutes: Number(hold) })
              .eq('id', true),
        )
      }
      title="Opening hours and holds"
    >
      <div className={styles.twoCols}>
        <Field label="Opens" onChange={(event) => setOpens(event.target.value)} step={1800} type="time" value={opens} />
        <Field label="Closes" onChange={(event) => setCloses(event.target.value)} step={1800} type="time" value={closes} />
      </div>
      <Field
        hint="If payment is not finished in this time, the slot is freed for others."
        inputMode="numeric"
        label="Hold a slot while paying (minutes)"
        onChange={(event) => setHold(event.target.value)}
        type="number"
        value={hold}
      />
    </Editor>
  );
}

export function TablesEditor({ settings, onSaved }: { settings: Settings; onSaved: () => void }) {
  const [rate, setRate] = useState(String(Math.round(settings.table_deposit_rate * 100)));
  const [flat, setFlat] = useState(String(settings.table_deposit_flat));
  const [refundHours, setRefundHours] = useState(String(settings.table_full_refund_hours));
  const [visit, setVisit] = useState(String(settings.table_visit_minutes));
  const [lastBefore, setLastBefore] = useState(String(settings.last_table_before_close_minutes));
  const { busy, message, run } = useSave(onSaved);

  return (
    <Editor
      busy={busy}
      intro="The deposit customers pay to reserve a table. The rest is paid at the venue."
      message={message}
      onSubmit={() =>
        run(
          () => {
            if (!whole(rate) || Number(rate) < 1 || Number(rate) > 100) return 'The deposit must be between 1% and 100% of the pre-order.';
            if (!money(flat)) return 'Enter the deposit without a pre-order in cedis.';
            if (![refundHours, visit, lastBefore].every(whole)) return 'Hours and minutes must be whole numbers.';
            if (Number(visit) < 1) return 'A table visit must last at least 1 minute.';
            return null;
          },
          () =>
            createClient()
              .from('settings')
              .update({
                table_deposit_rate: Number(rate) / 100,
                table_deposit_flat: Number(flat),
                table_full_refund_hours: Number(refundHours),
                table_visit_minutes: Number(visit),
                last_table_before_close_minutes: Number(lastBefore),
              })
              .eq('id', true),
        )
      }
      title="Table reservations"
    >
      <div className={styles.twoCols}>
        <Field
          inputMode="numeric"
          label="Deposit with a pre-order"
          onChange={(event) => setRate(event.target.value)}
          prefix="%"
          type="number"
          value={rate}
        />
        <Field
          inputMode="decimal"
          label="Deposit without a pre-order"
          onChange={(event) => setFlat(event.target.value)}
          prefix="GH₵"
          type="number"
          value={flat}
        />
      </div>
      <Field
        hint="Cancelled at least this long before, the deposit comes back in full."
        inputMode="numeric"
        label="Full refund if cancelled (hours before)"
        onChange={(event) => setRefundHours(event.target.value)}
        type="number"
        value={refundHours}
      />
      <div className={styles.twoCols}>
        <Field
          hint="How long a table is kept for one reservation."
          inputMode="numeric"
          label="Table visit (minutes)"
          onChange={(event) => setVisit(event.target.value)}
          type="number"
          value={visit}
        />
        <Field
          hint="No table can be reserved later than this before closing."
          inputMode="numeric"
          label="Last table before closing (minutes)"
          onChange={(event) => setLastBefore(event.target.value)}
          type="number"
          value={lastBefore}
        />
      </div>
    </Editor>
  );
}

type TierDraft = { key: number; days: string; rate: string };

export function RefundsEditor({
  settings,
  tiers,
  onSaved,
}: {
  settings: Settings;
  tiers: RefundTier[];
  onSaved: () => void;
}) {
  const [drafts, setDrafts] = useState<TierDraft[]>(
    tiers.map((tier, index) => ({ key: index, days: String(tier.min_days_before), rate: String(Math.round(tier.refund_rate * 100)) })),
  );
  const [changeDays, setChangeDays] = useState(String(settings.free_date_change_days));
  const [workingDays, setWorkingDays] = useState(String(settings.refund_working_days));
  const { busy, message, run } = useSave(onSaved);

  const update = (key: number, field: 'days' | 'rate', value: string) =>
    setDrafts((current) => current.map((draft) => (draft.key === key ? { ...draft, [field]: value } : draft)));

  const save = () =>
    run(
      () => {
        if (drafts.length === 0) return 'Keep at least one refund rule.';
        if (!drafts.every((draft) => whole(draft.days) && whole(draft.rate) && Number(draft.rate) <= 100)) {
          return 'Days must be whole numbers and refunds between 0% and 100%.';
        }
        if (new Set(drafts.map((draft) => Number(draft.days))).size !== drafts.length) return 'Two rules have the same number of days.';
        if (!whole(changeDays) || !whole(workingDays) || Number(workingDays) < 1) return 'Days must be whole numbers.';
        return null;
      },
      async () => {
        const supabase = createClient();
        const keep = drafts.map((draft) => ({ min_days_before: Number(draft.days), refund_rate: Number(draft.rate) / 100 }));
        const removed = tiers.filter((tier) => !keep.some((rule) => rule.min_days_before === tier.min_days_before));
        if (removed.length > 0) {
          const result = await supabase
            .from('refund_tiers')
            .delete()
            .in('min_days_before', removed.map((tier) => tier.min_days_before));
          if (result.error) return result;
        }
        const upsert = await supabase.from('refund_tiers').upsert(keep);
        if (upsert.error) return upsert;
        return supabase
          .from('settings')
          .update({ free_date_change_days: Number(changeDays), refund_working_days: Number(workingDays) })
          .eq('id', true);
      },
      'Saved. New cancellations follow these rules.',
    );

  return (
    <Editor
      busy={busy}
      intro="How much customers get back when they cancel an event booking. If Joteku cancels, they always get everything back."
      message={message}
      onSubmit={save}
      title="Cancellations and refunds"
    >
      <div className={styles.tiers}>
        <span className={styles.tierHead}>Cancelled at least (days before)</span>
        <span className={styles.tierHead}>Refund</span>
        <span />
        {drafts.map((draft) => (
          <TierRow
            draft={draft}
            key={draft.key}
            onChange={update}
            onRemove={() => setDrafts((current) => current.filter((item) => item.key !== draft.key))}
          />
        ))}
      </div>
      <p className={styles.tierNote}>Cancelled later than every rule: no refund.</p>
      <div>
        <Button
          icon={<Plus aria-hidden="true" size={18} />}
          onClick={() => setDrafts((current) => [...current, { key: Date.now(), days: '', rate: '' }])}
          size="small"
          variant="quiet"
        >
          Add a rule
        </Button>
      </div>
      <div className={styles.twoCols}>
        <Field
          hint="Asked for at least this many days before, one date change is free."
          inputMode="numeric"
          label="Free date change (days before)"
          onChange={(event) => setChangeDays(event.target.value)}
          type="number"
          value={changeDays}
        />
        <Field
          hint="Shown to customers as the time a refund takes."
          inputMode="numeric"
          label="Refunds arrive within (working days)"
          onChange={(event) => setWorkingDays(event.target.value)}
          type="number"
          value={workingDays}
        />
      </div>
    </Editor>
  );
}

function TierRow({
  draft,
  onChange,
  onRemove,
}: {
  draft: TierDraft;
  onChange: (key: number, field: 'days' | 'rate', value: string) => void;
  onRemove: () => void;
}) {
  return (
    <>
      <input
        aria-label="Days before the event"
        className={styles.tierInput}
        inputMode="numeric"
        onChange={(event) => onChange(draft.key, 'days', event.target.value)}
        type="number"
        value={draft.days}
      />
      <span className={styles.tierRate}>
        <input
          aria-label="Refund percent"
          className={styles.tierInput}
          inputMode="numeric"
          onChange={(event) => onChange(draft.key, 'rate', event.target.value)}
          type="number"
          value={draft.rate}
        />
        %
      </span>
      <Button aria-label="Remove this rule" onClick={onRemove} size="small" variant="quiet">
        <Trash2 aria-hidden="true" size={18} />
      </Button>
    </>
  );
}

export function SpaceEditor({ space, onSaved }: { space: Space; onSaved: () => void }) {
  const [name, setName] = useState(space.name);
  const [description, setDescription] = useState(space.description);
  const [capacityLabel, setCapacityLabel] = useState(space.capacity_label);
  const [maxGuests, setMaxGuests] = useState(space.max_guests ? String(space.max_guests) : '');
  const [rate, setRate] = useState(String(space.hourly_rate));
  const [minHours, setMinHours] = useState(String(space.min_hours));
  const [meetings, setMeetings] = useState(space.suitable_for_meetings);
  const [active, setActive] = useState(space.active);
  const { busy, message, run } = useSave(onSaved);

  return (
    <Editor
      busy={busy}
      intro="Prices apply to new bookings. Bookings already made keep the price they were made at."
      message={message}
      onSubmit={() =>
        run(
          () => {
            if (!name.trim() || !description.trim() || !capacityLabel.trim()) return 'Fill in the name, description and capacity.';
            if (!money(rate) || Number(rate) <= 0) return 'Enter the price an hour in cedis.';
            if (!whole(minHours) || Number(minHours) < 1) return 'The minimum must be at least 1 hour.';
            if (maxGuests && (!whole(maxGuests) || Number(maxGuests) < 1)) return 'Most guests must be a whole number.';
            return null;
          },
          () =>
            createClient()
              .from('spaces')
              .update({
                name: name.trim(),
                description: description.trim(),
                capacity_label: capacityLabel.trim(),
                max_guests: maxGuests ? Number(maxGuests) : null,
                hourly_rate: Number(rate),
                min_hours: Number(minHours),
                suitable_for_meetings: meetings,
                active,
              })
              .eq('id', space.id),
        )
      }
      title={space.name}
    >
      <div className={styles.huts}>
        <HutMap size="large" units={space.units.map((unit) => unit.unit)} />
        <p>Which huts this space takes is fixed, because it keeps two bookings from sharing a hut.</p>
      </div>
      <div className={styles.twoCols}>
        <Field inputMode="decimal" label="Price an hour" onChange={(event) => setRate(event.target.value)} prefix="GH₵" type="number" value={rate} />
        <Field inputMode="numeric" label="Minimum hours" onChange={(event) => setMinHours(event.target.value)} type="number" value={minHours} />
      </div>
      <Field label="Name" maxLength={40} onChange={(event) => setName(event.target.value)} value={name} />
      <TextArea label="Description" maxLength={300} onChange={(event) => setDescription(event.target.value)} rows={3} value={description} />
      <div className={styles.twoCols}>
        <Field
          hint="As customers see it, for example Up to 20 guests."
          label="Capacity"
          maxLength={40}
          onChange={(event) => setCapacityLabel(event.target.value)}
          value={capacityLabel}
        />
        <Field
          hint="Leave empty for no limit."
          inputMode="numeric"
          label="Most guests"
          onChange={(event) => setMaxGuests(event.target.value)}
          type="number"
          value={maxGuests}
        />
      </div>
      <div className={styles.checks}>
        <Check checked={meetings} label="Suggest for meetings" onChange={setMeetings} />
        <Check checked={active} label="Customers can book this space" onChange={setActive} />
      </div>
    </Editor>
  );
}

export function DecorationEditor({
  decoration,
  takenIds,
  onSaved,
}: {
  decoration: Decoration | null;
  takenIds: string[];
  onSaved: (id: string) => void;
}) {
  const [name, setName] = useState(decoration?.name ?? '');
  const [description, setDescription] = useState(decoration?.description ?? '');
  const [price, setPrice] = useState(decoration ? String(decoration.price) : '');
  const [active, setActive] = useState(decoration?.active ?? true);
  const id = decoration?.id ?? uniqueSlug(name, takenIds);
  const { busy, message, run } = useSave(() => onSaved(id));

  return (
    <Editor
      busy={busy}
      intro="Customers choose a package when they book a space. Its price is paid with the booking."
      message={message}
      onSubmit={() =>
        run(
          () => {
            if (!name.trim() || !description.trim()) return 'Give the package a name and a description.';
            if (!money(price)) return 'Enter the price in cedis.';
            return null;
          },
          () => {
            const values = { name: name.trim(), description: description.trim(), price: Number(price), active };
            const table = createClient().from('decoration_packages');
            return decoration
              ? table.update(values).eq('id', decoration.id)
              : table.insert({ id, ...values, sort_order: takenIds.length + 1 });
          },
          decoration ? 'Saved.' : 'Package added.',
        )
      }
      saveLabel={decoration ? 'Save changes' : 'Add package'}
      title={decoration ? decoration.name : 'Add a decoration package'}
    >
      <div className={styles.twoCols}>
        <Field label="Name" maxLength={40} onChange={(event) => setName(event.target.value)} placeholder="Gold" value={name} />
        <Field inputMode="decimal" label="Price" onChange={(event) => setPrice(event.target.value)} prefix="GH₵" type="number" value={price} />
      </div>
      <TextArea
        label="What is included"
        maxLength={300}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Table covers, chair sashes, a flower centrepiece on every table"
        rows={3}
        value={description}
      />
      <Check checked={active} label="Customers can choose this package" onChange={setActive} />
    </Editor>
  );
}
