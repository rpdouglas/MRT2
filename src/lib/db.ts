import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, query, where, orderBy, Timestamp, type Firestore } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";
import type { RecurrenceConfig } from "./dateUtils";

export type HeroColorKey = 'amber' | 'sky' | 'emerald' | 'violet' | 'rose';

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
  // TD-24: set when performAutoBackup's Drive upload fails (thrown error or a
  // non-ok response), cleared on the next successful run — lets the UI
  // surface a failure that was previously silent (console.error only).
  lastAutoBackupFailedAt?: Timestamp | null;
  role?: 'admin' | 'user';
  sponsorName?: string;
  sponsorPhone?: string;
  hasCompletedOnboarding?: boolean;
  lastSeenBuildHash?: string;
  // PROJ-113 (Daily Inspirational Image): local 'YYYY-MM-DD' of the last day
  // the once-per-day Dashboard image popup was shown — same category/pattern
  // as lastSeenBuildHash above.
  lastSeenDailyImageDate?: string;
  usage_limits?: {
    lastWeeklyInsight?: Timestamp;
    lastMonthlyInsight?: Timestamp;
    lastDeepDive?: Timestamp;
    lastROSCAssessment?: Timestamp;
    /** PROJ-106: free-tier-only cooldown stamps, same shape as the above. */
    lastWorkbookAnalysis?: Timestamp;
    lastAudioAnalysis?: Timestamp;
  };
  /** PROJ-106: all-tier anti-abuse floor for workbook_coach — lives outside
   * usage_limits (which is free-tier-only bookkeeping) since this floor
   * applies to premium accounts too. */
  lastWorkbookCoachCall?: Timestamp;
  tier?: 'free' | 'premium';
  // PROJ-105: 'Stripe-Managed' is the literal string syncStripeSubscription
  // writes (functions/src/index.ts) — kept as-is rather than renamed to
  // 'stripe', since a rename would require a Cloud Function redeploy plus a
  // one-time backfill of every existing premium user's doc for zero
  // behavioral benefit (nothing compares against the old 'stripe' value —
  // see PROJ-105 spec §3). 'play-billing' is the new PROJ-105 source.
  tierSource?: 'Stripe-Managed' | 'play-billing' | 'manual';
  stripeCustomerId?: string;
  subscriptionStatus?: 'active' | 'past_due' | 'canceled';
  subscriptionPeriodEnd?: Timestamp;
  substanceCost?: number;
  costFrequency?: 'daily' | 'weekly' | 'monthly';
  currencySymbol?: string;
  // --- NEW: PROJ-56 (Sobriety Hero Color Themes) ---
  heroColor?: HeroColorKey;
  // --- NEW: PROJ-26 (The Beacon) ---
  fcmTokens?: string[];
  fcmSwVersion?: number;
  timezone?: string;
  // Push opt-out — distinct from anchorSettings.notify* below, which only controls
  // in-app dashboard badge visibility, not server-sent push. Defaults to true when unset.
  pushNotificationsEnabled?: boolean;
  anchorSettings?: {
    notifyCheckIn: boolean;
    notifyReading: boolean;
    lastReadingDate?: string;
    defaultFellowship?: string;
  };
  // --- NEW: PROJ-75 (Workbook Marketplace) ---
  // Which official workbook ids appear in the user's "My Workbooks" library.
  // undefined means legacy/new user — treat as all official workbooks installed
  // (see getDefaultInstalledWorkbookIds in src/data/workbooks.ts).
  installedWorkbookIds?: string[];
  // Marks an in-flight PIN rotation (src/lib/rotation.ts). Present only
  // between the start of executePinRotation and its successful completion —
  // lets an interrupted rotation resume with the same salt/verifier instead
  // of generating a new one and losing track of already-migrated documents.
  pendingRotation?: {
    salt: string;
    verifier: string;
  };
  // --- NEW: PROJ-65 (Vault PIN Brute-Force Hardening) ---
  // Server-write-only (see firestore.rules) — tracks failed verifyVaultPin
  // attempts for per-uid rate limiting. Never written by client code.
  pinAttempts?: {
    count: number;
    lockedUntil?: Timestamp;
    lastAttemptAt?: Timestamp;
  };
  // True once this account's vault key derivation has moved from the direct
  // PBKDF2 scheme to the peppered scheme (see src/lib/rotation.ts's
  // executeVaultRekey). Unset/false means the legacy derivation is still
  // used and a transparent rekey should run on next unlock.
  usesPepperV2?: boolean;
  // --- NEW: PROJ-111 (MAT Dose-Tracking & Discreet Notifications) ---
  // Opt-in — undefined/false means the user isn't on a MAT track. Gates the
  // Dashboard dose-log widget and the customCounterLabel override below.
  matModeEnabled?: boolean;
  // User-chosen override for SobrietyHero's "Days" unit label (e.g. "Days of
  // Stability"). Plaintext — UI copy the user chose, not recovery content,
  // same category as anchorSettings. Never interpolated into a push
  // notification body (see functions/src/index.ts's MAT reminder builder).
  customCounterLabel?: string;
}

