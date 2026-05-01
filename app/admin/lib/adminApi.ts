'use client';

import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebase';

export function call<TIn = any, TOut = any>(name: string) {
  return async (data: TIn): Promise<TOut> => {
    const fn = httpsCallable<TIn, TOut>(functions, name);
    const res = await fn(data);
    return res.data;
  };
}

export const api = {
  whoami: call('adminWhoami'),
  dashboardStats: call('adminDashboardStats'),
  listUsers: call<{ search?: string; limit?: number }>('adminListUsers'),
  getUser: call<{ uid: string }>('adminGetUser'),
  addUserNote: call<{ uid: string; note: string }>('adminAddUserNote'),
  logCall: call<{ uid: string; outcome: string; notes: string; durationSec?: number }>('adminLogCall'),
  setUserTags: call<{ uid: string; tags: string[] }>('adminSetUserTags'),
  sendUserEmail: call<{ uid: string; subject: string; body: string; bypassPrefs?: boolean }>('adminSendUserEmail'),
  listSuppliers: call('adminListSuppliers'),
  getSupplier: call<{ id: string }>('adminGetSupplier'),
  addSupplierNote: call<{ id: string; note: string }>('adminAddSupplierNote'),
  setSupplierTags: call<{ id: string; tags: string[] }>('adminSetSupplierTags'),
  sendSupplierEmail: call<{ id: string; subject: string; body: string }>('adminSendSupplierEmail'),
  broadcast: call<{
    segment: string;
    segmentParams?: Record<string, unknown>;
    subject: string;
    body: string;
    dryRun?: boolean;
  }>('adminBroadcast'),
  replyToFeedback: call<{ feedbackId: string; body: string; subject?: string }>('adminReplyToFeedback'),
  listSubscriptions: call('adminListSubscriptions'),
  listAffiliates: call('adminListAffiliates'),
  exportCsv: call<{ entity: 'users' | 'suppliers' | 'subscriptions' | 'affiliates' }>('adminExportCsv'),
  listSegments: call('adminListSegments'),
  saveSegment: call<{ id?: string; name: string; segment: string; segmentParams?: Record<string, unknown>; subject: string; body: string }>('adminSaveSegment'),
  deleteSegment: call<{ id: string }>('adminDeleteSegment'),
  impersonate: call<{ uid: string }>('adminImpersonate'),
  metricsSeries: call<{ days?: number }>('adminMetricsSeries'),
  listEmailEvents: call<{ limit?: number; category?: string; status?: string; userId?: string }>('adminListEmailEvents'),
  emailHealth: call('adminEmailHealth'),
  grantPro: call<{ uid: string; months?: number }>('adminGrantPro'),
  revokePro: call<{ uid: string }>('adminRevokePro'),
  setUserDisabled: call<{ uid: string; disabled: boolean }>('adminSetUserDisabled'),
  deleteUser: call<{ uid: string; wipeData?: boolean; confirmEmail: string }>('adminDeleteUser'),
  listDocuments: call<{ limit?: number; stage?: string; type?: 'quote' | 'invoice' | ''; userId?: string }>('adminListDocuments'),
  getDocument: call<{ uid: string; id: string }>('adminGetDocument'),
  listPayments: call<{ limit?: number }>('adminListPayments'),
};

export async function downloadCsv(entity: 'users' | 'suppliers' | 'subscriptions' | 'affiliates'): Promise<void> {
  const res: any = await api.exportCsv({ entity });
  if (!res?.csv) throw new Error('Empty CSV response');
  const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = res.filename || `${entity}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function fmtRelative(ms: number | null | undefined): string {
  if (!ms) return '—';
  const diff = Date.now() - ms;
  if (diff < 0) return 'in the future';
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export function fmtDate(ms: number | null | undefined): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function fmtDateTime(ms: number | null | undefined): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function initials(name: string | null | undefined, fallback = '?'): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] || '';
  const b = parts[1]?.[0] || '';
  return ((a + b).toUpperCase() || fallback).slice(0, 2);
}
