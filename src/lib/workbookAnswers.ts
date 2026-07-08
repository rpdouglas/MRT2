import { collection, query, where, getDocs, doc, setDoc, Timestamp, type Firestore } from 'firebase/firestore';
import { db } from './firebase';
import type { WorkbookAnswer } from './db';

export async function getWorkbookAnswers(
  uid: string,
  workbookId?: string
): Promise<(WorkbookAnswer & { id: string })[]> {
  if (!db) throw new Error('Database not initialized');
  const database = db as Firestore;
  const base = collection(database, 'users', uid, 'workbook_answers');
  const q = workbookId ? query(base, where('workbookId', '==', workbookId)) : query(base);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as WorkbookAnswer) }));
}

export async function saveWorkbookAnswer(
  uid: string,
  payload: Omit<WorkbookAnswer, 'updatedAt'>
): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  const docId = `${payload.workbookId}_${payload.questionId}`;
  const ref = doc(db as Firestore, 'users', uid, 'workbook_answers', docId);
  await setDoc(ref, { ...payload, updatedAt: Timestamp.now() }, { merge: true });
}
