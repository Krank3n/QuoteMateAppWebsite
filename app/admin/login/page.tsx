'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import styles from '../admin.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      const token = await u.getIdTokenResult();
      if (token.claims.admin === true) router.replace('/admin');
    });
    return () => unsub();
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      const u = auth.currentUser;
      if (!u) throw new Error('Sign-in failed');
      const token = await u.getIdTokenResult(true);
      if (token.claims.admin !== true) {
        setError("This account isn't authorised as an admin.");
        setLoading(false);
        return;
      }
      router.replace('/admin');
    } catch (err: any) {
      setError(err?.message?.replace('Firebase: ', '') || 'Sign-in failed');
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginWrap}>
      <form className={styles.loginCard} onSubmit={onSubmit}>
        <div className={styles.loginLogo}>Q</div>
        <div className={styles.loginTitle}>QuoteMate Admin</div>
        <p className={styles.loginSub}>Sign in with your admin account</p>

        {error && <div className={styles.loginError}>{error}</div>}

        <div className={styles.loginField}>
          <label className={styles.loginLabel}>Email</label>
          <input
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div className={styles.loginField}>
          <label className={styles.loginLabel}>Password</label>
          <input
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" className={styles.loginButton} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
