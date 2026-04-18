'use client';

import { ReactNode, createContext, useContext, useEffect, useState, useCallback } from 'react';

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

interface Ctx {
  meta: PageMeta;
  setMeta: (m: PageMeta) => void;
}

const PageMetaContext = createContext<Ctx | null>(null);

export function PageMetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMetaState] = useState<PageMeta>({});
  const setMeta = useCallback((m: PageMeta) => setMetaState(m), []);
  return <PageMetaContext.Provider value={{ meta, setMeta }}>{children}</PageMetaContext.Provider>;
}

export function usePageMeta(): PageMeta {
  const ctx = useContext(PageMetaContext);
  return ctx?.meta || {};
}

/**
 * Pages call this to populate the persistent topbar. Effect runs after every
 * render (no deps) so dynamic props (search value, stateful actions) propagate.
 * No cleanup — the next page's render will overwrite; a blank trailing state
 * between pages caused noticeable flicker/navigation weirdness.
 */
export function useSetPageMeta(meta: PageMeta): void {
  const ctx = useContext(PageMetaContext);
  useEffect(() => {
    ctx?.setMeta(meta);
  });
}
