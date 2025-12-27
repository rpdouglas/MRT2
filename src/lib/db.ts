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
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { type User } from "firebase/auth";

// --- INTERFACES ---

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  sobrietyDate: Timestamp | null;
  createdAt: Timestamp;
  lastLogin?: Timestamp;
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

export interface Task {
  id?: string;
  uid: string;
  title: string;
  completed: boolean; // Legacy support
  status?: 'pending' | 'completed';
  isRecurring: boolean;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  currentStreak: number;
  priority: 'High' | 'Medium' | 'Low';
  createdAt: Timestamp;
  dueDate?: Timestamp;
}

// --- PROFILE FUNCTIONS ---

// 1. Fetch a simple profile (Read-Only)
export async function getProfile(uid: string): Promise<UserProfile | null> {
  if (!db) throw new Error("Database not initialized");
  
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  return null;
}

// 2. Create or Get User Profile
export async function getOrCreateUserProfile(user: User): Promise<UserProfile> {
  if (!db) throw new Error("Database not initialized");

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // Optional: Update lastLogin here if you want to track activity
    await updateDoc(userRef, { lastLogin: Timestamp.now() });
    return userSnap.data() as UserProfile;
  } else {
    // Initialize new profile
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      sobrietyDate: null, 
      createdAt: Timestamp.now(),
      lastLogin: Timestamp.now()
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  }
}

// 3. Generic Profile Update
export async function updateProfileData(uid: string, data: Partial<UserProfile> | { sobrietyDate: Date | null }) {
  if (!db) throw new Error("Database not initialized");

  const userRef = doc(db, "users", uid);
  // Spread data to safely handle the partial update
  await setDoc(userRef, { ...data }, { merge: true });
}

// 4. Update Sobriety Date (Legacy helper)
export async function updateSobrietyDate(uid: string, date: Date) {
  if (!db) throw new Error("Database not initialized");
  
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    sobrietyDate: Timestamp.fromDate(date)
  });
}

// --- TEMPLATE FUNCTIONS ---

export async function getUserTemplates(uid: string): Promise<JournalTemplate[]> {
  if (!db) throw new Error("Database not initialized");

  const templatesRef = collection(db, 'users', uid, 'templates');
  const snapshot = await getDocs(templatesRef);

  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  } as JournalTemplate));
}

export async function saveUserTemplate(uid: string, template: JournalTemplate) {
  if (!db) throw new Error("Database not initialized");

  const docRef = template.id 
    ? doc(db, 'users', uid, 'templates', template.id)
    : doc(collection(db, 'users', uid, 'templates'));

  const dataToSave = {
    ...template,
    id: docRef.id 
  };

  await setDoc(docRef, dataToSave);
}

export async function deleteUserTemplate(uid: string, templateId: string) {
  if (!db) throw new Error("Database not initialized");

  const docRef = doc(db, 'users', uid, 'templates', templateId);
  await deleteDoc(docRef);
}

// --- JOURNAL FUNCTIONS ---

export const addJournalEntry = async (uid: string, entry: Omit<JournalEntry, 'uid' | 'createdAt'>) => {
  if (!db) throw new Error("Database not initialized");
  
  await addDoc(collection(db, 'journals'), {
    uid,
    ...entry,
    createdAt: Timestamp.now(),
  });
};

export const getJournalHistory = async (uid: string) => {
  if (!db) throw new Error("Database not initialized");

  const q = query(
    collection(db, 'journals'),
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

/**
 * Fetches ALL user data across collections for export.
 * NOTE: This does NOT decrypt data. Decryption happens in the Exporter service.
 */
export async function fetchAllUserData(uid: string): Promise<FullUserData> {
  if (!db) throw new Error("Database not initialized");

  // 1. Profile
  const profile = await getProfile(uid);

  // 2. Journals
  const journalsQ = query(collection(db, 'journals'), where('uid', '==', uid), orderBy('createdAt', 'desc'));
  const journalsSnap = await getDocs(journalsQ);
  const journals = journalsSnap.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry));

  // 3. Tasks
  const tasksQ = query(collection(db, 'tasks'), where('uid', '==', uid));
  const tasksSnap = await getDocs(tasksQ);
  const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task));

  // 4. Templates
  const templates = await getUserTemplates(uid);

  // 5. Workbook Answers
  const wbQ = query(collection(db, 'users', uid, 'workbook_answers'));
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