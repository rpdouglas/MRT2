import os

FENCE = chr(96) * 3

FILES = {
    "src/lib/db.ts": r"""/**
 * src/lib/db.ts
 * UPDATED: Replaced dailySubstanceCost with flexible substanceCost and costFrequency.
 */
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp, 
  type Firestore, 
  type QueryDocumentSnapshot, 
  type DocumentData, 
  type WithFieldValue
} from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";
import type { RecurrenceConfig } from "./dateUtils";

export const createConverter = <T extends object>() => ({
  toFirestore(data: WithFieldValue<T>): DocumentData {
    return data;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): T {
    const data = snapshot.data();
    const converted = Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        if (value instanceof Timestamp) {
          return [key, value.toDate()];
        }
        return [key, value];
      })
    );
    return { id: snapshot.id, ...converted } as T;
  },
});

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  sobrietyDate: Timestamp | null;
  createdAt: Timestamp;
  lastLogin?: Timestamp;
  lastExportAt?: Timestamp; 
  role?: 'admin' | 'user';
  sponsorName?: string;
  sponsorPhone?: string;
  hasCompletedOnboarding?: boolean;
  usage_limits?: {
    lastWeeklyInsight?: Timestamp;
    lastMonthlyInsight?: Timestamp;
    lastDeepDive?: Timestamp;
  };
  tier?: 'free' | 'premium';
  tierSource?: 'stripe' | 'manual';
  stripeCustomerId?: string;
  subscriptionStatus?: 'active' | 'past_due' | 'canceled';
  subscriptionPeriodEnd?: Timestamp;
  // Financial Freedom Fields (PROJ-10 Refactor)
  substanceCost?: number;
  costFrequency?: 'daily' | 'weekly' | 'monthly';
  currencySymbol?: string;
}

export interface JournalTemplate {
  id: string;
  name: string;
  prompts: string[]; 
  defaultTags: string[]; 
}

export interface JournalEntry {
  id?: string;
  uid: string;
  content: string;
  moodScore: number;
  tags: string[];
  createdAt: Timestamp;
  isEncrypted?: boolean;
  weather?: {
    temp: number;
    condition: string;
    location?: string;
  } | null;
}

export type TaskCategory = 'Recovery' | 'Health' | 'Life' | 'Work';
export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface Task {
  id?: string;
  uid: string;
  title: string;
  completed: boolean; 
  status?: 'pending' | 'completed';
  isRecurring: boolean;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  currentStreak: number;
  priority: TaskPriority;
  category?: TaskCategory;
  recurrence?: RecurrenceConfig;
  createdAt: Timestamp | Date;
  dueDate?: Timestamp | Date;
  lastCompletedAt?: Timestamp | Date | null; 
  source?: 'manual' | 'ai'; 
}

export interface WorkbookAnswer {
  uid: string;
  workbookId: string;
  sectionId: string;
  questionId: string;
  answer: string; 
  isEncrypted: boolean;
  updatedAt: Timestamp | Date;
}

export async function getProfile(uid: string): Promise<UserProfile | null> {
  if (!db) throw new Error("Database not initialized");
  const database: Firestore = db;
  
  const userRef = doc(database, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  return null;
}

export async function getOrCreateUserProfile(user: User): Promise<UserProfile> {
  if (!db) throw new Error("Database not initialized");
  const database: Firestore = db;

  const userRef = doc(database, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    await updateDoc(userRef, { lastLogin: Timestamp.now() });
    return userSnap.data() as UserProfile;
  } else {
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      sobrietyDate: null, 
      createdAt: Timestamp.now(),
      lastLogin: Timestamp.now(),
      role: 'user',
      hasCompletedOnboarding: false,
      tier: 'free'
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  }
}

export async function updateProfileData(uid: string, data: Partial<UserProfile>) {
  if (!db) throw new Error("Database not initialized");
  const database: Firestore = db;

  const userRef = doc(database, "users", uid);
  await setDoc(userRef, { ...data }, { merge: true });
}

export async function updateSobrietyDate(uid: string, date: Date) {
  if (!db) throw new Error("Database not initialized");
  const database: Firestore = db;
  
  const userRef = doc(database, "users", uid);
  await updateDoc(userRef, {
    sobrietyDate: Timestamp.fromDate(date)
  });
}

export async function getUserTemplates(uid: string): Promise<JournalTemplate[]> {
  if (!db) throw new Error("Database not initialized");
  const database: Firestore = db;

  const templatesRef = collection(database, 'users', uid, 'templates');
  const snapshot = await getDocs(templatesRef);

  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  } as JournalTemplate));
}

export async function saveUserTemplate(uid: string, template: JournalTemplate) {
  if (!db) throw new Error("Database not initialized");
  const database: Firestore = db;

  const docRef = template.id 
    ? doc(database, 'users', uid, 'templates', template.id)
    : doc(collection(database, 'users', uid, 'templates'));

  const dataToSave = {
    ...template,
    id: docRef.id 
  };

  await setDoc(docRef, dataToSave);
}

export async function deleteUserTemplate(uid: string, templateId: string) {
  if (!db) throw new Error("Database not initialized");
  const database: Firestore = db;

  const docRef = doc(database, 'users', uid, 'templates', templateId);
  await deleteDoc(docRef);
}

export const addJournalEntry = async (uid: string, entry: Omit<JournalEntry, 'uid' | 'createdAt'>) => {
  if (!db) throw new Error("Database not initialized");
  const database: Firestore = db;
  
  await addDoc(collection(database, 'journals'), {
    uid,
    ...entry,
    createdAt: Timestamp.now(),
  });
};

export const getJournalHistory = async (uid: string) => {
  if (!db) throw new Error("Database not initialized");
  const database: Firestore = db;

  const q = query(
    collection(database, 'journals'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as JournalEntry));
};

export interface FullUserData {
  profile: UserProfile | null;
  journals: JournalEntry[];
  tasks: Task[];
  templates: JournalTemplate[];
  workbookAnswers: Record<string, unknown>[];
}

export async function fetchAllUserData(uid: string): Promise<FullUserData> {
  if (!db) throw new Error("Database not initialized");
  const database: Firestore = db;

  const profile = await getProfile(uid);

  const journalsQ = query(collection(database, 'journals'), where('uid', '==', uid), orderBy('createdAt', 'desc'));
  const journalsSnap = await getDocs(journalsQ);
  const journals = journalsSnap.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry));

  const tasksQ = query(collection(database, 'tasks'), where('uid', '==', uid));
  const tasksSnap = await getDocs(tasksQ);
  const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task));

  const templates = await getUserTemplates(uid);

  const wbQ = query(collection(database, 'users', uid, 'workbook_answers'));
  const wbSnap = await getDocs(wbQ);
  const workbookAnswers = wbSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  return {
    profile,
    journals,
    tasks,
    templates,
    workbookAnswers
  };
}
""",

    "src/pages/Dashboard.tsx": r"""import { useMemo, useState } from 'react';
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
  ArrowDownTrayIcon,
  UserGroupIcon,
  PuzzlePieceIcon
} from '@heroicons/react/24/outline';
import { THEME } from '../lib/theme';
import { RECOVERY_SLOGANS } from '../data/slogans';
import type { UserProfile } from '../lib/db';

const TOTAL_WORKBOOK_QUESTIONS = 45;

export default function Dashboard() {
  const { user } = useAuth();
  
  const [slogan] = useState(() => {
      const randomIndex = Math.floor(Math.random() * RECOVERY_SLOGANS.length);
      return RECOVERY_SLOGANS[randomIndex];
  });

  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.uid],
    queryFn: async () => {
        if (!user || !db) return null;
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        return snap.exists() ? snap.data() : null;
    },
    enabled: !!user,
    refetchOnMount: 'always', 
  });

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
    refetchOnMount: 'always', 
  });

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
    refetchOnMount: 'always', 
  });

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
    refetchOnMount: 'always', 
  });

  const stats = useMemo(() => {
    if (journalLoading || taskLoading || workbookLoading || profileLoading) return null;

    let daysClean = 0;
    if (userProfile?.sobrietyDate) {
        // Safe check for Timestamp vs Date object
        const start = userProfile.sobrietyDate.toDate ? userProfile.sobrietyDate.toDate() : new Date(userProfile.sobrietyDate as unknown as string);
        const diffTime = Math.abs(new Date().getTime() - start.getTime());
        daysClean = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

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
        showBackup,
        daysClean
    };
  }, [journals, tasks, workbookCount, userProfile, journalLoading, taskLoading, workbookLoading, profileLoading]);

  const loading = journalLoading || taskLoading || workbookLoading || profileLoading;

  if (loading || !stats) return <div className="p-8 text-center text-gray-500">Loading your recovery hub...</div>;

  return (
    <div className={`h-[100dvh] flex flex-col ${THEME.dashboard.page}`}>
      
      {/* 1. FIXED HEADER */}
      <div className="flex-shrink-0 z-10">
        <VibrantHeader 
            title="Dashboard" 
            subtitle={slogan}
            icon={HomeIcon}
            fromColor={THEME.dashboard.header.from}
            viaColor={THEME.dashboard.header.via}
            toColor={THEME.dashboard.header.to}
        />
      </div>

      {/* 2. FLOATING HERO */}
      <div className="px-4 -mt-12 relative z-30 flex-shrink-0 animate-slideUp">
         <SobrietyHero 
            date={userProfile?.sobrietyDate} 
            levelData={stats.level.levelData}
            archetype={stats.level.archetype}
            userProfile={userProfile as UserProfile}
         />
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

        {/* 6-TILE BENTO GRID */}
        <div className="grid grid-cols-2 gap-4">
            
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

            <Link to="/tasks" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-200 transition-transform active:scale-95 hover:shadow-xl">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2">
                    <FireIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                            <FireIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Habits</span>
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

            <div className="relative overflow-hidden rounded-2xl px-5 py-4 bg-slate-200 text-slate-400 border border-slate-300 opacity-60 cursor-not-allowed">
                <div className="absolute right-0 top-0 p-3 opacity-10 transform translate-x-2 -translate-y-2">
                    <UserGroupIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-slate-300/50 rounded-lg">
                            <UserGroupIcon className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider">Service</span>
                    </div>
                    <div className="text-xs font-bold mt-3 mb-1 uppercase tracking-wider text-slate-500">
                        Coming Soon
                    </div>
                    <p className="text-[10px] leading-tight pr-2">Encrypted sponsee management.</p>
                </div>
            </div>

            <Link to="/tools/urge-surfer" className="relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-br from-blue-500 to-sky-600 text-white shadow-lg shadow-blue-200 transition-transform active:scale-95 hover:shadow-xl group">
                <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2 group-hover:rotate-12 transition-transform">
                    <PuzzlePieceIcon className="h-16 w-16 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                            <PuzzlePieceIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Tools</span>
                    </div>
                    <div className="text-xs font-bold mt-3 mb-1 uppercase tracking-wider text-sky-100 flex items-center gap-1">
                        <SparklesIcon className="h-3 w-3" /> Active
                    </div>
                    <p className="text-[10px] leading-tight pr-2 font-medium text-sky-50">Urge Surfing & Grounding</p>
                </div>
            </Link>

        </div>

      </div>
    </div>
  );
}
""",

    "src/components/SobrietyHero.tsx": r"""import { useMemo, useRef } from 'react';
import { Timestamp } from 'firebase/firestore';
import { CalendarDaysIcon, ShareIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { calculateSobrietyDuration } from '../lib/dateUtils';
import { toPng } from 'html-to-image';
import type { UserProfile } from '../lib/db';
import { Link } from 'react-router-dom';

interface SobrietyHeroProps {
    date?: Timestamp | Date | null;
    levelData?: {
        level: number;
        currentXP: number;
        nextLevelXP: number;
        progressPercent: number;
    };
    archetype?: string;
    userProfile?: UserProfile | null;
}

export default function SobrietyHero({ date, levelData, archetype, userProfile }: SobrietyHeroProps) {
    const heroRef = useRef<HTMLDivElement>(null);

    // Calculate Time Stats
    const stats = useMemo(() => {
        if (!date) return null;
        const startDate = date instanceof Date ? date : date.toDate();
        return calculateSobrietyDuration(startDate);
    }, [date]);

    // Calculate Financial Savings
    const totalSaved = useMemo(() => {
        if (!userProfile?.substanceCost || !stats) return null;
        const cost = userProfile.substanceCost;
        let dailyCost = cost;
        if (userProfile.costFrequency === 'weekly') dailyCost = cost / 7;
        if (userProfile.costFrequency === 'monthly') dailyCost = cost / 30.44; 

        return dailyCost * stats.totalDays;
    }, [userProfile, stats]);

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!heroRef.current) return;
        try {
            const dataUrl = await toPng(heroRef.current, { cacheBust: true, pixelRatio: 2 });
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], 'mrt-milestone.png', { type: 'image/png' });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'My Recovery Milestone',
                    text: 'Tracking my journey with My Recovery Toolkit. 🛡️',
                    files: [file]
                });
            } else {
                const link = document.createElement('a');
                link.download = 'mrt-milestone.png';
                link.href = dataUrl;
                link.click();
            }
        } catch (err) {
            console.error('Failed to share image', err);
        }
    };

    if (!stats) {
        return (
            <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 rounded-3xl p-4 text-center text-white shadow-xl shadow-orange-500/20 border border-white/20">
                <div className="opacity-90 mb-1.5 font-bold uppercase tracking-widest text-xs drop-shadow-sm">Begin the Journey</div>
                <p className="text-sm font-medium drop-shadow-sm">Set your sobriety date in Profile to track your freedom.</p>
            </div>
        );
    }

    return (
        <div ref={heroRef} className="bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 rounded-3xl p-4 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group border border-white/20 w-full">
            {/* Share Button */}
            <button
                onClick={handleShare}
                className="absolute top-3 right-3 z-20 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                title="Share Milestone"
            >
                <ShareIcon className="h-4 w-4 text-white" />
            </button>

            {/* Dynamic Background Texture */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            {/* Decorative Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-300 opacity-20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                
                {/* Main Counters */}
                <div className="grid grid-cols-3 gap-1 text-center divide-x divide-white/30">
                    <div className="px-1">
                        <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md leading-none">{stats.years}</div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase opacity-90 mt-0.5 drop-shadow-sm">Years</div>
                    </div>
                    <div className="px-1">
                        <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md leading-none">{stats.months}</div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase opacity-90 mt-0.5 drop-shadow-sm">Months</div>
                    </div>
                    <div className="px-1">
                        <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md leading-none">{stats.days}</div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase opacity-90 mt-0.5 drop-shadow-sm">Days</div>
                    </div>
                </div>

                {/* Unified Footer */}
                {levelData && archetype && (
                    <div className="mt-3 pt-3 border-t border-white/20 space-y-2.5">
                        
                        {/* Gamification Stats */}
                        <div className="flex justify-between items-end text-xs sm:text-sm font-bold uppercase tracking-widest drop-shadow-sm opacity-95 gap-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                                <span className="truncate">Rank: {archetype}</span>
                                <span className="opacity-50">|</span>
                                <span>LVL: {levelData.level}</span>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="hidden sm:inline opacity-80 mr-1.5">Progress</span>
                                <span className="font-mono tracking-normal">{levelData.currentXP.toLocaleString()} / {levelData.nextLevelXP.toLocaleString()} XP</span>
                            </div>
                        </div>
                            
                        {/* Shimmer Progress Bar */}
                        <div className="relative h-2 w-full bg-black/20 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className="h-full bg-white transition-all duration-1000 ease-out relative"
                                style={{ width: `${levelData.progressPercent}%` }}
                            >
                                <div className="absolute inset-0 bg-white/50 w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>

                        {/* Metrics Row (Days & Financial) */}
                        <div className="pt-1 flex items-center justify-between text-xs sm:text-sm font-medium drop-shadow-sm opacity-90">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <CalendarDaysIcon className="h-4 w-4" />
                                <span>Total Days: <span className="font-mono font-bold text-white ml-1">{stats.totalDays.toLocaleString()}</span></span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                {totalSaved !== null ? (
                                    <>
                                       <BanknotesIcon className="h-4 w-4" />
                                       <span>Saved: <span className="font-mono font-bold text-emerald-100 ml-1">{userProfile?.currencySymbol || '$'}{totalSaved.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span></span>
                                    </>
                                ) : (
                                    <Link to="/profile" className="text-white hover:text-emerald-100 flex items-center gap-1 transition-colors underline decoration-white/50 underline-offset-2">
                                        <BanknotesIcon className="h-4 w-4" /> Setup Financial Freedom
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
""",

    "src/pages/Profile.tsx": r"""import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEncryption } from '../contexts/EncryptionContext';
import { getProfile, updateProfileData } from '../lib/db';
import { Timestamp } from 'firebase/firestore'; 
import { updateProfile } from 'firebase/auth'; 
import VibrantHeader from '../components/VibrantHeader'; 
import DataManagement from '../components/profile/DataManagement';
import { 
  UserCircleIcon, 
  UserGroupIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  CircleStackIcon,
  KeyIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BanknotesIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import { BookOpenIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { THEME } from '../lib/theme';

type TabType = 'general' | 'security' | 'data';

export default function Profile() {
  const { user, logout } = useAuth();
  const { changePin, resetVault } = useEncryption();
  const navigate = useNavigate();
  
  const appVersion = import.meta.env.VITE_APP_VERSION || 'Dev-Local';
  
  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Form State (General)
  const [displayName, setDisplayName] = useState('');
  const [sobrietyDate, setSobrietyDate] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorPhone, setSponsorPhone] = useState('');
  
  // Form State (Financial)
  const [substanceCost, setSubstanceCost] = useState('');
  const [costFrequency, setCostFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [currencySymbol, setCurrencySymbol] = useState('$');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Security State
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [rotProgress, setRotProgress] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [rotError, setRotError] = useState<string | null>(null);
  const [rotSuccess, setRotSuccess] = useState(false);

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
          
          setSubstanceCost(data.substanceCost ? data.substanceCost.toString() : '');
          setCostFrequency(data.costFrequency || 'daily');
          setCurrencySymbol(data.currencySymbol || '$');
          
          if (!data.hasCompletedOnboarding) {
              setIsOnboarding(true);
              setActiveTab('general'); 
          }
        } else {
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
      
      await updateProfileData(user.uid, {
        displayName,
        sobrietyDate: sobrietyTimestamp,
        sponsorName,  
        sponsorPhone,
        substanceCost: substanceCost ? parseFloat(substanceCost) : 0,
        costFrequency,
        currencySymbol,
        hasCompletedOnboarding: true
      });

      try {
          await updateProfile(user, { displayName });
      } catch (authErr) {
          console.warn("Failed to sync auth profile", authErr);
      }

      if (isOnboarding) {
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

  const handleRotation = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!oldPin || !newPin || !confirmPin) return;
      if (newPin !== confirmPin) return setRotError("New PINs do not match.");
      if (newPin.length < 4) return setRotError("PIN must be at least 4 digits.");
      if (oldPin === newPin) return setRotError("New PIN must be different than your old PIN.");

      setIsRotating(true);
      setRotError(null);
      setRotSuccess(false);
      setRotProgress(0);

      try {
          await changePin(oldPin, newPin, setRotProgress);
          setRotSuccess(true);
          setOldPin('');
          setNewPin('');
          setConfirmPin('');
      } catch (err: unknown) {
          const error = err as Error;
          if (error.message === 'INCORRECT_PIN') {
              setRotError("Current PIN is incorrect.");
          } else {
              setRotError("An error occurred during rotation. State rolled back securely.");
              console.error(error);
          }
      } finally {
          setIsRotating(false);
      }
  };

  const handleHardReset = async () => {
      const confirmText = prompt("CRITICAL WARNING: This permanently deletes ALL encrypted journals and workbooks. They cannot be recovered.\n\nType RESET to confirm.");
      if (confirmText !== "RESET") return;

      setIsRotating(true);
      try {
          await resetVault();
          alert("Vault has been permanently destroyed. You may now generate a new one.");
          window.location.reload();
      } catch (e) {
          console.error("Hard reset failed", e);
          alert("Reset failed. Check connection.");
          setIsRotating(false);
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
                    onClick={() => { setActiveTab('security'); setMessage(null); setRotError(null); setRotSuccess(false); }}
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
            <div className="space-y-6 animate-fadeIn">
                <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
                        {isOnboarding ? 'Required Setup' : 'Identity'}
                    </h3>
                    
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

                    {/* Financial Freedom Settings (PROJ-10 Refactor) */}
                    <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <BanknotesIcon className="h-4 w-4 text-emerald-600" /> Financial Freedom Tracker
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Currency</label>
                                <input 
                                    type="text" 
                                    value={currencySymbol} 
                                    onChange={e => setCurrencySymbol(e.target.value)} 
                                    maxLength={3} 
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" 
                                    placeholder="$" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Usage Cost</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    min="0"
                                    value={substanceCost} 
                                    onChange={e => setSubstanceCost(e.target.value)} 
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" 
                                    placeholder="e.g. 15.00" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Frequency</label>
                                <select 
                                    value={costFrequency} 
                                    onChange={e => setCostFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')} 
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        </div>
                        <p className="mt-2 text-[10px] text-gray-400">Track how much money you save by staying clean on your dashboard.</p>
                    </div>

                    {/* Support Network */}
                    <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <UserGroupIcon className="h-4 w-4 text-purple-600" /> Support Network
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Contact Name</label>
                                <input
                                    type="text"
                                    placeholder="Sponsor, Therapist, etc."
                                    value={sponsorName}
                                    onChange={(e) => setSponsorName(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Phone Number</label>
                                <input
                                    type="tel"
                                    placeholder="+1 555-0199"
                                    value={sponsorPhone}
                                    onChange={(e) => setSponsorPhone(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
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

                {!isOnboarding && (
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <BookOpenIcon className="h-7 w-7" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">New to MRT?</h3>
                                <p className="text-blue-100 text-sm">Explore our visual guide to master your recovery tools.</p>
                            </div>
                        </div>
                        <a 
                            href="https://rpdouglas.github.io/MRT2/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-center w-full py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors active:scale-95 shadow-md"
                        >
                            View User Guide
                        </a>
                    </div>
                )}
            </div>
        )}

        {/* TAB 2: SECURITY */}
        {activeTab === 'security' && !isOnboarding && (
            <div className="space-y-6 animate-fadeIn">
                
                {/* Change PIN Block */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2 mb-5">
                        <KeyIcon className="h-5 w-5 text-blue-600" /> Change Vault PIN
                    </h3>

                    {rotSuccess && (
                        <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl text-sm font-bold border border-green-100 flex items-start gap-3 animate-fadeIn">
                            <CheckCircleIcon className="h-5 w-5 shrink-0" />
                            PIN changed successfully. All data securely re-encrypted.
                        </div>
                    )}

                    {rotError && (
                        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 flex items-start gap-3 animate-fadeIn">
                            <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
                            {rotError}
                        </div>
                    )}

                    <form onSubmit={handleRotation} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Current PIN</label>
                            <input
                                type="password"
                                inputMode="numeric"
                                value={oldPin}
                                onChange={(e) => setOldPin(e.target.value)}
                                disabled={isRotating}
                                className="w-full text-center text-xl tracking-widest p-3 rounded-xl border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">New PIN</label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    value={newPin}
                                    onChange={(e) => setNewPin(e.target.value)}
                                    disabled={isRotating}
                                    className="w-full text-center text-xl tracking-widest p-3 rounded-xl border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Confirm New</label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    value={confirmPin}
                                    onChange={(e) => setConfirmPin(e.target.value)}
                                    disabled={isRotating}
                                    className="w-full text-center text-xl tracking-widest p-3 rounded-xl border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                                    required
                                />
                            </div>
                        </div>

                        {isRotating && (
                            <div className="pt-2 animate-fadeIn">
                                <div className="flex justify-between text-xs font-bold text-blue-600 mb-1">
                                    <span>Re-encrypting Vault...</span>
                                    <span>{rotProgress}%</span>
                                </div>
                                <div className="w-full bg-blue-100 rounded-full h-2.5 overflow-hidden">
                                    <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${rotProgress}%` }}></div>
                                </div>
                                <p className="text-[10px] text-red-500 mt-2 text-center uppercase tracking-widest font-bold animate-pulse">
                                    Do not close the application!
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isRotating || !oldPin || !newPin || !confirmPin}
                            className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md mt-2"
                        >
                            {isRotating ? 'Rotating Keys...' : 'Change PIN'}
                        </button>
                    </form>
                </div>

                {/* Crypto-Shredding Block */}
                <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                    <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                        <TrashIcon className="h-5 w-5" /> Danger Zone: Reset Vault
                    </h3>
                    <p className="text-sm text-red-800 mb-4 leading-relaxed">
                        If you forgot your PIN or want to start fresh, you can permanently wipe your vault. <strong>This instantly destroys all encrypted journals and workbooks.</strong>
                    </p>
                    <button
                        onClick={handleHardReset}
                        disabled={isRotating}
                        className="w-full sm:w-auto px-6 py-3 bg-white text-red-600 border-2 border-red-200 font-bold rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Destroy & Reset Vault
                    </button>
                </div>

            </div>
        )}

        {/* TAB 3: DATA MANAGEMENT */}
        {activeTab === 'data' && !isOnboarding && (
            <DataManagement />
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
"""
}

def apply_fixes():
    # Ensure script is run from project root
    if not os.path.exists("package.json"):
        print("⚠️  Warning: Make sure you are running this from the project root directory.")
        
    for filepath, raw_content in FILES.items():
        content = raw_content.replace('__FENCE__', FENCE)
        
        dir_path = os.path.dirname(filepath)
        if dir_path:
            os.makedirs(dir_path, exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Surgically patched: {filepath}")
        
    # Clean up the orphaned standalone file
    orphan_file = "src/components/dashboard/FinancialHero.tsx"
    if os.path.exists(orphan_file):
        os.remove(orphan_file)
        print(f"✅ Removed orphaned component: {orphan_file}")

if __name__ == "__main__":
    print("🚀 Executing PROJ-10 (Option B Refactor)...")
    apply_fixes()
    print("✨ Financial metrics successfully consolidated into SobrietyHero.")