'use client';

import { AlertTriangle, Inbox, RotateCw } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { useId } from 'react';
import { STATUS_LABELS } from '@/lib/format';
import type { BookingStatus } from '@/lib/types';
import styles from './ui.module.css';

type ButtonVariant = 'primary' | 'gold' | 'outline' | 'quiet' | 'danger';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'normal' | 'small';
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'normal',
  loading = false,
  icon,
  children,
  className,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], size === 'small' ? styles.small : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return (
    <button aria-busy={loading || undefined} className={classes} disabled={disabled || loading} type={type} {...rest}>
      {loading ? <span aria-hidden="true" className={styles.spinner} /> : icon}
      {children}
    </button>
  );
}

type FieldProps = {
  label: string;
  hint?: string;
  error?: string | null;
  prefix?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function Field({ label, hint, error, prefix, className, id: givenId, ...input }: FieldProps) {
  const generatedId = useId();
  const id = givenId ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={prefix ? styles.prefixed : undefined}>
        {prefix ? <span className={styles.prefix}>{prefix}</span> : null}
        <input aria-describedby={hintId} aria-invalid={error ? true : undefined} className={styles.input} id={id} {...input} />
      </div>
      {hint ? (
        <span className={styles.hint} id={hintId}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function TextArea({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <textarea className={styles.input} id={id} {...input} />
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
}

export function Select({
  label,
  children,
  ...select
}: { label: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <select className={styles.input} id={id} {...select}>
        {children}
      </select>
    </div>
  );
}

export function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={styles.check}>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      {label}
    </label>
  );
}

const STATUS_TONES: Record<BookingStatus, string> = {
  confirmed: styles.confirmed,
  pending_payment: styles.pending,
  cancelled: styles.cancelled,
  completed: styles.completed,
};

export function StatusPill({ status }: { status: BookingStatus }) {
  return (
    <span className={`${styles.pill} ${STATUS_TONES[status]}`}>
      <span aria-hidden="true" className={styles.dot} />
      {STATUS_LABELS[status]}
    </span>
  );
}

type PillTone = 'confirmed' | 'pending' | 'cancelled' | 'neutral' | 'gold';

export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  const toneClass = tone === 'gold' ? styles.goldPill : styles[tone];
  return <span className={`${styles.pill} ${toneClass}`}>{children}</span>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`${styles.card} ${className ?? ''}`}>{children}</div>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className={styles.state}>
      <div className={styles.stateIcon}>
        <Inbox aria-hidden="true" size={26} />
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={`${styles.state} ${styles.stateError}`} role="alert">
      <div className={styles.stateIcon}>
        <AlertTriangle aria-hidden="true" size={26} />
      </div>
      <h3>Could not load</h3>
      <p>{message}</p>
      <Button icon={<RotateCw aria-hidden="true" size={18} />} onClick={onRetry} variant="quiet">
        Try again
      </Button>
    </div>
  );
}

export function Skeleton({ height, width = '100%' }: { height: number; width?: number | string }) {
  return <div aria-hidden="true" className={styles.skeleton} style={{ height, width }} />;
}

export function Notice({ tone, children }: { tone: 'error' | 'success' | 'info'; children: ReactNode }) {
  const toneClass = tone === 'error' ? styles.noticeError : tone === 'success' ? styles.noticeSuccess : styles.noticeInfo;
  return (
    <div className={`${styles.notice} ${toneClass}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div aria-label={label} className={styles.segmented} role="group">
      {options.map((option) => (
        <button
          aria-pressed={option.value === value}
          className={styles.segment}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
          {option.count ? <span className={`${styles.count} num`}>{option.count}</span> : null}
        </button>
      ))}
    </div>
  );
}
