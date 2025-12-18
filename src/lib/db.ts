import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { type User } from "firebase/auth";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null; // Added this field
  sobrietyDate: Timestamp | null;
  createdAt: Timestamp;
}

// 1. Fetch a simple profile (Read-Only) - Used by Profile Page
export async function getProfile(uid: string): Promise<UserProfile | null> {
  if (!db) throw new Error("Database not initialized");
  
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  return null;
}

// 2. Create or Get User Profile - Used by AuthContext
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
      photoURL: user.photoURL, // Initialize photoURL
      sobrietyDate: null, 
      createdAt: Timestamp.now(),
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  }
}

// 3. Generic Profile Update - Used by Profile Page
export async function updateProfileData(uid: string, data: Partial<UserProfile> | { sobrietyDate: Date | null }) {
  if (!db) throw new Error("Database not initialized");

  const userRef = doc(db, "users", uid);
  
  // We use { merge: true } via setDoc to safely update or create fields
  // Note: We strip 'uid' from data to prevent overwriting key if passed
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