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

// [ADDED] Required for Journal features
export interface JournalEntry {
  id?: string;
  uid: string;
  content: string;
  moodScore: number;
  tags: string[];
  createdAt: Timestamp;
  weather?: {
    temp_c: number;
    condition: string;
    icon: string;
  };
}

// [ADDED] Required for Task features (Approach 3)
export interface Task {
  id?: string;
  uid: string;
  text: string;
  completed: boolean;
  isRecurring: boolean;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | null;
  currentStreak: number;
  priority: 'High' | 'Medium' | 'Low';
  createdAt: Timestamp;
  dueDate?: Timestamp; // The new field for "Smart Reset"
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

// --- TEMPLATE FUNCTIONS (Preserved) ---

export async function getUserTemplates(uid: string): Promise<JournalTemplate[]> {
  if (!db) throw new Error("Database not initialized");

  const templatesRef = collection(db, 'users', uid, 'templates');
  const snapshot = await getDocs(templatesRef);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
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

// --- [ADDED] JOURNAL FUNCTIONS ---

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
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
};