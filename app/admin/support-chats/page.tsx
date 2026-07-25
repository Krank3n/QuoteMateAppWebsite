'use client';

// Website support chatbot — conversation transcripts, handoffs, feedback,
// and cost tracking. Data comes from the adminSupportChats callable
// (functions/src/supportChat.ts), which reads supportChats/ + supportChatDaily/.

import { useEffect, useMemo, useState } from 'react';
import styles from '../admin.module.css';
import { api, fmtRelative } from '../lib/adminApi';
import { useSetPageMeta } from '../lib/pageMeta';

interface ChatRow {
  id: string;
  createdAt: number | null;
  updatedAt: number | null;
  page: string | null;
  userTurns: number;
  handoff: boolean;
  lastMessage: string | null;
  feedback: { up?: number; down?: number } | null;
  costMicros: number;
}

interface DailyRow {
  date: string;
  chats?: number;
  messages?: number;
  handoffs?: number;
  costMicros?: number;
}

interface TranscriptMessage {
  id: string;
  seq: number;
  role: 'user' | 'assistant';
  text: string;
  feedback: 'up' | 'down' | null;
  costMicros: number;
}

function usd(micros: number): string {
  return `$${(micros / 1e6).toFixed(micros >= 100_000 ? 2 : 3)}`;
}

export default function SupportChatsPage() {
  const [data, setData] = useState<{ chats: ChatRow[]; daily: DailyRow[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openChat, setOpenChat] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Record<string, TranscriptMessage[]>>({});

  useEffect(() => {
    let cancelled = false;
    api.supportChats({ action: 'list', limit: 100 }).then((r: any) => {
      if (!cancelled) { setData(r); setLoading(false); }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function toggleTranscript(chatId: string) {
    if (openChat === chatId) { setOpenChat(null); return; }
    setOpenChat(chatId);
    if (!transcripts[chatId]) {
      const r: any = await api.supportChats({ action: 'transcript', chatId }).catch(() => null);
      if (r?.messages) setTranscripts((t) => ({ ...t, [chatId]: r.messages }));
    }
  }

  const totals = useMemo(() => {
    const daily = data?.daily ?? [];
    return {
      chats: daily.reduce((s, d) => s + (d.chats ?? 0), 0),
      messages: daily.reduce((s, d) => s + (d.messages ?? 0), 0),
      handoffs: daily.reduce((s, d) => s + (d.handoffs ?? 0), 0),
      costMicros: daily.reduce((s, d) => s + (d.costMicros ?? 0), 0),
    };
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase().trim();
    if (!q) return data.chats;
    return data.chats.filter((c) =>
      `${c.page || ''} ${c.lastMessage || ''} ${c.id}`.toLowerCase().includes(q));
  }, [data, search]);

  useSetPageMeta({
    title: 'Support Chats',
    breadcrumb: `${totals.chats} chats, ${totals.messages} messages (30d)`,
    search: { value: search, onChange: setSearch, placeholder: 'Search page, message, chat id…' },
  });

  return (
    <div>
      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totals.chats}</div>
          <div className={styles.statLabel}>Chats (30d)</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totals.messages}</div>
          <div className={styles.statLabel}>Messages</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totals.handoffs}</div>
          <div className={styles.statLabel}>Email handoffs</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{usd(totals.costMicros)}</div>
          <div className={styles.statLabel}>AI cost (USD, 30d)</div>
        </div>
      </div>

      {loading && <div className={styles.empty}>Loading…</div>}
      {!loading && filtered.length === 0 && <div className={styles.empty}>No support chats yet.</div>}

      {filtered.map((c) => (
        <div key={c.id} className={styles.card} style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => void toggleTranscript(c.id)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.lastMessage || '(no messages)'}
              </div>
              <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
                {c.userTurns} turns · {c.page || 'unknown page'} · {c.updatedAt ? fmtRelative(c.updatedAt) : ''}
                {c.handoff && <span style={{ color: '#f59e0b' }}> · handed off</span>}
                {(c.feedback?.up ?? 0) > 0 && <span> · 👍 {c.feedback!.up}</span>}
                {(c.feedback?.down ?? 0) > 0 && <span style={{ color: '#ef4444' }}> · 👎 {c.feedback!.down}</span>}
              </div>
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, whiteSpace: 'nowrap' }}>{usd(c.costMicros)}</div>
          </div>

          {openChat === c.id && (
            <div style={{ marginTop: 12, borderTop: '1px solid rgba(128,128,128,0.2)', paddingTop: 12 }} onClick={(e) => e.stopPropagation()}>
              {!transcripts[c.id] && <div style={{ fontSize: 13, opacity: 0.6 }}>Loading transcript…</div>}
              {transcripts[c.id]?.map((m) => (
                <div key={m.id} style={{ marginBottom: 8, fontSize: 13 }}>
                  <span style={{ fontWeight: 700, color: m.role === 'user' ? '#3b82f6' : '#f97316' }}>
                    {m.role === 'user' ? 'Visitor' : 'Bot'}
                  </span>
                  {m.feedback && <span> {m.feedback === 'up' ? '👍' : '👎'}</span>}
                  <div style={{ whiteSpace: 'pre-wrap', marginTop: 2 }}>{m.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
