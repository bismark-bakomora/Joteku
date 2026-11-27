'use client';

import { EyeOff, ImageIcon, Plus, Star } from 'lucide-react';
import Image from 'next/image';
import { useMemo } from 'react';
import { Button, EmptyState, ErrorState, Pill, Segmented, Skeleton } from '@/components/ui';
import { DetailBlank, ListButton, Workspace } from '@/components/Workspace';
import { cedis } from '@/lib/format';
import { createClient } from '@/lib/supabase/client';
import type { MenuCategory, MenuItem } from '@/lib/types';
import { rows, useLoad } from '@/lib/useLoad';
import { useParam } from '@/lib/useSelection';
import { CategoryForm, ItemEditor, photoUrl } from './ItemEditor';
import styles from './menu.module.css';

type Kind = 'food' | 'drink';

export function MenuWorkspace() {
  const [kindParam, setKind] = useParam('kind');
  const [selectedId, setSelected] = useParam('id');
  const kind: Kind = kindParam === 'drink' ? 'drink' : 'food';

  const load = useLoad(async () => {
    const supabase = createClient();
    const [categories, items] = await Promise.all([
      supabase.from('menu_categories').select('*').order('sort_order'),
      supabase.from('menu_items').select('*').order('sort_order'),
    ]);
    return { categories: rows<MenuCategory[]>(categories), items: rows<MenuItem[]>(items) };
  }, 'menu');

  const categories = useMemo(() => (load.data?.categories ?? []).filter((category) => category.kind === kind), [load.data, kind]);
  const items = load.data?.items ?? [];
  const selected = items.find((item) => item.id === selectedId);

  let list: React.ReactNode;
  if (load.error && !load.data) {
    list = <ErrorState message={load.error} onRetry={load.reload} />;
  } else if (!load.data) {
    list = [0, 1, 2, 3].map((index) => <Skeleton height={76} key={index} />);
  } else if (categories.length === 0) {
    list = <EmptyState body="Add a category first, then add items to it." title={`No ${kind} categories yet`} />;
  } else {
    list = categories.map((category) => {
      const inCategory = items.filter((item) => item.category_id === category.id);
      return (
        <section aria-label={category.name} className={styles.group} key={category.id}>
          <h2 className={styles.groupTitle}>
            {category.name}
            <span className={`${styles.groupCount} num`}>{inCategory.length}</span>
          </h2>
          {inCategory.length === 0 ? <p className={styles.groupEmpty}>No items in this category yet.</p> : null}
          {inCategory.map((item) => (
            <ListButton key={item.id} onSelect={() => setSelected(item.id)} selected={item.id === selectedId}>
              <span className={styles.item} data-hidden={!item.available || undefined}>
                <span className={styles.thumb}>
                  {item.photo_path ? (
                    <Image alt="" height={56} sizes="56px" src={photoUrl(item.photo_path)} width={56} />
                  ) : (
                    <ImageIcon aria-hidden="true" size={22} />
                  )}
                </span>
                <span className={styles.itemText}>
                  <b>{item.name}</b>
                  <span className={styles.itemMeta}>
                    {!item.available ? (
                      <Pill tone="neutral">
                        <EyeOff aria-hidden="true" size={12} /> Hidden
                      </Pill>
                    ) : null}
                    {item.popular ? (
                      <Pill tone="gold">
                        <Star aria-hidden="true" size={12} /> Popular
                      </Pill>
                    ) : null}
                  </span>
                </span>
                <span className={`${styles.price} num`}>{cedis(item.price)}</span>
              </span>
            </ListButton>
          ))}
        </section>
      );
    });
  }

  const adding = selectedId === 'new';
  const addingCategory = selectedId === 'new-category';

  let detail: React.ReactNode;
  if (adding && load.data) {
    detail = (
      <ItemEditor
        categories={categories}
        item={null}
        key={`new-${kind}`}
        kind={kind}
        onSaved={(id) => {
          load.reload();
          setSelected(id);
        }}
        takenIds={items.map((item) => item.id)}
      />
    );
  } else if (addingCategory && load.data) {
    detail = (
      <CategoryForm
        categories={load.data.categories}
        kind={kind}
        onSaved={() => {
          load.reload();
          setSelected(null);
        }}
      />
    );
  } else if (selected && load.data) {
    detail = (
      <ItemEditor
        categories={load.data.categories.filter((category) => category.kind === kind || category.id === selected.category_id)}
        item={selected}
        key={selected.id}
        kind={kind}
        onSaved={() => load.reload()}
        takenIds={items.map((item) => item.id)}
      />
    );
  } else {
    detail = (
      <DetailBlank>
        <p>Choose an item to change its price, photo or details, or to hide it from the menu.</p>
      </DetailBlank>
    );
  }

  return (
    <Workspace
      backLabel="The whole menu"
      detail={detail}
      hasSelection={Boolean(selectedId)}
      list={list}
      onBack={() => setSelected(null)}
      title="Menu"
      toolbar={
        <>
          <Segmented
            label="Food or drinks"
            onChange={(value) => setKind(value === 'food' ? null : value)}
            options={[
              { value: 'food', label: 'Food' },
              { value: 'drink', label: 'Drinks' },
            ]}
            value={kind}
          />
          <div className={styles.addRow}>
            <Button icon={<Plus aria-hidden="true" size={20} />} onClick={() => setSelected('new')} variant="gold">
              Add {kind === 'food' ? 'a dish' : 'a drink'}
            </Button>
            <Button onClick={() => setSelected('new-category')} variant="quiet">
              Add category
            </Button>
          </div>
        </>
      }
    />
  );
}
