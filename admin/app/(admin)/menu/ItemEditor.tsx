'use client';

import { ImagePlus, Save, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { type FormEvent, useRef, useState } from 'react';
import { Button, Card, Check, Field, Notice, Select, TextArea } from '@/components/ui';
import { errorMessage } from '@/lib/errors';
import { slugify, uniqueSlug } from '@/lib/slug';
import { createClient } from '@/lib/supabase/client';
import { supabaseUrl } from '@/lib/supabase/env';
import type { MenuCategory, MenuItem } from '@/lib/types';
import styles from './menu.module.css';

const BUCKET = 'menu-photos';
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function photoUrl(path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
}

type Message = { tone: 'error' | 'success'; text: string } | null;

export function ItemEditor({
  item,
  kind,
  categories,
  takenIds,
  onSaved,
}: {
  item: MenuItem | null;
  kind: 'food' | 'drink';
  categories: MenuCategory[];
  takenIds: string[];
  onSaved: (id: string) => void;
}) {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [price, setPrice] = useState(item ? String(item.price) : '');
  const [categoryId, setCategoryId] = useState(item?.category_id ?? categories[0]?.id ?? '');
  const [tag, setTag] = useState(item?.tag ?? '');
  const [popular, setPopular] = useState(item?.popular ?? false);
  const [available, setAvailable] = useState(item?.available ?? true);
  const [photoPath, setPhotoPath] = useState(item?.photo_path ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const choosePhoto = (file: File | undefined) => {
    setMessage(null);
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      setMessage({ tone: 'error', text: 'Use a JPEG, PNG or WebP photo.' });
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setMessage({ tone: 'error', text: 'That photo is over 5 MB. Choose a smaller one.' });
      return;
    }
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    const amount = Number(price);
    if (!name.trim() || !description.trim()) {
      setMessage({ tone: 'error', text: 'Give the item a name and a short description.' });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage({ tone: 'error', text: 'Enter the price in cedis, more than 0.' });
      return;
    }
    if (!categoryId) {
      setMessage({ tone: 'error', text: 'Choose a category.' });
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const id = item?.id ?? uniqueSlug(name, takenIds);
    let path = photoPath;
    if (photoFile) {
      const extension = photoFile.type.split('/')[1].replace('jpeg', 'jpg');
      path = `${id}/${Date.now()}.${extension}`;
      const upload = await supabase.storage.from(BUCKET).upload(path, photoFile, { contentType: photoFile.type, upsert: true });
      if (upload.error) {
        setBusy(false);
        setMessage({ tone: 'error', text: 'The photo did not upload. Check the connection and try again.' });
        return;
      }
    }
    const values = {
      name: name.trim(),
      description: description.trim(),
      price: amount,
      category_id: categoryId,
      tag: tag.trim() || null,
      popular,
      available,
      photo_path: path,
    };
    const result = item
      ? await supabase.from('menu_items').update(values).eq('id', item.id)
      : await supabase.from('menu_items').insert({ id, ...values, sort_order: takenIds.length + 1 });
    setBusy(false);
    if (result.error) {
      setMessage({ tone: 'error', text: errorMessage(result.error, 'The item was not saved. Please try again.') });
      return;
    }
    setPhotoPath(path);
    setPhotoFile(null);
    setMessage({ tone: 'success', text: item ? 'Saved. Customers see it the next time the menu loads.' : 'Added to the menu.' });
    onSaved(id);
  };

  const shownPhoto = preview ?? (photoPath ? photoUrl(photoPath) : null);

  return (
    <form className={styles.editor} noValidate onSubmit={save}>
      <header className={styles.editorHead}>
        <h2>{item ? item.name : kind === 'food' ? 'Add a dish' : 'Add a drink'}</h2>
        {item && !item.available ? <p className={styles.hiddenNote}>Hidden: customers do not see this item.</p> : null}
      </header>

      <Card className={styles.editorCard}>
        <div className={styles.photoRow}>
          <div className={styles.photo}>
            {shownPhoto ? (
              <Image alt={`Photo of ${name || 'the item'}`} fill sizes="160px" src={shownPhoto} unoptimized={Boolean(preview)} />
            ) : (
              <span>No photo yet</span>
            )}
          </div>
          <div className={styles.photoActions}>
            <input
              accept={PHOTO_TYPES.join(',')}
              className="visually-hidden"
              onChange={(event) => choosePhoto(event.target.files?.[0])}
              ref={fileInput}
              type="file"
            />
            <Button icon={<ImagePlus aria-hidden="true" size={18} />} onClick={() => fileInput.current?.click()} variant="quiet">
              {shownPhoto ? 'Change photo' : 'Add a photo'}
            </Button>
            {shownPhoto ? (
              <Button
                icon={<Trash2 aria-hidden="true" size={18} />}
                onClick={() => {
                  setPhotoFile(null);
                  setPreview(null);
                  setPhotoPath(null);
                }}
                variant="quiet"
              >
                Remove photo
              </Button>
            ) : null}
            <span className={styles.photoHint}>JPEG, PNG or WebP, up to 5 MB. Saved when you press Save.</span>
          </div>
        </div>

        <Field label="Name" maxLength={80} onChange={(event) => setName(event.target.value)} placeholder="Jollof & Grilled Tilapia" value={name} />
        <TextArea
          label="Description"
          maxLength={300}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What is in it, in a few words"
          rows={3}
          value={description}
        />
        <div className={styles.twoCols}>
          <Field
            inputMode="decimal"
            label="Price"
            min="0.01"
            onChange={(event) => setPrice(event.target.value)}
            prefix="GH₵"
            step="0.01"
            type="number"
            value={price}
          />
          <Select label="Category" onChange={(event) => setCategoryId(event.target.value)} value={categoryId}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
        <Field
          hint="A short label on the photo, for example Freshly Prepared or Ice Cold."
          label="Label (optional)"
          maxLength={30}
          onChange={(event) => setTag(event.target.value)}
          value={tag}
        />
        <div className={styles.checks}>
          <Check checked={available} label="Show on the menu" onChange={setAvailable} />
          <Check checked={popular} label="Show under Popular on the app's home" onChange={setPopular} />
        </div>
      </Card>

      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

      <div className={styles.saveRow}>
        <Button icon={<Save aria-hidden="true" size={18} />} loading={busy} type="submit" variant="primary">
          {item ? 'Save changes' : 'Add to menu'}
        </Button>
      </div>
    </form>
  );
}

export function CategoryForm({
  kind,
  categories,
  onSaved,
}: {
  kind: 'food' | 'drink';
  categories: MenuCategory[];
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!slugify(name)) {
      setError('Give the category a name.');
      return;
    }
    if (categories.some((category) => category.name.toLowerCase() === name.trim().toLowerCase())) {
      setError('There is already a category with that name.');
      return;
    }
    setBusy(true);
    const { error: insertError } = await createClient()
      .from('menu_categories')
      .insert({
        id: uniqueSlug(name, categories.map((category) => category.id)),
        name: name.trim(),
        kind,
        sort_order: Math.max(0, ...categories.map((category) => category.sort_order)) + 1,
      });
    setBusy(false);
    if (insertError) {
      setError(errorMessage(insertError, 'The category was not added. Please try again.'));
      return;
    }
    onSaved();
  };

  return (
    <form className={styles.editor} noValidate onSubmit={save}>
      <h2>Add a {kind === 'food' ? 'food' : 'drinks'} category</h2>
      <Card className={styles.editorCard}>
        <Field
          label="Category name"
          maxLength={40}
          onChange={(event) => setName(event.target.value)}
          placeholder={kind === 'food' ? 'Soups' : 'Cocktails'}
          value={name}
        />
      </Card>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className={styles.saveRow}>
        <Button loading={busy} type="submit" variant="primary">
          Add category
        </Button>
      </div>
    </form>
  );
}
