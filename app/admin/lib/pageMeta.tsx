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
 * Pages call this to populate the persistent topbar. Updates on every render so
 * dynamic values (search value, per-state actions) stay in sync without
 * forcing pages to memoize their props.
 */
export function useSetPageMeta(meta: PageMeta): void {
  const ctx = useContext(PageMetaContext);
  useEffect(() => {
    ctx?.setMeta(meta);
    return () => ctx?.setMeta({});
    // Intentionally re-run on every prop change — search.value typing must propagate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.title, meta.breadcrumb, meta.search?.value, meta.search?.placeholder, meta.search?.onChange, meta.actions]);
}
