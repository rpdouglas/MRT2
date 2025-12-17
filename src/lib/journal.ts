import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "./firebase";
import type { WeatherData } from "./weather"; // Import the type

// Updated Interface to include Weather
export interface JournalEntry {
  id?: string;
  uid: string;
  content: string;
  tags: string[];
  moodScore: number;
  weather?: WeatherData | null; // New Field
  createdAt: Date;
}

const COLLECTION = 'journals';

// 1. CREATE: Accepts weather object now
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
    weather, // Save to Firestore
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

// 3. DELETE
export async function deleteJournalEntry(id: string) {
  if (!db) throw new Error("Database not initialized");
  await deleteDoc(doc(db, COLLECTION, id));
}