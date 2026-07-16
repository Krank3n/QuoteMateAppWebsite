'use client';

import { useState, FormEvent } from 'react';
import { submitWebsiteForm } from './formApi';

export default function EngEmailSignup() {
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
      const result = await submitWebsiteForm('websiteSubscribe', { email, website });

      if (result.ok) {
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
      <div className="eng-signup-success">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
        You&rsquo;re on the list! We&rsquo;ll keep you posted.
      </div>
    );
  }

  return (
    <form className="eng-signup-form" onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={status === 'loading'}
        className="eng-signup-input"
        aria-label="Email address"
      />
      {/* Honeypot */}
      <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }} aria-hidden="true">
        <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
      </div>
      <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending…' : 'Get Updates'}
      </button>
      {status === 'error' && <p className="eng-form-error">{errorMsg}</p>}
    </form>
  );
}
