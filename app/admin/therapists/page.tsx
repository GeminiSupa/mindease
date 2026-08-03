'use client';

import { useState } from 'react';

export default function AdminTherapistsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const pendingTherapists = [
    {
      id: '4',
      name: 'Dr. Robert King',
      email: 'robert.king@example.com',
      bio: 'Specialist in child psychology and family dynamics.',
      status: 'PENDING',
      submittedAt: '2 hours ago'
    },
    {
      id: '5',
      name: 'Sarah Williams, LMFT',
      email: 'sarah.w@example.com',
      bio: 'Experienced therapist focusing on trauma and PTSD.',
      status: 'PENDING',
      submittedAt: '5 hours ago'
    }
  ];

  const handleCreateTherapist = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setShowCreateModal(false);
      alert('Therapist created! They have been sent an email with login instructions.');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard - Therapists</h1>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors"
          >
            + Create Therapist
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Therapist Info</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bio Snippet</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submitted</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {pendingTherapists.map((therapist) => (
                <tr key={therapist.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{therapist.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{therapist.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="text-sm text-gray-900 dark:text-gray-300 line-clamp-2">{therapist.bio}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{therapist.submittedAt}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-4 font-bold">Approve</button>
                    <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-bold">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create New Therapist</h2>
            <form onSubmit={handleCreateTherapist} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
