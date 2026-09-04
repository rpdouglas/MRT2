import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firestore from 'firebase/firestore';
import { executePinRotation, executeCryptoShredding } from '../rotation';
import { generateKey, encrypt, computePinHash, generateSalt, isVaultUnlocked, clearKey, deriveLocalBits, deriveVaultKeyWithPepper } from '../crypto';

// A fixed, deterministic mock pepper standing in for verifyVaultPin's
// HMAC(VAULT_PEPPER, pinHash) response — rotation.ts always fetches a fresh
// pepper for the new key (see deriveKeyForScheme), so every test that
// exercises the "new key" path needs this mocked.
const MOCK_PEPPER = 'dGVzdC1wZXBwZXItdmFsdWU=';

// Mock Firebase config — rotation.ts only needs `db` to be truthy.
vi.mock('../firebase', () => ({
    db: {}
}));

vi.mock('../vaultAuth', () => ({
    fetchVaultPepper: vi.fn().mockResolvedValue('dGVzdC1wZXBwZXItdmFsdWU='),
}));

// Mock Firestore reads/writes; crypto.ts is left un-mocked so real
// PBKDF2/AES-GCM round-trips happen, matching crypto.test.ts's approach.
vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual as Record<string, unknown>,
        collection: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        limit: vi.fn(),
        startAfter: vi.fn(),
        doc: vi.fn(() => ({ __ref: 'profile' })),
        getDoc: vi.fn(),
        setDoc: vi.fn().mockResolvedValue(undefined),
        getDocs: vi.fn(),
        writeBatch: vi.fn(),
    };
});

type FakeDoc = { id: string; ref: { __id: string }; data: () => Record<string, unknown> };
type FakeSnapshot = { empty: boolean; docs: FakeDoc[] };

function emptySnapshot(): FakeSnapshot {
    return { empty: true, docs: [] };
}

function pageSnapshot(docs: FakeDoc[]): FakeSnapshot {
    return { empty: false, docs };
}

function mockProfileSnapshot(data: Record<string, unknown>) {
    return { exists: () => true, data: () => data } as unknown as Awaited<ReturnType<typeof firestore.getDoc>>;
}

