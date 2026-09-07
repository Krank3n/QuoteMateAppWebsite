// @vitest-environment jsdom
import React, { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Analytics from './Analytics';
import { ACQUISITION_KEY } from './acquisition';

const state = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => state.pathname }));
vi.mock('next/script', () => ({ default: () => null }));
const w = window as unknown as Record<string, any>;
let root: Root;
const events = () => (w.dataLayer || []).map((v: IArguments) => Array.from(v)).filter((v: unknown[]) => v[0] === 'event');

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers();
  localStorage.clear(); sessionStorage.clear();
  document.cookie = `${ACQUISITION_KEY}=;path=/;max-age=0`;
  history.replaceState({}, '', '/'); state.pathname = '/';
  delete w.gtag; delete w.dataLayer; delete w.__qmGaConfigured;
  document.body.innerHTML = '<div id="root"></div>';
  document.onclick = e => e.preventDefault();
  root = createRoot(document.getElementById('root')!);
});
afterEach(async () => { await act(async () => root.unmount()); vi.useRealTimers(); vi.unstubAllGlobals(); });
const render = () => act(async () => root.render(<StrictMode><Analytics /><a href="/app?signup=1">Try</a></StrictMode>));
const click = () => document.querySelector('a')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

describe('Analytics component lifecycle', () => {
  it('does not double-count homepage impressions or CTA clicks in Strict Mode', async () => {
    await render(); click();
    expect(events().map((e: unknown[]) => e[1])).toEqual(['experiment_impression', 'web_app_click']);
  });
  it('rebinds on navigation, stops on admin, and counts a genuine homepage return', async () => {
    await render();
    history.replaceState({}, '', '/templates/'); state.pathname = '/templates/'; await render(); click();
    expect(events().at(-1)[2].page_path).toBe('/templates/');
    history.replaceState({}, '', '/admin/'); state.pathname = '/admin/'; await render(); click();
    vi.advanceTimersByTime(300_000);
    expect(w['ga-disable-G-E3JERN2D5V']).toBe(true);
    expect(events()).toHaveLength(2);
    history.replaceState({}, '', '/'); state.pathname = '/'; await render();
    expect(events().filter((e: unknown[]) => e[1] === 'experiment_impression')).toHaveLength(2);
  });
  it('does not initialise GA at all when owner tracking is disabled', async () => {
    history.replaceState({}, '', '/?notrack=1'); await render();
    expect(w.gtag).toBeUndefined(); expect(events()).toHaveLength(0);
  });
});
