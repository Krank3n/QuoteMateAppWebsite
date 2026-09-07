// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AttributionBridge from './AttributionBridge';
import { ACQUISITION_KEY } from './acquisition';
import { CAMPAIGN_STORAGE_KEY } from './campaignAttribution';

const state = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => state.pathname }));
vi.mock('next/script', () => ({ default: () => null }));
let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  localStorage.clear(); sessionStorage.clear();
  document.cookie = `${ACQUISITION_KEY}=;path=/;max-age=0`;
  state.pathname = '/';
  history.replaceState({}, '', '/');
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});
async function render(href = '/app?signup=1') {
  await act(async () => root.render(<><AttributionBridge /><a id="app-link" href={href}>Try</a></>));
}

describe('attribution bridge lifecycle', () => {
  it('keeps paid first-touch params when navigating to another marketing page', async () => {
    history.replaceState({}, '', '/?utm_source=facebook&utm_medium=cpc');
    await render();
    expect(document.querySelector('#app-link')!.getAttribute('href')).toContain('utm_source=facebook');
    history.replaceState({}, '', '/templates/'); state.pathname = '/templates/';
    await render();
    const href = document.querySelector('#app-link')!.getAttribute('href')!;
    expect(href).toContain('signup=1');
    expect(href).toContain('utm_source=facebook');
  });
  it('decorates late-rendered links before context-menu/new-tab navigation', async () => {
    history.replaceState({}, '', '/?utm_source=google&utm_medium=cpc');
    await render();
    const late = document.createElement('a'); late.href = '/app?signup=1#auth';
    await act(async () => { document.body.appendChild(late); await Promise.resolve(); });
    expect(late.href).toContain('utm_source=google');
    expect(late.hash).toBe('#auth');
  });
  it('captures marketing first touch without decorating organic links with UTMs', async () => {
    await render();
    expect(sessionStorage.getItem(ACQUISITION_KEY)).not.toBeNull();
    expect(sessionStorage.getItem(CAMPAIGN_STORAGE_KEY)).toBeNull();
    expect(document.querySelector('#app-link')!.getAttribute('href')).toBe('/app?signup=1');
  });
  it('disconnects campaign observers when entering internal pages', async () => {
    history.replaceState({}, '', '/?utm_source=google'); await render();
    history.replaceState({}, '', '/admin/'); state.pathname = '/admin/'; await render();
    const late = document.createElement('a'); late.href = '/app?signup=1';
    await act(async () => { document.body.appendChild(late); await Promise.resolve(); });
    expect(late.search).toBe('?signup=1');
  });
  it('does not capture or decorate anything for an opted-out visitor', async () => {
    history.replaceState({}, '', '/?notrack=1&utm_source=google'); await render();
    expect(sessionStorage.getItem(ACQUISITION_KEY)).toBeNull();
    expect(sessionStorage.getItem(CAMPAIGN_STORAGE_KEY)).toBeNull();
    expect(document.querySelector('#app-link')!.getAttribute('href')).toBe('/app?signup=1');
  });
});
