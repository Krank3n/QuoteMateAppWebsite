'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import {
  createOrUpdateSupplier,
  savePriceItems,
  setSupplierClaim,
  getSupplier,
  type ExtractionResult,
} from '../../../lib/supplierService';
import styles from '../portal.module.css';
import { PortalLoader } from '../PortalLoader';

const googleProvider = new GoogleAuthProvider();

export function SignUpClient() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem('extractionData');
    if (stored) {
      try {
        const data = JSON.parse(stored) as ExtractionResult;
        if (data.supplierContact?.contactPerson) {
          setDisplayName(data.supplierContact.contactPerson);
        }
      } catch {
        sessionStorage.removeItem('extractionData');
      }
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/portal/dashboard');
      }
      setCheckingAuth(false);
    });
  }, [router]);

  if (checkingAuth) {
    return <PortalLoader />;
  }

  /** Save extraction data as a supplier profile after auth */
  async function saveExtractionData(user: User, isNewUser: boolean) {
    const stored = sessionStorage.getItem('extractionData');
    if (!stored) return;

    // Only create supplier profile for new users, or if they don't have one yet
    if (!isNewUser) {
      const existing = await getSupplier(user.uid);
      if (existing) return;
    }

    const extractionData = JSON.parse(stored) as ExtractionResult;
    const supplierId = user.uid;

    await createOrUpdateSupplier(supplierId, {
      name: extractionData.supplierName,
      ownerUid: user.uid,
      contactPerson: extractionData.supplierContact?.contactPerson || user.displayName || undefined,
      phone: extractionData.supplierContact?.phone,
      email: extractionData.supplierContact?.email || user.email || undefined,
      address: extractionData.supplierContact?.address,
      website: extractionData.supplierContact?.website,
    });

    if (extractionData.items.length > 0) {
      await savePriceItems(supplierId, extractionData.items);
    }

    await setSupplierClaim(supplierId);
    sessionStorage.removeItem('extractionData');
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Check if this is a new user (creationTime === lastSignInTime)
      const isNew =
        result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      await saveExtractionData(result.user, isNew);
      router.push('/portal/dashboard');
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      if (firebaseErr.code === 'auth/popup-closed-by-user') return;
      setError(firebaseErr.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let user: User;

      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        user = cred.user;
        if (displayName) {
          await updateProfile(user, { displayName });
        }
        await saveExtractionData(user, true);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        user = cred.user;
        await saveExtractionData(user, false);
      }

      router.push('/portal/dashboard');
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      const code = firebaseErr.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('Email already registered. Try signing in instead.');
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else if (code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else {
        setError(firebaseErr.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img src="/assets/favicon.png" alt="QuoteMate" className={styles.logo} />
        <h1 className={styles.title}>{isSignUp ? 'Create Your Account' : 'Sign In'}</h1>
        <p className={styles.subtitle}>
          {isSignUp
            ? 'Save your price list and start getting subscribers'
            : 'Access your supplier dashboard'}
        </p>
      </div>

      <div className={styles.card}>
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className={styles.googleButton}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {googleLoading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div className={styles.divider}>
          <span className={styles.dividerText}>or</span>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className={styles.field}>
              <label className={styles.label}>Contact Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className={styles.input}
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
              required
              minLength={6}
              className={styles.input}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={loading || googleLoading} className={styles.button}>
            {loading
              ? isSignUp
                ? 'Creating account...'
                : 'Signing in...'
              : isSignUp
              ? 'Create Account & Save Prices'
              : 'Sign In'}
          </button>
        </form>

        <p className={styles.hint}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className={styles.link}
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
}
