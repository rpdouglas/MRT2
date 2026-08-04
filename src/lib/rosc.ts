import { collection, addDoc, getDocs, query, orderBy, Timestamp, type Firestore } from 'firebase/firestore';
import { db } from './firebase';
import type { ROSCAssessment } from './types/rosc';

export async function createROSCAssessment(
  uid: string,
  data: Omit<ROSCAssessment, 'id' | 'uid' | 'createdAt'>
): Promise<string> {
  if (!db) throw new Error('Database not initialized');
  const database = db as Firestore;
  const ref = await addDoc(
    collection(database, 'users', uid, 'rosc_assessments'),
    { uid, ...data, createdAt: Timestamp.now() }
  );
  return ref.id;
}

export async function getROSCAssessments(uid: string): Promise<ROSCAssessment[]> {
  if (!db) throw new Error('Database not initialized');
  const database = db as Firestore;
  const q = query(
    collection(database, 'users', uid, 'rosc_assessments'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ROSCAssessment));
}
