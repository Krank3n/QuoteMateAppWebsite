'use client';

import { useState, FormEvent } from 'react';

export default function EmailSignup() {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
        setErrorMsg(result.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Failed to subscribe. Please try again later.');
    }
  }

  if (status === 'success') {
    return (
      <div className="signup-success">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
        <p>You&rsquo;re on the list! We&rsquo;ll keep you posted.</p>
      </div>
    );
  }

  return (
    <form className="signup-form" onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={status === 'loading'}
        className="signup-input"
        aria-label="Email address"
      />
      {/* Honeypot */}
      <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }} aria-hidden="true">
        <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
      </div>
      <button type="submit" className="btn btn-primary signup-btn" disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending…' : 'Get Updates'}
      </button>
      {status === 'error' && <p className="form-error">{errorMsg}</p>}
    </form>
  );
}
