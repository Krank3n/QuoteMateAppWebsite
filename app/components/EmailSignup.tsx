'use client';

import { useState, FormEvent } from 'react';

export default function EmailSignup() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    // TODO: Wire up to your email service (e.g. Mailchimp, ConvertKit, or a Firebase function)
    // For now, store in localStorage as a simple placeholder
    const existing = JSON.parse(localStorage.getItem('qm_signups') || '[]');
    existing.push({ email, date: new Date().toISOString() });
    localStorage.setItem('qm_signups', JSON.stringify(existing));
    setSubmitted(true);
  }

  if (submitted) {
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
        className="signup-input"
        aria-label="Email address"
      />
      <button type="submit" className="btn btn-primary signup-btn">Get Updates</button>
    </form>
  );
}
