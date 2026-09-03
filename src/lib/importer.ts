import { collection, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

// PROJ-110: restores a real MRT backup across every collection it contains,
// not just journals — and re-encrypts recovered journal/game-progress
// content through the live vault key rather than writing it back as
// plaintext. `encrypt` is injected (from useEncryption()) since this lib
// function has no context access of its own; see DataImportPanel.tsx.
type EncryptFn = (plaintext: string) => Promise<string>;

const BATCH_LIMIT = 450;

export interface ImportCounts { success: number; errors: number; }

export interface ImportResult {
  journals: ImportCounts;
  tasks: ImportCounts;
  workbookAnswers: ImportCounts;
  gameProgress: ImportCounts;
}

interface WeatherObject { temp: number; condition: string; }

interface IncomingEntry {
  text?: string;
  mood?: number;
  timestamp?: string;
  content?: string;
  moodScore?: number;
  sentiment?: string;
  createdAt?: string | { seconds: number; nanoseconds: number };
  weather?: string | WeatherObject | null;
  tags?: string[];
}

interface IncomingTask {
  title?: string;
  isRecurring?: boolean;
  frequency?: string;
  recurrence?: Record<string, unknown>;
  priority?: string;
  currentStreak?: number;
  status?: string;
  category?: string;
  createdAt?: string | { seconds: number; nanoseconds: number };
  dueDate?: string | { seconds: number; nanoseconds: number } | null;
  lastCompletedAt?: string | { seconds: number; nanoseconds: number } | null;
  source?: string;
  sourceContext?: string;
  sourceRef?: string;
  missedCountHistory?: number[];
}

interface IncomingWorkbookAnswer {
  workbookId?: string;
  sectionId?: string;
  questionId?: string;
  answer?: string;
  isEncrypted?: boolean;
  updatedAt?: string | { seconds: number; nanoseconds: number };
}

interface IncomingGameProgressEntry {
  gameId?: string;
  personaTarget?: string;
  score?: number;
  createdAt?: string | { seconds: number; nanoseconds: number };
  // A real export's prepareDataForExport() already decrypted these into
  // plain fields (see exporter.ts) — re-encrypted below with today's key.
  stats?: unknown;
  reflection?: string;
}

const parseWeather = (weatherData: string | WeatherObject | null | undefined): { temp: number; condition: string } | null => {
  if (!weatherData) return null;
  if (typeof weatherData === 'string') {
    const match = weatherData.match(/^(.*),\s*(-?\d+)°C$/);
    if (match) return { condition: match[1].trim(), temp: parseInt(match[2], 10) };
    return { condition: weatherData, temp: 0 };
  }
  if (typeof weatherData === 'object' && 'temp' in weatherData) {
    return weatherData as { temp: number; condition: string };
  }
  return null;
};

const toTimestamp = (val: unknown): Timestamp | null => {
  if (!val) return null;
  if (typeof val === 'string') {
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : Timestamp.fromDate(parsed);
  }
  if (typeof val === 'object' && val !== null && 'seconds' in val) {
    return Timestamp.fromDate(new Date((val as { seconds: number }).seconds * 1000));
  }
  return null;
};

// Journal content is always re-encrypted with the *current* vault key here —
// never trusted as pre-encrypted, even if the source file claims isEncrypted,
// since a cross-device/after-reset restore couldn't decrypt an old key's
// ciphertext anyway. mapEntry only ever receives already-encrypted `cipher`.
const mapEntry = (uid: string, entry: IncomingEntry, cipher: string) => {
  const mood = entry.moodScore ?? entry.mood ?? 5;
  const clampedMood = Math.max(1, Math.min(10, mood));

  let dateVal = new Date();
  if (entry.createdAt) {
    if (typeof entry.createdAt === 'string') {
      dateVal = new Date(entry.createdAt);
    } else if (typeof entry.createdAt === 'object' && 'seconds' in entry.createdAt) {
      dateVal = new Date(entry.createdAt.seconds * 1000);
    }
  } else if (entry.timestamp) {
    dateVal = new Date(entry.timestamp);
  }

  return {
    uid,
    content: cipher,
    moodScore: clampedMood,
    sentiment: entry.sentiment || 'Neutral',
    weather: parseWeather(entry.weather),
    createdAt: Timestamp.fromDate(dateVal),
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    isEncrypted: true,
  };
};

function mapTask(uid: string, raw: IncomingTask): Record<string, unknown> | null {
  if (!raw.title) return null;

  const mapped: Record<string, unknown> = {
    uid,
    title: raw.title,
    completed: raw.status === 'completed',
    isRecurring: !!raw.isRecurring,
    frequency: raw.frequency ?? 'once',
    currentStreak: raw.currentStreak ?? 0,
    priority: raw.priority ?? 'Medium',
    createdAt: toTimestamp(raw.createdAt) ?? Timestamp.now(),
  };
  if (raw.status) mapped.status = raw.status;
  if (raw.category) mapped.category = raw.category;
  if (raw.recurrence) mapped.recurrence = raw.recurrence;
  const dueDate = toTimestamp(raw.dueDate);
  if (dueDate) mapped.dueDate = dueDate;
  const lastCompletedAt = toTimestamp(raw.lastCompletedAt);
  if (lastCompletedAt) mapped.lastCompletedAt = lastCompletedAt;
  if (raw.source) mapped.source = raw.source;
  if (raw.sourceContext) mapped.sourceContext = raw.sourceContext;
  if (raw.sourceRef) mapped.sourceRef = raw.sourceRef;
  if (Array.isArray(raw.missedCountHistory)) mapped.missedCountHistory = raw.missedCountHistory;
  return mapped;
}

// PROJ-110 finding #3: a real export's workbook_answers.answer is already
// ciphertext — exporter.ts's decrypt logic doesn't match this collection's
// real flat doc shape, so it never actually decrypts it (a separate,
// still-open bug, deliberately out of this project's scope). Re-encrypting
// it here would double-encrypt genuine ciphertext, so this is a pass-through,
// not a re-encrypt — unlike journals/game-progress below. Uses the same
// derived doc ID convention saveWorkbookAnswer() does (`${workbookId}_
// ${questionId}`), so restoring is a natural upsert onto the canonical slot
// for that question, not a new/duplicate doc — this isn't the exported
// document's own opaque Firestore ID, so it carries none of the
// clobber-an-unrelated-live-doc risk that ID would.
// zk-audit finding: trusting an incoming isEncrypted:true label without
// verifying the value actually looks like ciphertext would let a
// hand-edited or malformed backup file get written as "encrypted" while
// holding real plaintext. Real ciphertext is always `${ivHex(24 hex
// chars)}:${contentHex}` — see crypto.ts's encrypt(). A claimed-encrypted
// answer that doesn't match this shape is rejected as malformed, not
// trusted and passed through.
const CIPHERTEXT_SHAPE = /^[0-9a-f]{24}:[0-9a-f]+$/i;

function mapWorkbookAnswer(uid: string, raw: IncomingWorkbookAnswer): { docId: string; data: Record<string, unknown> } | null {
  if (!raw.workbookId || !raw.sectionId || !raw.questionId || typeof raw.answer !== 'string') return null;
  const isEncrypted = raw.isEncrypted !== false;
  if (isEncrypted && !CIPHERTEXT_SHAPE.test(raw.answer)) return null;

  return {
    docId: `${raw.workbookId}_${raw.questionId}`,
    data: {
      uid,
      workbookId: raw.workbookId,
      sectionId: raw.sectionId,
      questionId: raw.questionId,
      answer: raw.answer,
      isEncrypted,
      updatedAt: toTimestamp(raw.updatedAt) ?? Timestamp.now(),
    },
  };
}

async function mapGameProgress(uid: string, raw: IncomingGameProgressEntry, encrypt: EncryptFn): Promise<Record<string, unknown> | null> {
  if (!raw.gameId || raw.stats === undefined) return null;

  const mapped: Record<string, unknown> = {
    uid,
    gameId: raw.gameId,
    personaTarget: raw.personaTarget ?? 'All',
    score: typeof raw.score === 'number' ? raw.score : 0,
    createdAt: toTimestamp(raw.createdAt) ?? Timestamp.now(),
    isEncrypted: true,
    encryptedStats: await encrypt(JSON.stringify(raw.stats)),
  };
  if (typeof raw.reflection === 'string') {
    mapped.encryptedReflection = await encrypt(raw.reflection);
  }
  return mapped;
}

export async function importBackup(uid: string, file: File, encrypt: EncryptFn): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        if (!db) {
          reject(new Error("Firestore database is not initialized"));
          return;
        }

        const text = e.target?.result as string;
        const json = JSON.parse(text) as Record<string, unknown> | IncomingEntry[];

        let rawJournals: IncomingEntry[] = [];
        let rawTasks: IncomingTask[] = [];
        let rawWorkbookAnswers: IncomingWorkbookAnswer[] = [];
        let rawGameProgress: IncomingGameProgressEntry[] = [];

        if (Array.isArray(json)) {
          rawJournals = json as IncomingEntry[];
        } else if (json && typeof json === 'object' && 'journals' in json && Array.isArray((json as Record<string, unknown>).journals)) {
          const obj = json as Record<string, unknown>;
          rawJournals = obj.journals as IncomingEntry[];
          if (Array.isArray(obj.tasks)) rawTasks = obj.tasks as IncomingTask[];
          if (Array.isArray(obj.workbookAnswers)) rawWorkbookAnswers = obj.workbookAnswers as IncomingWorkbookAnswer[];
          if (Array.isArray(obj.gameProgress)) rawGameProgress = obj.gameProgress as IncomingGameProgressEntry[];
        } else if (json) {
          rawJournals = [json as IncomingEntry];
        }

        const result: ImportResult = {
          journals: { success: 0, errors: 0 },
          tasks: { success: 0, errors: 0 },
          workbookAnswers: { success: 0, errors: 0 },
          gameProgress: { success: 0, errors: 0 },
        };

        // --- Journals: content re-encrypted with the current vault key ---
        let batch = writeBatch(db);
        let ops = 0;
        for (const raw of rawJournals) {
          try {
            if (!raw.content && !raw.text) continue;
            const plaintext = raw.content || raw.text || "";
            const cipher = await encrypt(plaintext);
            const mapped = mapEntry(uid, raw, cipher);
            batch.set(doc(collection(db, 'journals')), mapped);
            ops++; result.journals.success++;
            if (ops >= BATCH_LIMIT) { await batch.commit(); batch = writeBatch(db); ops = 0; }
          } catch (err) { console.error("Skipping invalid journal entry:", err); result.journals.errors++; }
        }
        if (ops > 0) await batch.commit();

        // --- Tasks: no encrypted fields (see CLAUDE.md's ZK table) ---
        batch = writeBatch(db);
        ops = 0;
        for (const raw of rawTasks) {
          try {
            const mapped = mapTask(uid, raw);
            if (!mapped) { result.tasks.errors++; continue; }
            batch.set(doc(collection(db, 'tasks')), mapped);
            ops++; result.tasks.success++;
            if (ops >= BATCH_LIMIT) { await batch.commit(); batch = writeBatch(db); ops = 0; }
          } catch (err) { console.error("Skipping invalid task:", err); result.tasks.errors++; }
        }
        if (ops > 0) await batch.commit();

        // --- Workbook answers: pass-through (see mapWorkbookAnswer comment) ---
        batch = writeBatch(db);
        ops = 0;
        for (const raw of rawWorkbookAnswers) {
          try {
            const mapped = mapWorkbookAnswer(uid, raw);
            if (!mapped) { result.workbookAnswers.errors++; continue; }
            batch.set(doc(db, 'users', uid, 'workbook_answers', mapped.docId), mapped.data, { merge: true });
            ops++; result.workbookAnswers.success++;
            if (ops >= BATCH_LIMIT) { await batch.commit(); batch = writeBatch(db); ops = 0; }
          } catch (err) { console.error("Skipping invalid workbook answer:", err); result.workbookAnswers.errors++; }
        }
        if (ops > 0) await batch.commit();

        // --- Recovery Games history: stats/reflection re-encrypted ---
        batch = writeBatch(db);
        ops = 0;
        for (const raw of rawGameProgress) {
          try {
            const mapped = await mapGameProgress(uid, raw, encrypt);
            if (!mapped) { result.gameProgress.errors++; continue; }
            batch.set(doc(collection(db, 'game_progress')), mapped);
            ops++; result.gameProgress.success++;
            if (ops >= BATCH_LIMIT) { await batch.commit(); batch = writeBatch(db); ops = 0; }
          } catch (err) { console.error("Skipping invalid game progress entry:", err); result.gameProgress.errors++; }
        }
        if (ops > 0) await batch.commit();

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}
