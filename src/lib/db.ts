import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { type User } from "firebase/auth";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  sobrietyDate: Timestamp | null;
  createdAt: Timestamp;
}

// --- NEW: Template Interface ---
export interface JournalTemplate {
  id: string;
  name: string;
  prompts: string[]; // List of questions (e.g., "What was the trigger?")
  defaultTags: string[]; // List of tags (e.g., "#step10")
}

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
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  }
}

// 3. Generic Profile Update
export async function updateProfileData(uid: string, data: Partial<UserProfile> | { sobrietyDate: Date | null }) {
  if (!db) throw new Error("Database not initialized");

  const userRef = doc(db, "users", uid);
  const { ...updateFields } = data;
  await setDoc(userRef, { ...updateFields }, { merge: true });
}

// 4. Update Sobriety Date (Legacy helper)
export async function updateSobrietyDate(uid: string, date: Date) {
  if (!db) throw new Error("Database not initialized");
  
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    sobrietyDate: Timestamp.fromDate(date)
  });
}

// --- NEW: Template CRUD Operations ---

// Get all templates for a user
export async function getUserTemplates(uid: string): Promise<JournalTemplate[]> {
  if (!db) throw new Error("Database not initialized");

  const templatesRef = collection(db, 'users', uid, 'templates');
  const snapshot = await getDocs(templatesRef);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as JournalTemplate));
}

// Save (Create or Update) a template
export async function saveUserTemplate(uid: string, template: JournalTemplate) {
  if (!db) throw new Error("Database not initialized");

  // Use the provided ID or generate a new one if empty
  const docRef = template.id 
    ? doc(db, 'users', uid, 'templates', template.id)
    : doc(collection(db, 'users', uid, 'templates'));

  // Ensure we save the ID inside the doc too (optional but helpful)
  const dataToSave = {
    ...template,
    id: docRef.id // Ensure ID matches doc ref
  };

  await setDoc(docRef, dataToSave);
}

// Delete a template
export async function deleteUserTemplate(uid: string, templateId: string) {
  if (!db) throw new Error("Database not initialized");

  const docRef = doc(db, 'users', uid, 'templates', templateId);
  await deleteDoc(docRef);
}