/**
 * users/{uid}/playPurchases/{purchaseToken} — PROJ-105. Raw Google Play
 * Billing purchase record, mirroring the role users/{uid}/subscriptions/{id}
 * plays for Stripe. Client creates the doc immediately after a Digital Goods
 * API purchase (so the purchaseToken is never lost if the app is closed
 * before verification completes); only the verifyPlayPurchase Cloud Function
 * and the RTDN Pub/Sub handler ever write `verified`/`status`/`expiryTime` —
 * see firestore.rules (create: owner, update/delete: false).
 */
export interface PlayPurchaseRecord {
  purchaseToken: string;
  productId: string;
  createdAt: Timestamp;
  verified: boolean;
  status?: 'active' | 'canceled' | 'expired' | 'on_hold' | 'paused' | 'pending';
  expiryTime?: Timestamp;
  orderId?: string;
}

/**
 * mat_doses/{id} — PROJ-111. One-tap daily MAT (medication-assisted
 * treatment) dose log. Split-encryption, mirroring the tasks/journals
 * precedent in CLAUDE.md's ZK boundary table: uid/loggedAt/date stay
 * plaintext (needed for compliance-rate queries, comparable in sensitivity
 * to a completed task), encryptedNote is AES-GCM via src/lib/crypto.ts for
 * any free-text side-effect/feeling note the user adds.
 */
export interface MatDoseLog {
  id?: string;
  uid: string;
  loggedAt: Timestamp;
  date: string; // 'yyyy-MM-dd', user's local tz — compliance-rate grouping key
  isEncrypted: boolean;
  encryptedNote?: string; // AES-GCM 'IV:Ciphertext'
}

