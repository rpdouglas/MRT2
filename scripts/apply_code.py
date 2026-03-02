import os

db_ts_content = r'''/**
 * src/lib/db.ts
 * UPDATED: Added hasCompletedOnboarding to UserProfile for Sprint 1 Ticket 1.3.
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

// --- GENERIC CONVERTER ---
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

// --- INTERFACES ---

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

// PROMOTED INTERFACE (Project 03)
export interface WorkbookAnswer {
  uid: string;
  workbookId: string;
  sectionId: string;
  questionId: string;
  answer: string; // Encrypted Ciphertext
  isEncrypted: boolean;
  updatedAt: Timestamp | Date;
}

// --- PROFILE FUNCTIONS ---

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
      hasCompletedOnboarding: false
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

// --- TEMPLATE FUNCTIONS ---

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

// --- JOURNAL FUNCTIONS ---

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

// --- DATA SOVEREIGNTY (EXPORT) ---

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

  // 1. Profile
  const profile = await getProfile(uid);

  // 2. Journals
  const journalsQ = query(collection(database, 'journals'), where('uid', '==', uid), orderBy('createdAt', 'desc'));
  const journalsSnap = await getDocs(journalsQ);
  const journals = journalsSnap.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry));

  // 3. Tasks
  const tasksQ = query(collection(database, 'tasks'), where('uid', '==', uid));
  const tasksSnap = await getDocs(tasksQ);
  const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task));

  // 4. Templates
  const templates = await getUserTemplates(uid);

  // 5. Workbook Answers
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
'''

profile_tsx_content = r'''/**
 * src/pages/Profile.tsx
 * GITHUB COMMENT:
 * [Profile.tsx]
 * FEAT: Implemented Onboarding Release Valve logic (Sprint 1 - Ticket 1.3).
 * UX: Adapts UI to guide new users to complete their profile before accessing the Dashboard.
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
    write_file("src/lib/db.ts", db_ts_content)
    write_file("src/pages/Profile.tsx", profile_tsx_content)
    print("✨ Onboarding Release Valve deployed successfully.")