describe('🔐 PIN Rotation Safety (Crypto-Shredding & Resume)', () => {
    const OLD_PIN = '1111';
    const NEW_PIN = '2222';
    let updateCalls: Array<[unknown, Record<string, unknown>]>;
    let deleteCalls: unknown[];
    let commitMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        clearKey();
        updateCalls = [];
        deleteCalls = [];
        commitMock = vi.fn().mockResolvedValue(undefined);

        // Shared chainable batch: every writeBatch() call returns an object
        // that records .update()/.delete() calls and resolves .commit().
        const batch = {
            update: vi.fn((ref: unknown, data: Record<string, unknown>) => { updateCalls.push([ref, data]); return batch; }),
            set: vi.fn(() => batch),
            delete: vi.fn((ref: unknown) => { deleteCalls.push(ref); return batch; }),
            commit: commitMock,
        };
        vi.mocked(firestore.writeBatch).mockReturnValue(batch as unknown as ReturnType<typeof firestore.writeBatch>);
    });

    // Journals is always processed first, then workbook_answers, then
    // rosc_assessments, then game_progress (PROJ-72), then game_saves
    // (PROJ-72 Phase 4), then mat_doses (PROJ-111) — each collection's
    // paginated while-loop issues a getDocs call per page and needs a final
    // EMPTY page to terminate. This test suite only exercises the journals
    // collection, so: N journal pages with docs, then one empty journal page
    // to end that loop, then one empty page each for workbook_answers,
    // rosc_assessments, game_progress, game_saves, and mat_doses.
    function queueGetDocs(journalPages: FakeSnapshot[]) {
        const calls = [...journalPages, emptySnapshot(), emptySnapshot(), emptySnapshot(), emptySnapshot(), emptySnapshot(), emptySnapshot()];
        for (const page of calls) {
            vi.mocked(firestore.getDocs).mockResolvedValueOnce(page as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);
        }
    }

    // Same shape as queueGetDocs, but lets a test supply explicit pages for
    // every stage instead of only journals — used by the game_progress test
    // below, which needs non-empty pages past the journals stage.
    function queueGetDocsForStages(stages: { journals?: FakeSnapshot[]; workbooks?: FakeSnapshot[]; rosc?: FakeSnapshot[]; gameProgress?: FakeSnapshot[]; gameSaves?: FakeSnapshot[]; matDoses?: FakeSnapshot[] }) {
        const calls = [
            ...(stages.journals ?? []), emptySnapshot(),
            ...(stages.workbooks ?? []), emptySnapshot(),
            ...(stages.rosc ?? []), emptySnapshot(),
            ...(stages.gameProgress ?? []), emptySnapshot(),
            ...(stages.gameSaves ?? []), emptySnapshot(),
            ...(stages.matDoses ?? []), emptySnapshot(),
        ];
        for (const page of calls) {
            vi.mocked(firestore.getDocs).mockResolvedValueOnce(page as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);
        }
    }

    it('completes a fresh rotation: re-encrypts all documents and clears the pending marker', async () => {
        const oldSalt = generateSalt();
        await generateKey(OLD_PIN, oldSalt);
        const staleCipher = await encrypt('Morning gratitude entry');

        vi.mocked(firestore.getDoc).mockResolvedValue(mockProfileSnapshot({}));
        queueGetDocs([
            pageSnapshot([{ id: 'j1', ref: { __id: 'j1' }, data: () => ({ isEncrypted: true, content: staleCipher }) }]),
        ]);

        const result = await executePinRotation('user_1', OLD_PIN, NEW_PIN, oldSalt, null, false, () => {});

        // Content was re-encrypted (not left as the stale ciphertext).
        const journalUpdate = updateCalls.find(([ref]) => (ref as { __id: string }).__id === 'j1');
        expect(journalUpdate).toBeDefined();
        expect(journalUpdate![1].content).not.toBe(staleCipher);

        // pendingRotation marker was written before processing (setDoc)...
        expect(firestore.setDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ pendingRotation: { salt: result.newSalt, verifier: result.newVerifier } }),
            expect.anything()
        );
        // ...and cleared again on the final profile update.
        const finalUpdate = updateCalls.find(([, data]) => 'encryptionSalt' in data);
        expect(finalUpdate).toBeDefined();
        expect(finalUpdate![1].encryptionSalt).toBe(result.newSalt);
        expect(finalUpdate![1]).toHaveProperty('pendingRotation');
    });

    it('re-encrypts game_progress documents, including both encryptedStats and an optional encryptedReflection (PROJ-72)', async () => {
        const oldSalt = generateSalt();
        await generateKey(OLD_PIN, oldSalt);
        const staleStats = await encrypt('{"rounds":3}');
        const staleReflection = await encrypt('I noticed I was catastrophizing.');

        vi.mocked(firestore.getDoc).mockResolvedValue(mockProfileSnapshot({}));
        queueGetDocsForStages({
            gameProgress: [pageSnapshot([
                { id: 'g1', ref: { __id: 'g1' }, data: () => ({ encryptedStats: staleStats, encryptedReflection: staleReflection }) },
            ])],
        });

        await executePinRotation('user_1', OLD_PIN, NEW_PIN, oldSalt, null, false, () => {});

        const g1Update = updateCalls.find(([ref]) => (ref as { __id: string }).__id === 'g1');
        expect(g1Update).toBeDefined();
        expect(g1Update![1].encryptedStats).not.toBe(staleStats);
        expect(g1Update![1].encryptedReflection).not.toBe(staleReflection);
    });

    // TD-25/ledger "Lost PIN Test" for PROJ-79 (Daily Crossword): the
    // game_progress rotation/shredding sweep above is already gameId-
    // agnostic — it re-encrypts/deletes by collection, never branching on
    // gameId — so a crossword completion was already covered by the generic
    // test above with zero code changes needed. This test exists purely to
    // make that coverage explicit for this specific game rather than
    // leaving it implicit, closing the letter of the still-open ledger item.
    it('re-encrypts a daily-crossword game_progress document the same as any other game (PROJ-79)', async () => {
        const oldSalt = generateSalt();
        await generateKey(OLD_PIN, oldSalt);
        const staleStats = await encrypt('{"solveDurationSeconds":180,"hintCount":1,"revealCount":0,"theme":"Hope"}');

        vi.mocked(firestore.getDoc).mockResolvedValue(mockProfileSnapshot({}));
        queueGetDocsForStages({
            gameProgress: [pageSnapshot([
                { id: 'xword1', ref: { __id: 'xword1' }, data: () => ({ gameId: 'daily-crossword', score: 0, encryptedStats: staleStats }) },
            ])],
        });

        await executePinRotation('user_1', OLD_PIN, NEW_PIN, oldSalt, null, false, () => {});

        const update = updateCalls.find(([ref]) => (ref as { __id: string }).__id === 'xword1');
        expect(update).toBeDefined();
        expect(update![1].encryptedStats).not.toBe(staleStats);
    });

    it('re-encrypts game_saves documents (PROJ-72 Phase 4)', async () => {
        const oldSalt = generateSalt();
        await generateKey(OLD_PIN, oldSalt);
        const staleState = await encrypt('{"player":{"week":3}}');

        vi.mocked(firestore.getDoc).mockResolvedValue(mockProfileSnapshot({}));
        queueGetDocsForStages({
            gameSaves: [pageSnapshot([
                { id: 's1', ref: { __id: 's1' }, data: () => ({ encryptedState: staleState }) },
            ])],
        });

        await executePinRotation('user_1', OLD_PIN, NEW_PIN, oldSalt, null, false, () => {});

        const s1Update = updateCalls.find(([ref]) => (ref as { __id: string }).__id === 's1');
        expect(s1Update).toBeDefined();
        expect(s1Update![1].encryptedState).not.toBe(staleState);
    });

    it('re-encrypts a mat_doses document\'s optional encryptedNote (PROJ-111)', async () => {
        const oldSalt = generateSalt();
        await generateKey(OLD_PIN, oldSalt);
        const staleNote = await encrypt('Felt a little nauseous this morning.');

        vi.mocked(firestore.getDoc).mockResolvedValue(mockProfileSnapshot({}));
        queueGetDocsForStages({
            matDoses: [pageSnapshot([
                { id: 'm1', ref: { __id: 'm1' }, data: () => ({ uid: 'user_1', date: '2026-09-04', encryptedNote: staleNote }) },
            ])],
        });

        await executePinRotation('user_1', OLD_PIN, NEW_PIN, oldSalt, null, false, () => {});

        const m1Update = updateCalls.find(([ref]) => (ref as { __id: string }).__id === 'm1');
        expect(m1Update).toBeDefined();
        expect(m1Update![1].encryptedNote).not.toBe(staleNote);
    });

    it('leaves a bare mat_doses document (no encryptedNote) untouched — plaintext loggedAt/date need no rotation (PROJ-111)', async () => {
        const oldSalt = generateSalt();
        await generateKey(OLD_PIN, oldSalt);

        vi.mocked(firestore.getDoc).mockResolvedValue(mockProfileSnapshot({}));
        queueGetDocsForStages({
            matDoses: [pageSnapshot([
                { id: 'm2', ref: { __id: 'm2' }, data: () => ({ uid: 'user_1', date: '2026-09-04' }) },
            ])],
        });

        await executePinRotation('user_1', OLD_PIN, NEW_PIN, oldSalt, null, false, () => {});

        expect(updateCalls.some(([ref]) => (ref as { __id: string }).__id === 'm2')).toBe(false);
    });

    it('resumes an interrupted rotation: skips documents already migrated under a pending key instead of failing', async () => {
        const oldSalt = generateSalt();

        // Simulate a PRIOR attempt that got partway through: it generated
        // pendingSalt/pendingVerifier and successfully re-encrypted doc "j1"
        // under it before the process died. "j2" is still on the old key.
        // The prior attempt's "new key" is the peppered scheme (matching what
        // a real rotation always derives — see deriveKeyForScheme) built from
        // the same deterministic mock pepper this test's actual rotation call
        // will also fetch, since fetchVaultPepper's response is a pure
        // function of pendingVerifier + the server secret.
        const pendingSalt = generateSalt();
        const pendingVerifier = await computePinHash(NEW_PIN, pendingSalt);
        const pendingLocalBits = await deriveLocalBits(NEW_PIN, pendingSalt);
        await deriveVaultKeyWithPepper(pendingLocalBits, MOCK_PEPPER);
        const migratedCipher = await encrypt('Already migrated by the prior attempt');

        await generateKey(OLD_PIN, oldSalt);
        const staleCipher = await encrypt('Still on the old key');

        vi.mocked(firestore.getDoc).mockResolvedValue(
            mockProfileSnapshot({ pendingRotation: { salt: pendingSalt, verifier: pendingVerifier } })
        );
        queueGetDocs([
            pageSnapshot([
                { id: 'j1', ref: { __id: 'j1' }, data: () => ({ isEncrypted: true, content: migratedCipher }) },
                { id: 'j2', ref: { __id: 'j2' }, data: () => ({ isEncrypted: true, content: staleCipher }) },
            ]),
        ]);

        const result = await executePinRotation('user_1', OLD_PIN, NEW_PIN, oldSalt, null, false, () => {});

        // The resumed attempt reuses the SAME pending salt/verifier — it does
        // not mint a third, unrelated salt that would orphan "j1".
        expect(result.newSalt).toBe(pendingSalt);
        expect(result.newVerifier).toBe(pendingVerifier);

        // "j1" (already migrated) must NOT be rewritten — it was correctly
        // detected as already-on-the-new-key and skipped.
        expect(updateCalls.some(([ref]) => (ref as { __id: string }).__id === 'j1')).toBe(false);

        // "j2" (still stale) must be migrated.
        const j2Update = updateCalls.find(([ref]) => (ref as { __id: string }).__id === 'j2');
        expect(j2Update).toBeDefined();
        expect(j2Update![1].content).not.toBe(staleCipher);
    });

    it('on a mid-batch failure, does NOT silently reset the in-memory key to the old PIN', async () => {
        const oldSalt = generateSalt();
        await generateKey(OLD_PIN, oldSalt);
        // Garbage ciphertext: fails to decrypt under BOTH the old and the
        // (about-to-be-generated) new key — a genuine corruption case.
        const corruptCipher = 'aabbccdd:ffffffffffffffffffffffffffffffff';

        vi.mocked(firestore.getDoc).mockResolvedValue(mockProfileSnapshot({}));
        queueGetDocs([
            pageSnapshot([{ id: 'j1', ref: { __id: 'j1' }, data: () => ({ isEncrypted: true, content: corruptCipher }) }]),
        ]);

        await expect(
            executePinRotation('user_1', OLD_PIN, NEW_PIN, oldSalt, null, false, () => {})
        ).rejects.toThrow('PARTIAL_ROTATION_FAILURE');

        // The vault must still be unlocked — the old catch-block behavior of
        // re-deriving the OLD key on failure (which would strand any batches
        // already committed under the new key) has been removed.
        expect(isVaultUnlocked()).toBe(true);

        // The pending marker must have been persisted before any document
        // processing began, so a retry has something to resume from.
        expect(firestore.setDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ pendingRotation: expect.objectContaining({ salt: expect.any(String) }) }),
            expect.anything()
        );

        // The final profile update (encryptionSalt/pinVerifier/clearing the
        // pending marker) must never have been reached.
        expect(updateCalls.some(([, data]) => 'encryptionSalt' in data)).toBe(false);
    });

    it('rejects with INCORRECT_PIN before touching any documents when the old PIN verifier does not match', async () => {
        const oldSalt = generateSalt();
        const realVerifier = await computePinHash(OLD_PIN, oldSalt);

        await expect(
            executePinRotation('user_1', 'wrong-pin', NEW_PIN, oldSalt, realVerifier, false, () => {})
        ).rejects.toThrow('INCORRECT_PIN');

        expect(firestore.getDocs).not.toHaveBeenCalled();
        expect(firestore.setDoc).not.toHaveBeenCalled();
    });
});

