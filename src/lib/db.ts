import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, addDoc, query, where, orderBy, Timestamp, type Firestore, type QueryDocumentSnapshot, type DocumentData, type WithFieldValue } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";
import type { RecurrenceConfig } from "./dateUtils";

export const createConverter = <T extends object>() => ({ toFirestore(data: WithFieldValue<T>): DocumentData { return data; },
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
  hasDeferredVault?: boolean;
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
  lastSeenBuildHash?: string;
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
  substanceCost?: number;
  costFrequency?: 'daily' | 'weekly' | 'monthly';
  currencySymbol?: string;
  // --- NEW: PROJ-26 (The Beacon) ---
  fcmTokens?: string[];
  fcmSwVersion?: number;
  timezone?: string;
  anchorSettings?: {
    notifyCheckIn: boolean;
    notifyReading: boolean;
    notifyIntent: boolean;
    lastReadingDate?: string;
    defaultFellowship?: string;
  };
}

export interface JournalTemplate { id: string; name: string; prompts: string[]; defaultTags: string[]; }

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
  source?: 'manual' | 'ai' | 'anchor_intent';
  sourceContext?: string;   // AI-generated one-sentence insight summary. Plaintext. Only on source === 'ai'.
  sourceRef?: string;       // Reference for deep-linking back to source (workbook or insight).
  missedCountHistory?: number[]; // Appended per lazy-eval cycle (arrayUnion). Each element = days missed in that cycle.
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
      tier: 'free',
      fcmTokens: [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
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

// --- PROJ-42: Daily Readings Engine ---

export type ReadingModality =
  | 'twelve-step-aa'
  | 'twelve-step-na'
  | 'twelve-step-ca'
  | 'recovery-dharma'
  | 'smart-recovery'
  | 'secular-stoic'
  | 'mindfulness-buddhist';

export interface DailyReading {
  id: string;
  modality: ReadingModality;
  date: string;              // "YYYY-MM-DD"
  theme: string;
  title: string;
  body: string;
  reflection: string;
  affirmation: string;
  attribution?: string;      // Required for recovery-dharma
  goDeeper?: { label: string; url: string };
  generatedAt: Timestamp;
  bufferBatch: number;
}

export interface UserReadingPreferences {
  uid: string;
  selectedModalities: ReadingModality[];
  lastReadDate: string;      // "YYYY-MM-DD"
  readingHistory: string[];
}

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