export interface JournalTemplate {
  id: string;
  uid?: string;
  name: string;
  content?: string;
  prompts?: string[]; // Legacy prompt-form templates
  defaultTags: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface JournalEntry {
  id?: string;
  uid: string;
  content: string;
  moodScore: number;
  tags: string[];
  createdAt: Timestamp;
  isEncrypted?: boolean;
  // PROJ-113 (Daily Inspirational Image): plaintext reference to the
  // daily_images/{date} imageId this entry was journaled from, same category
  // as tags/moodScore above — content stays encrypted as always. Only set at
  // creation time (journaling *from* an image); not carried through edits.
  linkedImageId?: string;
  weather?: {
    temp: number;
    condition: string;
    location?: string;
  } | null;
}

type TaskCategory = 'Recovery' | 'Health' | 'Life' | 'Work';
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
  source?: 'manual' | 'ai';
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

// 'All' (PROJ-72 Phase 6) is for games that aren't persona-specific, e.g.
// Knowledge Quests' general psychoeducation content packs.
export type GamePersonaTarget = 'David' | 'Ned' | 'Lisa' | 'Walt' | 'All';

// PROJ-72 (Recovery Games), Phase 1. score/gameId/personaTarget/createdAt stay
// plaintext — same partial-encryption precedent as rosc_assessments — so
// streak/XP math never needs a decrypt. Only stats/reflection are ciphertext.
export interface GameProgressRecord {
  id?: string;
  uid: string;
  gameId: string;
  personaTarget: GamePersonaTarget;
  score: number;
  encryptedStats: string; // IV:Ciphertext (base64) — JSON.stringify(stats), see src/lib/crypto.ts
  encryptedReflection?: string; // IV:Ciphertext (base64) — only present if the game calls recordReflection
  createdAt: Timestamp | Date;
  isEncrypted: true;
}

// PROJ-72 (Recovery Games), Phase 4. A resumable, continuously-updated
// save-slot for multi-session games (e.g. Fast Lane) — distinct from
// game_progress's append-only completed-play log. One doc per (uid, gameId),
// doc ID `${uid}_${gameId}`, upserted via setDoc. The whole state is
// encrypted (no plaintext fields) since this is live in-progress data, not a
// completed-event snapshot with fields needed for streak/XP math.
export interface GameSaveRecord {
  id?: string;
  uid: string;
  gameId: string;
  encryptedState: string; // IV:Ciphertext (base64) — JSON.stringify(save state), see src/lib/crypto.ts
  updatedAt: Timestamp | Date;
  isEncrypted: true;
}

// PROJ-79 (Daily Crossword). Nightly-generated, server-write-only, shared
// editorial content — same date-keyed/admin-write shape as daily_readings.
// No user data anywhere in this document, so no encrypted fields (unlike
// every other Recovery Games collection) — see
// docs/projects/79_DAILY_CROSSWORD.md §2/§3.
type CrosswordClueStyle = 'dictionary' | 'recovery' | 'reflective' | 'metaphor';
type CrosswordDifficulty = 'easy' | 'mid' | 'advanced';

export interface CrosswordWordEntry {
  answer: string;
  clue: string;
  clueStyle: CrosswordClueStyle;
  hint: string | null;
  themed: boolean;
  difficulty: CrosswordDifficulty; // internal only — never rendered, see spec §4.4/§7
  number: number;
  row: number;
  col: number;
  direction: 'across' | 'down';
}

export interface CrosswordPuzzleRecord {
  date: string; // YYYY-MM-DD (UTC), also the doc ID
  theme: string;
  themeIntro: string;
  generatorVersion: string;
  promptVersion: string;
  words: CrosswordWordEntry[];
  insightCard: { text: string; frameworkTags: string[] };
  grid: { rows: number; cols: number };
}

// PROJ-113 (Daily Inspirational Image, Phase 1). Editorial content — an
// admin-uploaded library of pre-made images plus the nightly rotation
// record of which one is "today's" — not user data, so unencrypted, same
// posture as CrosswordPuzzleRecord above. See
// docs/projects/113_DAILY_INSPIRATIONAL_IMAGE.md §2/§3.
export interface ImageLibraryEntry {
  id: string; // doc ID, also referenced as DailyImageRecord.imageId
  storagePath: string;
  downloadUrl: string;
  caption?: string;
  attribution?: string;
  tags?: string[];
  uploadedAt: Timestamp;
  uploadedBy: string; // admin uid
  // 'YYYY-MM-DD' (UTC) of the date this image was last assigned as "today's
  // image", or '' if never shown. Always present (not optional) — the
  // rotation function (functions/src/index.ts's generateDailyImage) orders
  // by this field to pick the next image, and Firestore excludes documents
  // missing an ordered field from orderBy() results entirely, so every
  // uploaded doc must set it (empty string sorts first, ahead of any real
  // date) rather than leaving it unset.
  lastShownDate: string;
}

export interface DailyImageRecord {
  date: string; // 'YYYY-MM-DD' (UTC), also the doc ID
  imageId: string;
  storagePath: string;
  downloadUrl: string;
  caption?: string;
  assignedAt: Timestamp;
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
  // PROJ-72 Phase 7. Loosely typed like workbookAnswers — prepareDataForExport
  // reshapes encryptedStats/encryptedReflection into plain stats/reflection
  // fields, so the raw GameProgressRecord shape doesn't survive the decrypt step.
  gameProgress: Record<string, unknown>[];
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

  const gpQ = query(collection(database, 'game_progress'), where('uid', '==', uid), orderBy('createdAt', 'desc'));
  const gpSnap = await getDocs(gpQ);
  const gameProgress = gpSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  return {
    profile,
    journals,
    tasks,
    templates,
    workbookAnswers,
    gameProgress
  };
}
