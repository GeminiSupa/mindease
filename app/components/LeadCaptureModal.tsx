'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeadCaptureModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [contactMethod, setContactMethod] = useState('email');
  const [contactValue, setContactValue] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    queueMicrotask(() => {
      const hasCaptured = document.cookie.includes('lead_captured=true');
      setIsOpen(!hasCaptured);
    });
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
        setIsOpen(false);
        router.refresh(); // Refresh page to remove blur effect rendered by server
      }
    } catch {
      // Lead capture is non-critical; keep the modal open for another attempt.
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-300">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">Unlock Access</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
          Please enter your email or WhatsApp number to view our therapists and self-tests.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-4">
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                contactMethod === 'email'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              onClick={() => setContactMethod('email')}
            >
              Email
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                contactMethod === 'whatsapp'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              onClick={() => setContactMethod('whatsapp')}
            >
              WhatsApp
            </button>
          </div>

          <div>
            <label htmlFor="contactValue" className="sr-only">
              {contactMethod === 'email' ? 'Email Address' : 'WhatsApp Number'}
            </label>
            <input
              id="contactValue"
              type={contactMethod === 'email' ? 'email' : 'tel'}
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              placeholder={contactMethod === 'email' ? 'you@example.com' : '+1 234 567 890'}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Unlocking...' : 'View Content'}
          </button>
        </form>
      </div>
    </div>
  );
}
