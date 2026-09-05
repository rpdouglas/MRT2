/**
 * src/lib/deletion.ts
 * PURPOSE: Handles the "Right to be Forgotten" account shredding logic.
 * SECURITY: Batch deletes all metadata and encrypted blobs tied to a UID before Auth deletion.
 *
 * PROJ-115: this is the *second* time account deletion has silently missed
 * real collections (the first was game_progress/game_saves, PROJ-72 Phase 7 —
 * see deletion.test.ts's original comment). SCAN_TARGETS is exported and
 * asserted against a hardcoded expected list in deletion.test.ts specifically
 * so a *third* recurrence fails a test instead of shipping unnoticed.
 *
 * NOT covered here, by design: users/{uid}/checkout_sessions, subscriptions,
 * payments (Stripe Extension) and users/{uid}/playPurchases + the root
 * playPurchaseIndex/{token} (PROJ-105 Play Billing). firestore.rules locks
 * all of these against ANY client-side mutation, including by the resource
 * owner (`allow write: if false` / `allow update, delete: if false`) —
 * deliberately, so a user can't tamper with or fake their own billing state.
 * That's correct, sound security design, not a bug to route around here.
 * Purging them on account deletion needs a privileged server-side Cloud
 * Function (Admin SDK, bypasses rules) — tracked as a separate follow-up in
 * docs/ACTIVE_CYCLE.md, not attempted from the client in this ticket.
 *
 * One collection doesn't fit the uniform "root collection with a uid field"
 * or "subcollection under users/{uid}" shapes, so it's handled explicitly —
 * see the dedicated block below.
 */
import { db } from './firebase';
import { collection, query, where, getDocs, writeBatch, doc, type Firestore, type DocumentReference } from 'firebase/firestore';

interface ScanTarget {
    name: string;
    type: 'root' | 'subcollection';
}

// Every collection where a document is tied to a single user by a plain
// `uid` field (root) or by living under `users/{uid}/...` (subcollection),
// AND where the resource owner actually has delete permission in
// firestore.rules. Cross-checked directly against firestore.rules
// 2026-09-05 (PROJ-115) — deliberately excludes shared/editorial
// collections with no per-user data (daily_readings, crossword_puzzles,
// buffer_status, image_library, daily_images), the special-case collection
// handled separately below (user_reading_preferences, no uid field to query
// on), and the Stripe/Play-Billing collections documented in this file's
// header comment (locked against client deletion by design).
export const SCAN_TARGETS: ScanTarget[] = [
    { name: 'journals', type: 'root' },
    { name: 'tasks', type: 'root' },
    { name: 'mat_doses', type: 'root' }, // PROJ-111 — was missing (PROJ-115)
    { name: 'insights', type: 'root' },
    { name: 'ai_logs', type: 'root' }, // was missing, and had no owner-delete rule at all (PROJ-115)
    { name: 'client_errors', type: 'root' }, // PROJ-94 — was missing, same rule gap (PROJ-115)
    { name: 'service', type: 'root' }, // PROJ-05 stub, no live writer yet — was missing (PROJ-115)
    { name: 'game_progress', type: 'root' },
    { name: 'game_saves', type: 'root' },
    { name: 'feedback', type: 'root' }, // was missing, same rule gap as ai_logs/client_errors (PROJ-115)
    { name: 'workbook_answers', type: 'subcollection' },
    { name: 'templates', type: 'subcollection' },
    { name: 'rosc_assessments', type: 'subcollection' }, // PROJ-49 — was missing (PROJ-115)
];

export async function executeTotalAccountAnnihilation(uid: string, onProgress?: (msg: string) => void) {
    if (!db) throw new Error("Database not initialized");
    const database = db as Firestore;
    const refsToDelete: DocumentReference[] = [];

    // Helper to query and collect refs
    const collectRefs = async (colName: string, isSubcollection: boolean = false) => {
        if (onProgress) onProgress(`Scanning ${colName}...`);
        try {
            let q;
            if (isSubcollection) {
                q = collection(database, 'users', uid, colName);
            } else {
                q = query(collection(database, colName), where('uid', '==', uid));
            }
            const snap = await getDocs(q);
            snap.docs.forEach(d => refsToDelete.push(d.ref));
        } catch (e) {
            console.warn(`Failed to scan ${colName} during deletion`, e);
        }
    };

    // 1. Scan every declarative manifest target.
    for (const target of SCAN_TARGETS) {
        await collectRefs(target.name, target.type === 'subcollection');
    }

    // 2. Special case: user_reading_preferences/{userId} (PROJ-42) — doc ID
    // is the uid itself, not a uid-field query, so it needs a direct doc()
    // reference. Safe to push unconditionally: batch.delete() on a
    // non-existent doc (a user who never set a reading preference) is a
    // no-op, not an error.
    refsToDelete.push(doc(database, 'user_reading_preferences', uid));

    // 3. Target the main user profile document
    refsToDelete.push(doc(database, 'users', uid));

    if (onProgress) onProgress(`Destroying ${refsToDelete.length} records...`);

    // 5. Execute Chunked Deletion (Max 500 per batch, using 450 for safety).
    // PROJ-115 zk-audit finding: batches now commit sequentially, not
    // concurrently. Firestore can't atomically delete an unbounded number of
    // documents in one transaction, so a fully atomic account deletion isn't
    // possible — but firing all chunk commits at once (the old
    // Promise.all(batchPromises) shape) meant a failure gave no deterministic
    // boundary: which chunks landed depended on a race, not commit order.
    // Committing in order and stopping at the first failure means "every
    // batch before the one that threw definitely succeeded, nothing after it
    // was attempted" — and re-running this function afterward is always safe
    // (every scan is idempotent; deleting an already-deleted doc is a no-op),
    // which is exactly what the caller's UI does when this rejects.
    const batches: ReturnType<typeof writeBatch>[] = [];
    let currentBatch = writeBatch(database);
    let opCount = 0;

    for (const ref of refsToDelete) {
        currentBatch.delete(ref);
        opCount++;
        if (opCount >= 450) {
            batches.push(currentBatch);
            currentBatch = writeBatch(database);
            opCount = 0;
        }
    }

    if (opCount > 0) {
        batches.push(currentBatch);
    }

    for (const batch of batches) {
        await batch.commit();
    }

    if (onProgress) onProgress("Account data annihilated.");
}
