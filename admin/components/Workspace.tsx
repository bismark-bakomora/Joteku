import { ArrowLeft } from 'lucide-react';
import { RoofMark } from './RoofMark';
import type { ReactNode } from 'react';
import styles from './Workspace.module.css';

type WorkspaceProps = {
  title: string;
  toolbar?: ReactNode;
  list: ReactNode;
  detail: ReactNode;
  // When something is chosen, phones show the detail instead of the list.
  hasSelection: boolean;
  onBack: () => void;
  backLabel: string;
};

// The admin page's one layout: a list on the left, the chosen item on the right.
// On a phone they are two screens, with Back from the detail to the list.
export function Workspace({ title, toolbar, list, detail, hasSelection, onBack, backLabel }: WorkspaceProps) {
  return (
    <div className={styles.workspace} data-selected={hasSelection || undefined}>
      <section aria-label={title} className={styles.list}>
        <header className={styles.head}>
          <h1>{title}</h1>
          {toolbar}
        </header>
        <div className={styles.items}>{list}</div>
      </section>
      <section aria-live="polite" className={styles.detail}>
        {hasSelection ? (
          <button className={styles.back} onClick={onBack} type="button">
            <ArrowLeft aria-hidden="true" size={20} />
            {backLabel}
          </button>
        ) : null}
        {detail}
      </section>
    </div>
  );
}

export function ListButton({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button aria-current={selected || undefined} className={styles.row} onClick={onSelect} type="button">
      {children}
    </button>
  );
}

export function DetailBlank({ children }: { children: ReactNode }) {
  return (
    <div className={styles.blank}>
      <div className={styles.blankInner}>
        <RoofMark width={72} />
        {children}
      </div>
    </div>
  );
}
