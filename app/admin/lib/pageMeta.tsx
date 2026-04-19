'use client';

import { ReactNode, useEffect, useSyncExternalStore } from 'react';

export interface PageSearch {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export interface PageMeta {
  title?: string;
  breadcrumb?: string;
  search?: PageSearch;
  actions?: ReactNode;
}

// Module-level store. The topbar subscribes; pages publish. Keeping state OUT
// of React Context on purpose — when the previous version used context+useState,
// every page render triggered setState which re-rendered the provider and thus
// every child INCLUDING the page, which then re-published, creating an infinite
// useEffect loop. That loop locked up the UI and broke nav + profile clicks.
let currentMeta: PageMeta = {};
const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): PageMeta {
  return currentMeta;
}

export function usePageMeta(): PageMeta {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useSetPageMeta(meta: PageMeta): void {
  useEffect(() => {
    currentMeta = meta;
    listeners.forEach((fn) => fn());
  });
}

// Kept only so existing imports don't crash during build; no-op now.
export function PageMetaProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
