import type { Metadata } from 'next';
import { RoofMark } from '@/components/RoofMark';
import { LoginForm } from './LoginForm';
import styles from './login.module.css';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section aria-hidden="true" className={styles.brand}>
        <RoofMark width={96} />
        <p className={styles.word}>Joteku</p>
        <p className={styles.place}>Teshie 1st Junction · over 40 years</p>
      </section>
      <section className={styles.panel}>
        <div className={styles.form}>
          <div className={styles.mobileMark}>
            <RoofMark width={64} />
          </div>
          <h1>Sign in to Joteku Admin</h1>
          <p className={styles.intro}>Bookings, catering quotes, the menu and payments, in one place.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
