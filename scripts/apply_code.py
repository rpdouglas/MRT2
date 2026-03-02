import os

profile_tsx_content = r'''/**
 * src/pages/Profile.tsx
 * GITHUB COMMENT:
 * [Profile.tsx]
 * FEAT: Split settings into General, Security, and Data tabs (Ticket 2.4).
 * UX: Added placeholder for upcoming PIN management flow.
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, updateProfileData } from '../lib/db';
import { Timestamp } from 'firebase/firestore'; 
import { updateProfile } from 'firebase/auth'; 
import VibrantHeader from '../components/VibrantHeader'; 
import DataManagement from '../components/profile/DataManagement';
import { 
  UserCircleIcon, 
  ArrowLeftOnRectangleIcon,
  UserGroupIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  CircleStackIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { THEME } from '../lib/theme';

type TabType = 'general' | 'security' | 'data';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const appVersion = import.meta.env.VITE_APP_VERSION || 'Dev-Local';
  
  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [sobrietyDate, setSobrietyDate] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorPhone, setSponsorPhone] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
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
          setSponsorName(data.sponsorName || '');
          setSponsorPhone(data.sponsorPhone || '');
          
          // DETECT ONBOARDING STATUS
          if (!data.hasCompletedOnboarding) {
              setIsOnboarding(true);
              setActiveTab('general'); // Force to general tab
          }
        } else {
          // If no profile document, they are definitely onboarding
          setIsOnboarding(true);
          setActiveTab('general');
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
      
      // ALWAYS SET ONBOARDING TO TRUE UPON SAVE
      await updateProfileData(user.uid, {
        displayName,
        sobrietyDate: sobrietyTimestamp,
        sponsorName,  
        sponsorPhone,
        hasCompletedOnboarding: true
      });

      // SYNC FIREBASE AUTH PROFILE FOR SIDEBAR REACTIVITY
      try {
          await updateProfile(user, { displayName });
      } catch (authErr) {
          console.warn("Failed to sync auth profile", authErr);
      }

      if (isOnboarding) {
          // THE RELEASE VALVE: Send them to the dashboard!
          navigate('/dashboard');
      } else {
          setMessage({ type: 'success', text: 'Profile updated successfully' });
      }
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

      <div className="max-w-2xl mx-auto space-y-6 px-4 -mt-10 relative z-30">
        
        {isOnboarding && (
          <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg animate-slideDown">
              <h2 className="font-bold text-lg">Welcome to your Toolkit.</h2>
              <p className="text-sm text-blue-100 mt-1">To get started, please tell us your name and your sobriety date. This helps us calculate your milestones and dashboard stats.</p>
          </div>
        )}

        {/* TAB NAVIGATION */}
        {!isOnboarding && (
            <div className="bg-white p-1.5 rounded-xl shadow-lg border border-gray-200 flex">
                <button 
                    onClick={() => { setActiveTab('general'); setMessage(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'general' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <IdentificationIcon className="h-4 w-4" /> General
                </button>
                <button 
                    onClick={() => { setActiveTab('security'); setMessage(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'security' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <ShieldCheckIcon className="h-4 w-4" /> Security
                </button>
                <button 
                    onClick={() => { setActiveTab('data'); setMessage(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'data' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <CircleStackIcon className="h-4 w-4" /> Data
                </button>
            </div>
        )}

        {/* TAB 1: GENERAL */}
        {activeTab === 'general' && (
            <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6 animate-fadeIn">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
                    {isOnboarding ? 'Required Setup' : 'Identity'}
                </h3>
                
                {/* PERSONAL INFO */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Display Name {isOnboarding && <span className="text-red-500">*</span>}</label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required={isOnboarding}
                        placeholder="How should we address you?"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Sobriety Date {isOnboarding && <span className="text-red-500">*</span>}</label>
                    <input
                        type="date"
                        value={sobrietyDate}
                        onChange={(e) => setSobrietyDate(e.target.value)}
                        required={isOnboarding}
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

                <div className="flex justify-end gap-3 pt-2">
                <button
                    type="submit"
                    disabled={saving || (isOnboarding && (!displayName || !sobrietyDate))}
                    className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md active:scale-95"
                >
                    {saving ? 'Saving...' : isOnboarding ? 'Complete Setup' : 'Save Changes'}
                </button>
                </div>
            </form>
        )}

        {/* TAB 2: SECURITY */}
        {activeTab === 'security' && !isOnboarding && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6 animate-fadeIn">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                    <ShieldCheckIcon className="h-5 w-5 text-slate-500" /> Security & PIN
                </h3>
                
                <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50 rounded-xl border border-dashed border-gray-300">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <LockClosedIcon className="h-8 w-8 text-slate-400" />
                    </div>
                    <h4 className="text-md font-bold text-slate-700">Vault Security Tools</h4>
                    <p className="text-sm text-slate-500 max-w-xs mt-2">PIN Management and vault rotation tools are currently being upgraded for enhanced security.</p>
                    <div className="mt-5 px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase rounded-full tracking-wider border border-purple-200">
                        Coming in v2.5
                    </div>
                </div>
            </div>
        )}

        {/* TAB 3: DATA MANAGEMENT */}
        {activeTab === 'data' && !isOnboarding && (
            <div className="animate-fadeIn">
                <DataManagement />
            </div>
        )}

        {/* LOGOUT BUTTON (Always visible at bottom) */}
        <div className="border-t border-gray-300 pt-6 mt-8">
            <button
              onClick={handleLogout}
              className="w-full flex justify-center items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl font-semibold hover:bg-red-100 transition-colors"
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
'''

def write_file(path, content):
    dirname = os.path.dirname(path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    # Ensure markdown backticks remain intact
    final_content = content.replace("~~~", "```").strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Updated UI: {path}")

if __name__ == "__main__":
    write_file("src/pages/Profile.tsx", profile_tsx_content)
    print("✨ Profile successfully split into tabbed architecture.")