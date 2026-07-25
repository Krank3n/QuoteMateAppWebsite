'use client';

// Customer support chatbot widget. Talks to the `supportChat` Firebase
// Function, which answers only from the curated knowledge base
// (knowledge-base/ → Firestore supportKb) and hands off to email otherwise.
// Every conversation is tracked server-side (supportChats/ + daily rollups);
// this component adds the client-side GA4 events.

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from './SupportChat.module.css';

const ENDPOINT = 'https://us-central1-hansendev.cloudfunctions.net/supportChat';
const SUPPORT_EMAIL = 'tom@hansendev.com.au';

const STARTERS = [
  'How much does QuoteMate cost?',
  'How does the free trial work?',
  'What are the card payment fees?',
  'Does QuoteMate work with Xero?',
];

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  messageId?: string; // server id of assistant messages, for feedback
  feedback?: 'up' | 'down';
}

function track(event: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', event, params || {});
  }
}

function getChatId(): string {
  try {
    let id = sessionStorage.getItem('qm_support_chat_id');
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^a-zA-Z0-9_-]/g, '');
      sessionStorage.setItem('qm_support_chat_id', id);
    }
    return id;
  } catch {
    return `anon-${Date.now()}`;
  }
}

export default function SupportChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const openedOnce = useRef(false);

  // Restore the thread across hard reloads within the session.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('qm_support_chat_msgs');
      if (saved) setMessages(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem('qm_support_chat_msgs', JSON.stringify(messages.slice(-40))); } catch { /* ignore */ }
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy, open]);

  // Keep the bot off internal/utility surfaces.
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/portal') || pathname?.startsWith('/join')) {
    return null;
  }

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && !openedOnce.current) {
      openedOnce.current = true;
      track('support_chat_opened', { page: pathname });
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: trimmed }]);
    setBusy(true);
    track('support_chat_message_sent', { page: pathname });
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: getChatId(), message: trimmed, page: pathname }),
      });
      const data = await res.json().catch(() => ({}));
      const reply: string = data.reply || `Something went wrong — email ${SUPPORT_EMAIL} and we'll help you out.`;
      setMessages((m) => [...m, { role: 'assistant', text: reply, messageId: data.messageId }]);
      track('support_chat_reply', { handoff: Boolean(data.handoff), page: pathname });
      if (data.handoff) track('support_chat_handoff', { page: pathname });
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: `Looks like I'm offline — email ${SUPPORT_EMAIL} and we'll get back to you.` }]);
    } finally {
      setBusy(false);
    }
  }

  async function sendFeedback(index: number, value: 'up' | 'down') {
    const msg = messages[index];
    if (!msg?.messageId || msg.feedback) return;
    setMessages((m) => m.map((x, i) => (i === index ? { ...x, feedback: value } : x)));
    track('support_chat_feedback', { value, page: pathname });
    try {
      await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: getChatId(), feedback: value, messageId: msg.messageId }),
      });
    } catch { /* best effort */ }
  }

  return (
    <>
      {open && (
        <div className={styles.panel} role="dialog" aria-label="QuoteMate support chat">
          <div className={styles.header}>
            <div>
              <div className={styles.headerTitle}>QuoteMate Support</div>
              <div className={styles.headerSub}>Ask anything about the app — replies in seconds</div>
            </div>
            <button className={styles.closeBtn} onClick={toggleOpen} aria-label="Close chat">×</button>
          </div>

          <div className={styles.messages} ref={scrollRef}>
            {messages.length === 0 && (
              <>
                <div className={`${styles.msg} ${styles.msgBot}`}>
                  G&rsquo;day! I&rsquo;m the QuoteMate assistant. Ask me about pricing, the free trial, payments, or how anything in the app works.
                </div>
                <div className={styles.starters}>
                  {STARTERS.map((q) => (
                    <button key={q} className={styles.starterBtn} onClick={() => send(q)}>{q}</button>
                  ))}
                </div>
              </>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'contents' }}>
                <div className={`${styles.msg} ${m.role === 'user' ? styles.msgUser : styles.msgBot}`}>{m.text}</div>
                {m.role === 'assistant' && m.messageId && (
                  <div className={styles.feedbackRow}>
                    <button
                      className={`${styles.feedbackBtn} ${m.feedback === 'up' ? styles.chosen : ''}`}
                      onClick={() => sendFeedback(i, 'up')}
                      aria-label="Helpful"
                      disabled={Boolean(m.feedback)}
                    >👍</button>
                    <button
                      className={`${styles.feedbackBtn} ${m.feedback === 'down' ? styles.chosen : ''}`}
                      onClick={() => sendFeedback(i, 'down')}
                      aria-label="Not helpful"
                      disabled={Boolean(m.feedback)}
                    >👎</button>
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className={styles.typing} aria-label="Assistant is typing">
                <span /><span /><span />
              </div>
            )}
          </div>

          <div className={styles.inputRow}>
            <textarea
              className={styles.input}
              value={input}
              rows={1}
              maxLength={1500}
              placeholder="Type your question…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
            />
            <button className={styles.sendBtn} onClick={() => void send(input)} disabled={busy || !input.trim()}>
              Send
            </button>
          </div>
          <div className={styles.disclaimer}>
            AI assistant — answers come from our help articles. For account issues email {SUPPORT_EMAIL}.
          </div>
        </div>
      )}

      <button className={styles.launcher} onClick={toggleOpen} aria-label={open ? 'Close support chat' : 'Open support chat'}>
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        )}
      </button>
    </>
  );
}
