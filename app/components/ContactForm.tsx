'use client';

import { useState, FormEvent } from 'react';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '', website: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('success');
        setForm({ name: '', email: '', message: '', website: '' });
      } else {
        setStatus('error');
        setErrorMsg(result.error || 'An unexpected error occurred.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Failed to send message. Please try again later.');
    }
  }

  if (status === 'success') {
    return (
      <div className="signup-success">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
        <p>Thanks for reaching out! We&rsquo;ll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-row">
        <input
          type="text"
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          disabled={status === 'loading'}
          className="signup-input"
          aria-label="Your name"
        />
        <input
          type="email"
          placeholder="Your email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          disabled={status === 'loading'}
          className="signup-input"
          aria-label="Your email"
        />
      </div>
      <textarea
        placeholder="How can we help?"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        required
        disabled={status === 'loading'}
        className="signup-input contact-textarea"
        rows={4}
        aria-label="Your message"
      />
      {/* Honeypot */}
      <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input type="text" name="website" id="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} tabIndex={-1} autoComplete="off" />
      </div>
      <button type="submit" className="btn btn-primary signup-btn" disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending…' : 'Send Message'}
      </button>
      {status === 'error' && <p className="form-error">{errorMsg}</p>}
    </form>
  );
}
