/**
 * src/pages/Profile.tsx
 * GITHUB COMMENT:
 * [Profile.tsx]
 * UPDATED: Added Support Network configuration (Sponsor Name/Phone).
 * FEATURE: Saves contact info to Firestore for use in SOS Modal.
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, updateProfileData } from '../lib/db';
import { Timestamp } from 'firebase/firestore'; 
import VibrantHeader from '../components/VibrantHeader'; 
import DataManagement from '../components/profile/DataManagement';
import { 
  UserCircleIcon, 
  ArrowLeftOnRectangleIcon,
  UserGroupIcon // NEW
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { THEME } from '../lib/theme';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const appVersion = import.meta.env.VITE_APP_VERSION || 'Dev-Local';
  
  const [displayName, setDisplayName] = useState('');
  const [sobrietyDate, setSobrietyDate] = useState('');
  
  // NEW: Support Network State
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorPhone, setSponsorPhone] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        const data = await getProfile(user.uid);
        if (data) {
          setDisplayName(data.displayName || user.displayName || '');
          if (data.sobrietyDate) {
            setSobrietyDate(data.sobrietyDate.toDate().toISOString().split('T')[0]);
          }
          // Load Sponsor Data
          setSponsorName(data.sponsorName || '');
          setSponsorPhone(data.sponsorPhone || '');
        }
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      let sobrietyTimestamp: Timestamp | null = null;
      if (sobrietyDate) {
          const [y, m, d] = sobrietyDate.split('-').map(Number);
          const dateObj = new Date(y, m - 1, d);
          sobrietyTimestamp = Timestamp.fromDate(dateObj);
      }
      
      await updateProfileData(user.uid, {
        displayName,
        sobrietyDate: sobrietyTimestamp,
        sponsorName,  // Save new fields
        sponsorPhone
      });

      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

  return (
    <div className={`pb-24 min-h-screen ${THEME.profile.page}`}>
      
      <VibrantHeader 
        title="My Profile"
        subtitle={user?.email || ''}
        icon={UserCircleIcon}
        fromColor={THEME.profile.header.from}
        viaColor={THEME.profile.header.via}
        toColor={THEME.profile.header.to}
      />

      <div className="max-w-2xl mx-auto space-y-8 px-4 -mt-10 relative z-30">
        
        <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Settings</h3>
            
            {/* PERSONAL INFO */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Display Name</label>
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Sobriety Date</label>
                <input
                    type="date"
                    value={sobrietyDate}
                    onChange={(e) => setSobrietyDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
                <p className="mt-1 text-xs text-gray-500">Used to calculate your recovery stats on the dashboard.</p>
            </div>

            {/* SUPPORT NETWORK SECTION */}
            <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <UserGroupIcon className="h-4 w-4 text-emerald-600" /> Support Network
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Contact Name</label>
                        <input
                            type="text"
                            placeholder="Sponsor, Therapist, etc."
                            value={sponsorName}
                            onChange={(e) => setSponsorName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Phone Number</label>
                        <input
                            type="tel"
                            placeholder="+1 555-0199"
                            value={sponsorPhone}
                            onChange={(e) => setSponsorPhone(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                        />
                        <p className="mt-1 text-[10px] text-gray-400">Used for quick access in the SOS modal.</p>
                    </div>
                </div>
            </div>

            {message && (
            <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
            </div>
            )}

            <div className="flex justify-end gap-3">
            <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
                {saving ? 'Saving...' : 'Save Changes'}
            </button>
            </div>
        </form>

        <DataManagement />

        <div className="border-t border-gray-200 pt-6">
            <button
            onClick={handleLogout}
            className="w-full flex justify-center items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg font-semibold hover:bg-red-100 transition-colors"
            >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            Log Out
            </button>
        </div>

        <div className="text-center text-xs text-gray-400 font-mono">
            App Version: v{appVersion}
        </div>
      </div>
    </div>
  );
}