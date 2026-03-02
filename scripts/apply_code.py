import os

dashboard_tsx_content = r'''/**
 * src/pages/Dashboard.tsx
 * GITHUB COMMENT:
 * [Dashboard.tsx]
 * FIX: Resolved "Hello Friend" bug (Sprint 2 - Ticket 2.2) by prioritizing userProfile.displayName.
 * FIX: Added 'refetchOnMount: "always"' to all queries.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc, 
  Timestamp,
  type Firestore 
} from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { 
  calculateJournalStats, 
  calculateTaskStats, 
  calculateWorkbookStats, 
  calculateVitalityStats,
  calculateUserLevel
} from '../lib/gamification';
import VibrantHeader from '../components/VibrantHeader';
import SobrietyHero from '../components/SobrietyHero';
import { 
  HomeIcon, 
  FireIcon, 
  ChartBarIcon, 
  SparklesIcon, 
  HeartIcon, 
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { THEME } from '../lib/theme';

const TOTAL_WORKBOOK_QUESTIONS = 45;

export default function Dashboard() {
  const { user } = useAuth();
  
  // --- QUERY 1: USER PROFILE ---
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.uid],
    queryFn: async () => {
        if (!user || !db) return null;
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        return snap.exists() ? snap.data() : null;
    },
    enabled: !!user,
    refetchOnMount: 'always', // FORCE REFRESH
  });

  // --- QUERY 2: JOURNALS ---
  const { data: journals = [], isLoading: journalLoading } = useQuery({
    queryKey: ['journals', user?.uid],
    queryFn: async () => {
        if (!user || !db) return [];
        const database: Firestore = db;
        const q = query(
            collection(database, 'journals'), 
            where('uid', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({
            ...d.data(),
            createdAt: d.data().createdAt
        }));
    },
    enabled: !!user,
    refetchOnMount: 'always', // FORCE REFRESH
  });

  // --- QUERY 3: TASKS ---
  const { data: tasks = [], isLoading: taskLoading } = useQuery({
    queryKey: ['tasks', user?.uid],
    queryFn: async () => {
        if (!user || !db) return [];
        const database: Firestore = db;
        const q = query(collection(database, 'tasks'), where('uid', '==', user.uid));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data());
    },
    enabled: !!user,
    refetchOnMount: 'always', // FORCE REFRESH
  });

  // --- QUERY 4: WORKBOOKS ---
  const { data: workbookCount = 0, isLoading: workbookLoading } = useQuery({
    queryKey: ['workbooks', user?.uid],
    queryFn: async () => {
        if (!user || !db) return 0;
        const database: Firestore = db;
        const q = query(collection(database, 'users', user.uid, 'workbook_answers'));
        const snap = await getDocs(q);
        return snap.size;
    },
    enabled: !!user,
    refetchOnMount: 'always', // FORCE REFRESH
  });

  // --- CALCULATE STATS ---
  const stats = useMemo(() => {
    if (journalLoading || taskLoading || workbookLoading || profileLoading) return null;

    // Sobriety date calculation
    let daysClean = 0;
    if (userProfile?.sobrietyDate) {
        const start = userProfile.sobrietyDate.toDate ? userProfile.sobrietyDate.toDate() : new Date(userProfile.sobrietyDate);
        const diffTime = Math.abs(new Date().getTime() - start.getTime());
        daysClean = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Gamification
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const jStats = calculateJournalStats(journals as any);
    const tStats = calculateTaskStats(tasks as any);
    const wStats = calculateWorkbookStats(workbookCount, TOTAL_WORKBOOK_QUESTIONS);
    const vStats = calculateVitalityStats(journals as any);
    const level = calculateUserLevel(journals as any, tasks as any, workbookCount, daysClean);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const lastExport = userProfile?.lastExportAt as Timestamp | undefined;
    
    // eslint-disable-next-line react-hooks/purity
    const nowMs = Date.now(); 
    const showBackup = !lastExport || lastExport.toMillis() < nowMs - (7 * 24 * 60 * 60 * 1000);

    return {
        journal: { streak: jStats.journalStreak, consistency: jStats.consistencyRate },
        task: { rate: tStats.completionRate, fire: tStats.habitFire },
        workbook: { wisdom: wStats.wisdomScore, completion: wStats.masterCompletion },
        vitality: { bioStreak: vStats.bioStreak, totalLogs: vStats.totalLogs },
        level,
        showBackup
    };
  }, [journals, tasks, workbookCount, userProfile, journalLoading, taskLoading, workbookLoading, profileLoading]);

  const loading = journalLoading || taskLoading || workbookLoading || profileLoading;

  if (loading || !stats) return <div className="p-8 text-center text-gray-500">Loading your recovery hub...</div>;

  // SRE FIX: Prefer the Database profile name over the Auth token name, fallback to Friend
  const firstName = (userProfile?.displayName || user?.displayName || 'Friend').split(' ')[0];

  return (
    <div className={`h-[100dvh] flex flex-col ${THEME.dashboard.page}`}>
      
      {/* 1. FIXED HEADER */}
      <div className="flex-shrink-0 z-10">
        <VibrantHeader 
            title="Dashboard" 
            subtitle={`Welcome back, ${firstName}`}
            icon={HomeIcon}
            fromColor={THEME.dashboard.header.from}
            viaColor={THEME.dashboard.header.via}
            toColor={THEME.dashboard.header.to}
        />
      </div>

      {/* 2. FLOATING HERO: Clean Time (Moved to Top) */}
      <div className="px-4 -mt-12 relative z-30 flex-shrink-0 animate-slideUp">
         <SobrietyHero date={userProfile?.sobrietyDate} />
      </div>

      {/* 3. SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24 space-y-6">
        
        {/* Backup Alert */}
        {stats.showBackup && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-full text-amber-700">
                <ArrowDownTrayIcon className="h-5 w-5" />
              </div>
              <div className="text-xs text-amber-900">
                <strong>Backup Needed:</strong> It's been a week since your last save.
              </div>
            </div>
            <Link to="/profile" className="text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700">Go</Link>
          </div>
        )}

        {/* 2x2 BENTO GRID */}
        <div className="grid grid-cols-2 gap-4">
            
            {/* 1. JOURNAL (Indigo/Violet) */}
            <Link to="/journal" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <ChartBarIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                            <ChartBarIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Journal</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-black">{stats.journal.streak}</div>
                        <div className="text-base font-bold opacity-80 uppercase tracking-wide">Days</div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
                        <span className="text-base font-bold opacity-75">Consistency</span>
                        <span className="text-base font-bold">{stats.journal.consistency}/wk</span>
                    </div>
                </div>
            </Link>

            {/* 2. HABITS (Cyan/Teal) */}
            <Link to="/tasks" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <FireIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                            <FireIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Quests</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-black">{stats.task.fire}</div>
                        <div className="text-base font-bold opacity-80 uppercase tracking-wide">Fire</div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
                        <span className="text-base font-bold opacity-75">Rate</span>
                        <span className="text-base font-bold">{stats.task.rate}%</span>
                    </div>
                </div>
            </Link>

            {/* 3. VITALITY (Orange/Rose) */}
            <Link to="/vitality" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-lg shadow-orange-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <HeartIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                            <HeartIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Vitality</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-black">{stats.vitality.bioStreak}</div>
                        <div className="text-base font-bold opacity-80 uppercase tracking-wide">Rhythm</div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
                        <span className="text-base font-bold opacity-75">Logs</span>
                        <span className="text-base font-bold">{stats.vitality.totalLogs}</span>
                    </div>
                </div>
            </Link>

            {/* 4. WISDOM (Emerald/Lime) */}
            <Link to="/workbooks" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-emerald-500 to-lime-600 text-white shadow-lg shadow-emerald-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <SparklesIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                            <SparklesIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Wisdom</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-black">{stats.workbook.completion}%</div>
                        <div className="text-base font-bold opacity-80 uppercase tracking-wide">Done</div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
                        <span className="text-base font-bold opacity-75">Score</span>
                        <span className="text-base font-bold">{stats.workbook.wisdom}</span>
                    </div>
                </div>
            </Link>

        </div>

        {/* 4. XP / RANK CARD (Moved to Bottom) */}
        {/* Glassmorphism Card with Theme Gradient Border */}
        <div className="relative rounded-3xl p-[2px] bg-gradient-to-br from-sky-300 via-blue-400 to-indigo-400 shadow-xl shadow-blue-200/50">
            <div className="bg-white rounded-[22px] p-5 relative overflow-hidden h-full">
                
                {/* Background Texture */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-100 to-blue-50 rounded-bl-full opacity-60 pointer-events-none"></div>
                <SparklesIcon className="absolute top-4 right-4 h-12 w-12 text-blue-100/50 rotate-12" />

                <div className="relative z-10 flex justify-between items-end">
                    
                    {/* LEFT: Identity */}
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">
                            Current Rank
                        </span>
                        <h3 className="text-2xl font-black text-slate-800 leading-none tracking-tight">
                            {stats.level.levelData.title}
                        </h3>
                        <div className="mt-2 inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg self-start">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Archetype</span>
                            <span className="text-xs font-bold text-indigo-600">{stats.level.archetype}</span>
                        </div>
                    </div>

                    {/* RIGHT: Level Stats */}
                    <div className="text-right">
                        <div className="flex items-baseline justify-end gap-1">
                            <span className="text-sm font-bold text-slate-400">LVL</span>
                            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-sky-600 to-indigo-600 shadow-sm">
                                {stats.level.levelData.level}
                            </span>
                        </div>
                    </div>
                </div>
            
                {/* Progress Bar */}
                <div className="mt-5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                        <span>Progress</span>
                        <span>{stats.level.levelData.currentXP} / {stats.level.levelData.nextLevelXP} XP</span>
                    </div>
                    <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                            className="h-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 transition-all duration-1000 ease-out relative"
                            style={{ width: `${stats.level.levelData.progressPercent}%` }}
                        >
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 bg-white/30 w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
}
'''

