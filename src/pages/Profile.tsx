import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getOrCreateUserProfile, updateSobrietyDate } from '../lib/db';
//import { Timestamp } from 'firebase/firestore';

export default function Profile() {
  const { user } = useAuth();
  const [dateStr, setDateStr] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Load existing date on mount
  useEffect(() => {
    async function loadData() {
      if (user) {
        try {
          const profile = await getOrCreateUserProfile(user);
          if (profile.sobrietyDate) {
            // Convert Timestamp to YYYY-MM-DD for input field
            const date = profile.sobrietyDate.toDate();
            setDateStr(date.toISOString().split('T')[0]);
          }
        } catch (error) {
          console.error("Error loading profile:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    loadData();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !dateStr) return;
    
    setLoading(true);
    try {
      // Create date object (append T12:00:00 to avoid timezone shifts)
      const dateObj = new Date(dateStr + 'T12:00:00'); 
      await updateSobrietyDate(user.uid, dateObj);
      setMessage('Sobriety date updated successfully!');
    } catch (error) {
      console.error("Error saving:", error);
      setMessage('Failed to save date.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-deep-charcoal mb-6">User Profile</h2>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input 
              type="text" 
              disabled 
              value={user?.email || ''} 
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sobriety Date
            </label>
            <p className="text-xs text-gray-500 mb-2">Used to calculate your clean time counter.</p>
            <input 
              type="date" 
              required
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2 border"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent bg-serene-teal py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
            {message && (
              <span className={`text-sm ${message.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                {message}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}