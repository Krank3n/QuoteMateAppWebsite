'use client';

import AdminShell from './AdminShell';
import styles from '../admin.module.css';

export default function ComingSoon({ title, hint }: { title: string; hint: string }) {
  return (
    <AdminShell title={title} breadcrumb="Coming soon">
      <div className={styles.card}>
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>{title} is next</div>
          <div className={styles.emptyText}>{hint}</div>
        </div>
      </div>
    </AdminShell>
  );
}