profile_tsx_content = r'''/**
 * src/pages/Profile.tsx
 * GITHUB COMMENT:
 * [Profile.tsx]
 * FEAT: Implemented Onboarding Release Valve logic (Sprint 1 - Ticket 1.3).
 * FIX: Synced Firebase Auth Profile on save to ensure sidebar reactivity (Ticket 2.2).
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, updateProfileData } from '../lib/db';
import { Timestamp } from 'firebase/firestore'; 
import { updateProfile } from 'firebase/auth'; // SRE FIX: Added for Reactivity
import VibrantHeader from '../components/VibrantHeader'; 
import DataManagement from '../components/profile/DataManagement';
import { 
  UserCircleIcon, 
  ArrowLeftOnRectangleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { THEME } from '../lib/theme';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const appVersion = import.meta.env.VITE_APP_VERSION || 'Dev-Local';
  
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
          }
        } else {
          // If no profile document, they are definitely onboarding
          setIsOnboarding(true);
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

      // SRE FIX: SYNC FIREBASE AUTH PROFILE FOR SIDEBAR REACTIVITY
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

      <div className="max-w-2xl mx-auto space-y-8 px-4 -mt-10 relative z-30">
        
        {isOnboarding && (
          <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg animate-slideDown">
              <h2 className="font-bold text-lg">Welcome to your Toolkit.</h2>
              <p className="text-sm text-blue-100 mt-1">To get started, please tell us your name and your sobriety date. This helps us calculate your milestones and dashboard stats.</p>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
                {isOnboarding ? 'Required Setup' : 'Settings'}
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

            {message && !isOnboarding && (
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

        {/* HIDE DATA MANAGEMENT DURING ONBOARDING TO PREVENT DISTRACTIONS */}
        {!isOnboarding && (
            <DataManagement />
        )}

        <div className="border-t border-gray-200 pt-6">
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
    # Use standard string replace for markdown protection protocol
    final_content = content.replace("~~~", "```").strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Updated: {path}")

if __name__ == "__main__":
    write_file("src/pages/Dashboard.tsx", dashboard_tsx_content)
    write_file("src/pages/Profile.tsx", profile_tsx_content)
    print("✨ Hello Friend bug fixed successfully.")