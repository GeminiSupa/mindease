'use client';

import { useState } from 'react';

export default function TherapistDashboard() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    title: '',
    bio: '',
    specialization: '',
    sessionFee: 0,
    availabilityStatus: 'Available'
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Profile updated and submitted for admin review!');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Your Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Complete your profile to go live on the directory.</p>
          </div>
          <span className="px-4 py-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-sm font-bold shadow-sm border border-yellow-200 dark:border-yellow-800">
            Status: PENDING
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <form onSubmit={handleSave} className="p-8 space-y-8">
            
            {/* Image Upload Section */}
            <div>
              <label className="block text-lg font-bold text-gray-900 dark:text-white mb-4">Profile Image</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                  <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <label className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                    <span>Upload New Photo</span>
                    <input type="file" className="sr-only" accept="image/*" />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
                </div>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Profile Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Professional Title</label>
                <input type="text" value={profile.title} onChange={e => setProfile({...profile, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Clinical Psychologist" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Session Fee (PKR)</label>
                <input type="number" value={profile.sessionFee} onChange={e => setProfile({...profile, sessionFee: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="5000" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Specialization</label>
              <input type="text" value={profile.specialization} onChange={e => setProfile({...profile, specialization: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Anxiety, Depression, Trauma..." />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Bio</label>
              <textarea rows={5} value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Write a compelling bio for your clients..." />
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" disabled={loading} className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-transform transform hover:-translate-y-1 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Profile & Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
