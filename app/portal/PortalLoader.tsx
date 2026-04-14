'use client';

import styles from './portal.module.css';

export function PortalLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className={styles.loader} role="status" aria-live="polite">
      <div className={styles.loaderSpinner} aria-hidden="true" />
      <div className={styles.loaderText}>{message}</div>
    </div>
  );
}
