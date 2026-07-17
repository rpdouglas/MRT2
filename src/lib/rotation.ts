/**
 * src/lib/rotation.ts
 * NEW: Dedicated service for Zero-Knowledge PIN rotation and Crypto-Shredding.
 * SECURITY: Uses cursor-based pagination and batching to prevent memory overflow (PROJ-31).
 * FIX: Strong typing for Firestore database instance to resolve TS2345 in closures.
 */
import { db } from './firebase';
import { collection, query, where, getDocs, getDoc, setDoc, writeBatch, doc, deleteField, limit, startAfter, type Firestore, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { generateSalt, generateKey, computePinHash, encrypt, decrypt, deriveLocalBits, deriveVaultKeyWithPepper } from './crypto';
import { fetchVaultPepper } from './vaultAuth';

const BATCH_SIZE = 50;

/**
 * PROJ-65: Derives the active vault key for one side (old or new) of a PIN
 * rotation. Legacy (pre-migration) accounts use the direct PBKDF2 key;
 * everything rotates onto the peppered scheme going forward — this is how
 * existing accounts get upgraded, piggybacking on the PIN-rotation flow's
 * existing blocking/progress-tracked re-encryption pass rather than a
 * separate background migration (which would race the shared module-level
 * key against concurrent foreground encrypt/decrypt calls).
 */
async function deriveKeyForScheme(pin: string, salt: string, usePepper: boolean, pepper: string | null): Promise<CryptoKey> {
    if (usePepper && pepper) {
        const localBits = await deriveLocalBits(pin, salt);
        return deriveVaultKeyWithPepper(localBits, pepper);
    }
    return generateKey(pin, salt);
}

/**
 * Permanently deletes all encrypted user data and destroys the encryption salt.
 */
export async function executeCryptoShredding(uid: string) {
    if (!db) throw new Error("Database not initialized");
    const database = db as Firestore;
    
    let opCount = 0;
    let currentBatch = writeBatch(database);
    const batchArray: Promise<void>[] = [];

    const commitBatch = () => {
        if (opCount > 0) {
            batchArray.push(currentBatch.commit());
            currentBatch = writeBatch(database);
            opCount = 0;
        }
    };

    // 1. Delete Journals (Cursor-based deletion)
    let lastJDoc: QueryDocumentSnapshot<DocumentData> | null = null;
    let hasMoreJournals = true;
    while (hasMoreJournals) {
        let jQ = query(collection(database, 'journals'), where('uid', '==', uid), limit(500));
        if (lastJDoc) jQ = query(collection(database, 'journals'), where('uid', '==', uid), startAfter(lastJDoc), limit(500));
        
        const jSnap = await getDocs(jQ);
        if (jSnap.empty) {
            hasMoreJournals = false;
        } else {
            jSnap.docs.forEach(d => { 
                currentBatch.delete(d.ref); 
                opCount++; 
                if (opCount >= 450) commitBatch(); 
            });
            lastJDoc = jSnap.docs[jSnap.docs.length - 1];
        }
    }

    // 2. Delete Workbooks
    let lastWDoc: QueryDocumentSnapshot<DocumentData> | null = null;
    let hasMoreWorkbooks = true;
    while (hasMoreWorkbooks) {
        let wQ = query(collection(database, 'users', uid, 'workbook_answers'), limit(500));
        if (lastWDoc) wQ = query(collection(database, 'users', uid, 'workbook_answers'), startAfter(lastWDoc), limit(500));
        
        const wSnap = await getDocs(wQ);
        if (wSnap.empty) {
            hasMoreWorkbooks = false;
        } else {
            wSnap.docs.forEach(d => { 
                currentBatch.delete(d.ref); 
                opCount++; 
                if (opCount >= 450) commitBatch(); 
            });
            lastWDoc = wSnap.docs[wSnap.docs.length - 1];
        }
    }

    // 3. Delete ROSC Assessments
    let lastRoscDoc: QueryDocumentSnapshot<DocumentData> | null = null;
    let hasMoreRosc = true;
    while (hasMoreRosc) {
        let rQ = query(collection(database, 'users', uid, 'rosc_assessments'), limit(500));
        if (lastRoscDoc) rQ = query(collection(database, 'users', uid, 'rosc_assessments'), startAfter(lastRoscDoc), limit(500));

        const rSnap = await getDocs(rQ);
        if (rSnap.empty) {
            hasMoreRosc = false;
        } else {
            rSnap.docs.forEach(d => {
                currentBatch.delete(d.ref);
                opCount++;
                if (opCount >= 450) commitBatch();
            });
            lastRoscDoc = rSnap.docs[rSnap.docs.length - 1];
        }
    }

    // 4. Clear Profile Fields
    const pRef = doc(database, 'users', uid);
    currentBatch.update(pRef, {
        encryptionSalt: deleteField(),
        pinVerifier: deleteField(),
        usesPepperV2: deleteField(),
        pinAttempts: deleteField(),
    });
    opCount++;
    commitBatch();

    await Promise.all(batchArray);
}

/**
 * Safely rotates the master encryption key across all historical data using memory-safe chunking.
 */
export async function executePinRotation(
    uid: string,
    oldPin: string,
    newPin: string,
    currentSalt: string,
    currentVerifier: string | null,
    currentUsesPepperV2: boolean,
    onProgress: (p: number) => void
): Promise<{ newSalt: string, newVerifier: string, newPepper: string }> {
    if (!db) throw new Error("Database not initialized");
    const database = db as Firestore;

    // 1. Validate Old PIN
    if (currentVerifier) {
        const checkHash = await computePinHash(oldPin, currentSalt);
        if (checkHash !== currentVerifier) {
            throw new Error("INCORRECT_PIN");
        }
    }

    // PROJ-65: fetch the pepper for the OLD key once up front (only needed if
    // this account is already on the peppered scheme) — legitimate call,
    // already gated on a locally-verified correct old PIN above.
    const oldPepper = currentUsesPepperV2 && currentVerifier
        ? await fetchVaultPepper(currentVerifier)
        : null;

    onProgress(2);

    // 2. Count Total Documents (for accurate progress bar)
    // In Firestore, we use size of aggregate query, but for simplicity and to save reads,
    // we'll estimate progress based on batches processed. We will track total processed.
    let processedDocs = 0;
    // Assuming a rough estimate of total documents to drive the UI.
    // For exact progress, you would run a COUNT() query here. We will set a generic progress flow.

    // 3. Generate (or resume) New Key Material
    // If a previous rotation attempt to this same new PIN was interrupted
    // mid-batch, some documents below are already re-encrypted under that
    // attempt's new key. Reusing its exact salt/verifier (persisted in
    // `pendingRotation`) lets the per-document logic below detect and skip
    // those already-migrated documents instead of misreporting them as
    // corrupted. A fresh salt is only generated when there's no compatible
    // pending attempt to resume.
    const pRef = doc(database, 'users', uid);
    const profileSnap = await getDoc(pRef);
    const pending = profileSnap.data()?.pendingRotation as { salt: string; verifier: string } | undefined;
    const pendingVerifierForThisPin = pending ? await computePinHash(newPin, pending.salt) : null;

    let newSalt: string;
    let newVerifier: string;
    if (pending && pendingVerifierForThisPin === pending.verifier) {
        newSalt = pending.salt;
        newVerifier = pending.verifier;
    } else {
        newSalt = generateSalt();
        newVerifier = await computePinHash(newPin, newSalt);
        await setDoc(pRef, { pendingRotation: { salt: newSalt, verifier: newVerifier } }, { merge: true });
    }

    // PROJ-65: the new key is always on the peppered scheme — this is how
    // legacy accounts get upgraded, transparently, the next time they
    // rotate their PIN. The pepper is deterministic (HMAC of the server
    // secret over newVerifier), so re-fetching it on a resumed/retried
    // rotation yields the identical value and stays safe to resume.
    const newPepper = await fetchVaultPepper(newVerifier);

    try {
        // --- PROCESS JOURNALS ---
        let lastJDoc: QueryDocumentSnapshot<DocumentData> | null = null;
        let hasMoreJournals = true;
        
        while (hasMoreJournals) {
            let jQ = query(collection(database, 'journals'), where('uid', '==', uid), limit(BATCH_SIZE));
            if (lastJDoc) jQ = query(collection(database, 'journals'), where('uid', '==', uid), startAfter(lastJDoc), limit(BATCH_SIZE));
            
            const jSnap = await getDocs(jQ);
            if (jSnap.empty) {
                hasMoreJournals = false;
                continue;
            }

            const currentBatch = writeBatch(database);
            
            for (const document of jSnap.docs) {
                const data = document.data();
                if (data.isEncrypted && data.content) {
                    // Decrypt with OLD key
                    await deriveKeyForScheme(oldPin, currentSalt, currentUsesPepperV2, oldPepper);
                    const plain = await decrypt(data.content);
                    if (plain.includes("Locked Content") || plain === "[Error: Data Corrupted]") {
                        // May already be re-encrypted under the new key from an
                        // interrupted prior attempt — check before failing.
                        await deriveKeyForScheme(newPin, newSalt, true, newPepper);
                        const alreadyMigrated = await decrypt(data.content);
                        if (alreadyMigrated.includes("Locked Content") || alreadyMigrated === "[Error: Data Corrupted]") {
                            throw new Error("DECRYPTION_FAILED");
                        }
                        continue; // already migrated in a previous attempt
                    }

                    // Encrypt with NEW key
                    await deriveKeyForScheme(newPin, newSalt, true, newPepper);
                    const cipher = await encrypt(plain);
                    currentBatch.update(document.ref, { content: cipher });
                }
            }
            
            await currentBatch.commit();
            lastJDoc = jSnap.docs[jSnap.docs.length - 1];
            processedDocs += jSnap.docs.length;
            
            // Artificial progress scaling for UI (maxes out around 45% for journals)
            onProgress(Math.min(45, 5 + Math.floor((processedDocs / 100) * 5))); 
        }

        // --- PROCESS WORKBOOKS ---
        let lastWDoc: QueryDocumentSnapshot<DocumentData> | null = null;
        let hasMoreWorkbooks = true;
        let workbookProcessed = 0;

        while (hasMoreWorkbooks) {
            let wQ = query(collection(database, 'users', uid, 'workbook_answers'), limit(BATCH_SIZE));
            if (lastWDoc) wQ = query(collection(database, 'users', uid, 'workbook_answers'), startAfter(lastWDoc), limit(BATCH_SIZE));
            
            const wSnap = await getDocs(wQ);
            if (wSnap.empty) {
                hasMoreWorkbooks = false;
                continue;
            }

            const currentBatch = writeBatch(database);
            
            for (const document of wSnap.docs) {
                const data = document.data();
                if (data.isEncrypted && data.answer) {
                    // Decrypt with OLD key
                    await deriveKeyForScheme(oldPin, currentSalt, currentUsesPepperV2, oldPepper);
                    const plain = await decrypt(data.answer);
                    if (plain.includes("Locked Content") || plain === "[Error: Data Corrupted]") {
                        // May already be re-encrypted under the new key from an
                        // interrupted prior attempt — check before failing.
                        await deriveKeyForScheme(newPin, newSalt, true, newPepper);
                        const alreadyMigrated = await decrypt(data.answer);
                        if (alreadyMigrated.includes("Locked Content") || alreadyMigrated === "[Error: Data Corrupted]") {
                            throw new Error("DECRYPTION_FAILED");
                        }
                        continue; // already migrated in a previous attempt
                    }

                    // Encrypt with NEW key
                    await deriveKeyForScheme(newPin, newSalt, true, newPepper);
                    const cipher = await encrypt(plain);
                    currentBatch.update(document.ref, { answer: cipher });
                }
            }
            
            await currentBatch.commit();
            lastWDoc = wSnap.docs[wSnap.docs.length - 1];
            workbookProcessed += wSnap.docs.length;
            
            // Artificial progress scaling for UI (scales from 45% to 90%)
            onProgress(Math.min(90, 45 + Math.floor((workbookProcessed / 100) * 5)));
        }

        // --- PROCESS ROSC ASSESSMENTS ---
        let lastRoscDoc: QueryDocumentSnapshot<DocumentData> | null = null;
        let hasMoreRosc = true;

        while (hasMoreRosc) {
            let rQ = query(collection(database, 'users', uid, 'rosc_assessments'), limit(BATCH_SIZE));
            if (lastRoscDoc) rQ = query(collection(database, 'users', uid, 'rosc_assessments'), startAfter(lastRoscDoc), limit(BATCH_SIZE));

            const rSnap = await getDocs(rQ);
            if (rSnap.empty) {
                hasMoreRosc = false;
                continue;
            }

            const currentBatch = writeBatch(database);

            for (const document of rSnap.docs) {
                const data = document.data();
                if (data.encryptedAIContext) {
                    await deriveKeyForScheme(oldPin, currentSalt, currentUsesPepperV2, oldPepper);
                    const plain = await decrypt(data.encryptedAIContext);
                    if (plain.includes("Locked Content") || plain === "[Error: Data Corrupted]") {
                        // May already be re-encrypted under the new key from an
                        // interrupted prior attempt — check before failing.
                        await deriveKeyForScheme(newPin, newSalt, true, newPepper);
                        const alreadyMigrated = await decrypt(data.encryptedAIContext);
                        if (alreadyMigrated.includes("Locked Content") || alreadyMigrated === "[Error: Data Corrupted]") {
                            throw new Error("DECRYPTION_FAILED");
                        }
                        continue; // already migrated in a previous attempt
                    }

                    await deriveKeyForScheme(newPin, newSalt, true, newPepper);
                    const cipher = await encrypt(plain);
                    currentBatch.update(document.ref, { encryptedAIContext: cipher });
                }
            }

            await currentBatch.commit();
            lastRoscDoc = rSnap.docs[rSnap.docs.length - 1];
        }

        // 4. Finalize Profile Updates — clears the pendingRotation marker now
        // that every document has been confirmed migrated to the new key.
        await deriveKeyForScheme(newPin, newSalt, true, newPepper); // Ensure app state rests on the new key
        await writeBatch(database).update(pRef, {
            encryptionSalt: newSalt,
            pinVerifier: newVerifier,
            pendingRotation: deleteField(),
            usesPepperV2: true,
        }).commit();

        onProgress(100);
        return { newSalt, newVerifier, newPepper };

    } catch (error) {
        // Do NOT silently reset the in-memory key to the old PIN here: any
        // batches already committed above were re-encrypted under the NEW
        // key, so pretending the old PIN is still authoritative would leave
        // those documents silently undecryptable next time the user unlocks
        // with it. `pendingRotation` on the profile (written above, before
        // any document writes) preserves the exact salt/verifier this
        // attempt used, so retrying executePinRotation with the same
        // (oldPin, newPin) will resume correctly — already-migrated
        // documents are detected and skipped rather than re-processed.
        console.error("PIN rotation failed mid-batch — retry with the same PIN to resume safely.", error);
        throw new Error("PARTIAL_ROTATION_FAILURE");
    }
}