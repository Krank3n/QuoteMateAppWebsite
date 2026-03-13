'use client';

import { useState, FormEvent } from 'react';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    // Opens the user's email client with pre-filled fields
    const subject = encodeURIComponent(`QuoteMate enquiry from ${form.name}`);
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
    window.location.href = `mailto:hello@quotemateapp.au?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="signup-success">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
        <p>Thanks! Your email client should have opened. If not, email us at hello@quotemateapp.au</p>
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
          className="signup-input"
          aria-label="Your name"
        />
        <input
          type="email"
          placeholder="Your email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="signup-input"
          aria-label="Your email"
        />
      </div>
      <textarea
        placeholder="How can we help?"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        required
        className="signup-input contact-textarea"
        rows={4}
        aria-label="Your message"
      />
      <button type="submit" className="btn btn-primary signup-btn">Send Message</button>
    </form>
  );
}
