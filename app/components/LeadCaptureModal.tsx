'use client';

import { useState, useEffect } from 'react';

type LeadCaptureModalProps = {
  source?: string;
};

export default function LeadCaptureModal({ source = 'directory_gate' }: LeadCaptureModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [contactMethod, setContactMethod] = useState<'email' | 'whatsapp'>('email');
  const [contactValue, setContactValue] = useState('');
  const [confirmContactValue, setConfirmContactValue] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    void fetch('/api/leads', { cache: 'no-store' })
      .then((response) => response.json())
      .then((body) => { if (!body?.captured) timer = setTimeout(() => setIsOpen(true), 450); })
      .catch(() => { timer = setTimeout(() => setIsOpen(true), 450); });
    return () => { if (timer) clearTimeout(timer); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (contactValue.trim() !== confirmContactValue.trim()) {
      setError(`${contactMethod === 'email' ? 'Email addresses' : 'WhatsApp numbers'} do not match.`);
      return;
    }
    if (!consentAccepted) {
      setError('Please confirm that we may store these details and contact you.');
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactMethod,
          contactValue,
          name,
          city,
          consentAccepted,
          source,
          pageUrl: window.location.href,
          landingPage: `${window.location.pathname}${window.location.search}`,
          referrer: document.referrer,
          utmSource: params.get('utm_source') ?? '',
          utmMedium: params.get('utm_medium') ?? '',
          utmCampaign: params.get('utm_campaign') ?? '',
          utmContent: params.get('utm_content') ?? '',
          utmTerm: params.get('utm_term') ?? '',
          browserLanguage: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          deviceType: window.matchMedia('(max-width: 620px)').matches ? 'mobile' : window.matchMedia('(max-width: 1024px)').matches ? 'tablet' : 'desktop',
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setSubmitted(true);
        // Give user a moment to see the success, then close
        setTimeout(() => {
          setIsOpen(false);
          window.location.reload();
        }, 800);
      } else {
        setError(body?.error ?? 'Could not save your details. Please check them and try again.');
      }
    } catch {
      setError('Could not connect. Please try again.');
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
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '24px',
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
              Continue to the self-checks
            </h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.55, marginBottom: '22px', fontSize: '0.93rem' }}>
              Enter a working email or WhatsApp number. We&apos;ll use it only for care matching and service follow-up—not to store your self-check answers.
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

            <form className="lead-capture-form" onSubmit={handleSubmit}>
              <label>
                <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 850, color: '#334640', marginBottom: '6px' }}>Name <small>(optional)</small></span>
                <input autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              </label>
              <label>
                <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 850, color: '#334640', marginBottom: '6px' }}>City</span>
                <input autoComplete="address-level2" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Lahore" required />
              </label>
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
              <label>
                <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 850, color: '#334640', marginBottom: '6px' }}>
                  Confirm {contactMethod === 'email' ? 'email address' : 'WhatsApp number'}
                </span>
                <input
                  type={contactMethod === 'email' ? 'email' : 'tel'}
                  value={confirmContactValue}
                  onChange={e => setConfirmContactValue(e.target.value)}
                  placeholder={contactMethod === 'email' ? 'you@example.com' : '+92 300 1234567'}
                  required
                />
              </label>
              <label className="lead-consent" style={{ alignItems: 'flex-start', display: 'flex', gap: '9px', color: 'var(--muted)', fontSize: '.78rem', lineHeight: 1.45 }}>
                <input checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)} required style={{ marginTop: '2px', width: 'auto' }} type="checkbox" />
                <span>I agree that MindEase may store my contact details, city, coarse location and visit source to contact me about therapist matching and improve its service. My self-check answers are not collected.</span>
              </label>
              {error ? <p className="admin-error lead-form-wide" role="alert" style={{ margin: 0 }}>{error}</p> : null}
              <button
                type="submit"
                className="primary-btn"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', gridColumn: '1 / -1' }}
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
