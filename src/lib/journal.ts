import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp,
  deleteDoc,
  doc,
  updateDoc // <--- Added this
} from "firebase/firestore";
import { db } from "./firebase";
import type { WeatherData } from "./weather";

export interface JournalEntry {
  id?: string;
  uid: string;
  content: string;
  tags: string[];
  moodScore: number;
  weather?: WeatherData | null;
  createdAt: Date;
}

const COLLECTION = 'journals';

// 1. CREATE
export async function addJournalEntry(
  uid: string, 
  content: string, 
  moodScore: number, 
  tags: string[],
  weather: WeatherData | null
) {
  if (!db) throw new Error("Database not initialized");
  
  await addDoc(collection(db, COLLECTION), {
    uid,
    content,
    tags,
    moodScore,
    weather: weather || null, 
    createdAt: Timestamp.now()
  });
}

// 2. READ
export async function getUserJournals(uid: string) {
  if (!db) throw new Error("Database not initialized");

  const q = query(
    collection(db, COLLECTION),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate()
  })) as JournalEntry[];
}

// 3. UPDATE (New)
export async function updateJournalEntry(
  id: string,
  content: string, 
  moodScore: number, 
  tags: string[]
) {
  if (!db) throw new Error("Database not initialized");
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    content,
    moodScore,
    tags,
    // We do NOT update createdAt or weather, as those are historical facts
  });
}

// 4. DELETE
export async function deleteJournalEntry(id: string) {
  if (!db) throw new Error("Database not initialized");
  await deleteDoc(doc(db, COLLECTION, id));
}