describe('🔥 Crypto-Shredding includes game_progress (PROJ-72)', () => {
    let deleteCalls: unknown[];
    let commitMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        // getDocs accumulates a queue of mockResolvedValueOnce entries across
        // tests (clearAllMocks does not drain that queue) — reset it
        // explicitly so a prior test's unconsumed pages (e.g. one that threw
        // before reaching every collection's loop) can't leak into this
        // describe's page ordering.
        vi.mocked(firestore.getDocs).mockReset();
        deleteCalls = [];
        commitMock = vi.fn().mockResolvedValue(undefined);

        const batch = {
            update: vi.fn(() => batch),
            set: vi.fn(() => batch),
            delete: vi.fn((ref: unknown) => { deleteCalls.push(ref); return batch; }),
            commit: commitMock,
        };
        vi.mocked(firestore.writeBatch).mockReturnValue(batch as unknown as ReturnType<typeof firestore.writeBatch>);
    });

    it('deletes game_progress documents alongside journals/workbooks/rosc', async () => {
        // Order matches executeCryptoShredding: journals, workbooks, rosc,
        // game_progress, game_saves, then mat_doses — each loop needs a
        // terminating empty page.
        const pages = [
            emptySnapshot(), // journals
            emptySnapshot(), // workbooks
            emptySnapshot(), // rosc
            pageSnapshot([{ id: 'g1', ref: { __id: 'g1' }, data: () => ({ encryptedStats: 'x' }) }]), // game_progress page 1
            emptySnapshot(), // game_progress terminator
            emptySnapshot(), // game_saves terminator
            emptySnapshot(), // mat_doses terminator
        ];
        for (const page of pages) {
            vi.mocked(firestore.getDocs).mockResolvedValueOnce(page as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);
        }

        await executeCryptoShredding('user_1');

        expect(deleteCalls).toContainEqual({ __id: 'g1' });
    });

    // TD-25/ledger "Lost PIN Test" for PROJ-79 (Daily Crossword) — see the
    // rotation describe block's matching comment above: the shredding sweep
    // is already gameId-agnostic, this makes that coverage explicit.
    it('deletes a daily-crossword game_progress document the same as any other game (PROJ-79)', async () => {
        const pages = [
            emptySnapshot(), // journals
            emptySnapshot(), // workbooks
            emptySnapshot(), // rosc
            pageSnapshot([{ id: 'xword1', ref: { __id: 'xword1' }, data: () => ({ gameId: 'daily-crossword', score: 0, encryptedStats: 'x' }) }]), // game_progress page 1
            emptySnapshot(), // game_progress terminator
            emptySnapshot(), // game_saves terminator
            emptySnapshot(), // mat_doses terminator
        ];
        for (const page of pages) {
            vi.mocked(firestore.getDocs).mockResolvedValueOnce(page as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);
        }

        await executeCryptoShredding('user_1');

        expect(deleteCalls).toContainEqual({ __id: 'xword1' });
    });

    it('deletes mat_doses documents alongside journals/workbooks/rosc/game_progress/game_saves (PROJ-111)', async () => {
        const pages = [
            emptySnapshot(), // journals
            emptySnapshot(), // workbooks
            emptySnapshot(), // rosc
            emptySnapshot(), // game_progress terminator
            emptySnapshot(), // game_saves terminator
            pageSnapshot([{ id: 'm1', ref: { __id: 'm1' }, data: () => ({ uid: 'user_1', date: '2026-09-04' }) }]), // mat_doses page 1
            emptySnapshot(), // mat_doses terminator
        ];
        for (const page of pages) {
            vi.mocked(firestore.getDocs).mockResolvedValueOnce(page as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);
        }

        await executeCryptoShredding('user_1');

        expect(deleteCalls).toContainEqual({ __id: 'm1' });
    });
});
