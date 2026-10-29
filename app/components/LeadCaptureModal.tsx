'use client';

import { useState, useEffect } from 'react';

export default function LeadCaptureModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [contactMethod, setContactMethod] = useState<'email' | 'whatsapp'>('email');
  const [contactValue, setContactValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const hasCaptured = document.cookie.includes('lead_captured=true');
    if (!hasCaptured) {
      // Small delay so the page loads first and the blur is visible
      const timer = setTimeout(() => setIsOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactMethod, contactValue }),
      });
      if (res.ok) {
        setSubmitted(true);
        // Give user a moment to see the success, then close
        setTimeout(() => {
          setIsOpen(false);
          window.location.reload();
        }, 800);
      }
    } catch {
      // Silently fail — still close so user isn't stuck
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(16, 35, 60, 0.68)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow)',
          width: '100%',
          maxWidth: '440px',
          padding: '30px',
        }}
      >
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <p style={{ color: 'var(--teal-dark)', fontWeight: 900, fontSize: '1.1rem', margin: 0 }}>
              ✓ All done — loading content...
            </p>
          </div>
        ) : (
          <>
            <span className="eyebrow" style={{ display: 'block', marginBottom: '6px' }}>One quick step</span>
            <h2 style={{ color: 'var(--ink)', fontSize: '1.5rem', lineHeight: 1.2, marginBottom: '8px' }}>
              Unlock our therapist profiles & self-checks
            </h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.55, marginBottom: '22px', fontSize: '0.93rem' }}>
              Leave your email or WhatsApp so our care coordinator can follow up if you'd like a personal match.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setContactMethod('email')}
                style={{
                  flex: 1,
                  minHeight: '40px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: contactMethod === 'email' ? 'var(--teal)' : 'var(--line)',
                  background: contactMethod === 'email' ? 'var(--aqua)' : 'var(--white)',
                  color: contactMethod === 'email' ? 'var(--teal-dark)' : 'var(--muted)',
                  fontWeight: 850,
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                }}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setContactMethod('whatsapp')}
                style={{
                  flex: 1,
                  minHeight: '40px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: contactMethod === 'whatsapp' ? 'var(--teal)' : 'var(--line)',
                  background: contactMethod === 'whatsapp' ? 'var(--aqua)' : 'var(--white)',
                  color: contactMethod === 'whatsapp' ? 'var(--teal-dark)' : 'var(--muted)',
                  fontWeight: 850,
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                }}
              >
                WhatsApp
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
              <label>
                <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 850, color: '#334640', marginBottom: '6px' }}>
                  {contactMethod === 'email' ? 'Email address' : 'WhatsApp number'}
                </span>
                <input
                  type={contactMethod === 'email' ? 'email' : 'tel'}
                  value={contactValue}
                  onChange={e => setContactValue(e.target.value)}
                  placeholder={contactMethod === 'email' ? 'you@example.com' : '+92 300 1234567'}
                  required
                />
              </label>
              <button
                type="submit"
                className="primary-btn"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? 'Saving...' : 'View content'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
