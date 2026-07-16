'use client';

import { useState, FormEvent } from 'react';
import { submitWebsiteForm } from './formApi';

export default function EngContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '', website: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const result = await submitWebsiteForm('websiteContact', form);

      if (result.ok) {
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
      <div className="eng-signup-success">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
        Thanks for reaching out! We&rsquo;ll get back to you soon.
      </div>
    );
  }

  return (
    <form className="eng-contact-form" onSubmit={handleSubmit}>
      <div className="eng-contact-row">
        <input
          type="text"
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          disabled={status === 'loading'}
          className="eng-input"
          aria-label="Your name"
        />
        <input
          type="email"
          placeholder="Your email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          disabled={status === 'loading'}
          className="eng-input"
          aria-label="Your email"
        />
      </div>
      <textarea
        placeholder="How can we help?"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        required
        disabled={status === 'loading'}
        className="eng-input eng-textarea"
        rows={4}
        aria-label="Your message"
      />
      {/* Honeypot */}
      <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }} aria-hidden="true">
        <label htmlFor="eng-website">Website</label>
        <input type="text" name="website" id="eng-website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} tabIndex={-1} autoComplete="off" />
      </div>
      <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending…' : 'Send Message'}
      </button>
      {status === 'error' && <p className="eng-form-error">{errorMsg}</p>}
    </form>
  );
}
