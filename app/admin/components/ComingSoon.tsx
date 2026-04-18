'use client';

import styles from '../admin.module.css';
import { useSetPageMeta } from '../lib/pageMeta';

export default function ComingSoon({ title, hint }: { title: string; hint: string }) {
  useSetPageMeta({ title, breadcrumb: 'Coming soon' });
  return (
    <div className={styles.card}>
      <div className={styles.empty}>
        <div className={styles.emptyTitle}>{title} is next</div>
        <div className={styles.emptyText}>{hint}</div>
      </div>
    </div>
  );
}
