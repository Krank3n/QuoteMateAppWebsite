'use client';

// Lightweight stale-while-revalidate cache for admin pages.
// Paint cached data instantly, then revalidate in the background and overwrite.
const PREFIX = 'qm-admin-cache:';

interface Envelope<T> { data: T; at: number; }

export function getCached<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const env = JSON.parse(raw) as Envelope<T>;
    return env?.data ?? null;
  } catch {
    return null;
  }
}

export function setCached<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify({ data, at: Date.now() }));
  } catch {
    // quota / serialization failures are non-fatal
  }
}
