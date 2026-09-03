import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firestore from 'firebase/firestore';
import { importBackup } from '../importer';
import { generateKey, encrypt, decrypt, generateSalt, clearKey } from '../crypto';

// Real PBKDF2/AES-GCM round-trips (crypto.ts is left un-mocked), matching
// rotation.test.ts/exporter.test.ts's approach — this is the only way to
// genuinely assert the ZK-boundary fix (recovered content is real
// ciphertext, not just flagged isEncrypted:true while still plaintext).

vi.mock('../firebase', () => ({ db: {} }));

let autoIdCounter = 0;

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual as Record<string, unknown>,
        collection: vi.fn((_db: unknown, path: string) => ({ __collectionPath: path })),
        doc: vi.fn((...args: unknown[]) => {
            if (args.length === 1) {
                const ref = args[0] as { __collectionPath: string };
                return { __path: `${ref.__collectionPath}/auto-${autoIdCounter++}` };
            }
            const segments = args.slice(1) as string[];
            return { __path: segments.join('/') };
        }),
        writeBatch: vi.fn(),
    };
});

type SetCall = { path: string; data: Record<string, unknown>; options?: Record<string, unknown> };

function makeUid() { return 'user-import-test'; }

function fileFor(content: unknown): File {
    return new File([JSON.stringify(content)], 'backup.json', { type: 'application/json' });
}

describe('📥 importBackup (PROJ-110 — full restore + ZK boundary fix)', () => {
    const PIN = '7777';
    let setCalls: SetCall[];
    let commitMock: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        vi.clearAllMocks();
        clearKey();
        autoIdCounter = 0;
        setCalls = [];
        commitMock = vi.fn().mockResolvedValue(undefined);

        const batch = {
            set: vi.fn((ref: { __path: string }, data: Record<string, unknown>, options?: Record<string, unknown>) => {
                setCalls.push({ path: ref.__path, data, options });
                return batch;
            }),
            commit: commitMock,
        };
        vi.mocked(firestore.writeBatch).mockReturnValue(batch as unknown as ReturnType<typeof firestore.writeBatch>);

        await generateKey(PIN, generateSalt());
    });

    it('imports a legacy flat-array journal file and re-encrypts content with the current vault key', async () => {
        const plaintext = 'Went to a meeting today, felt grounded.';
        const result = await importBackup(makeUid(), fileFor([
            { content: plaintext, mood: 8, tags: ['gratitude'] },
        ]), encrypt);

        expect(result.journals).toEqual({ success: 1, errors: 0 });
        expect(result.tasks).toEqual({ success: 0, errors: 0 });

        const journalCalls = setCalls.filter(c => c.path.startsWith('journals/'));
        expect(journalCalls).toHaveLength(1);

        // ZK boundary security check: the raw written doc must be real
        // ciphertext, not the plaintext string with a isEncrypted:true label
        // slapped on it.
        const written = journalCalls[0].data;
        expect(written.isEncrypted).toBe(true);
        expect(written.content).not.toBe(plaintext);
        expect(String(written.content)).toContain(':'); // IV:Ciphertext shape
        await expect(decrypt(written.content as string)).resolves.toBe(plaintext);
    });

    it('restores journals, tasks, workbook answers, and game history from a full FullUserData-shaped export', async () => {
        const originalCiphertext = await encrypt('an already-encrypted workbook answer');
        const result = await importBackup(makeUid(), fileFor({
            journals: [{ content: 'Entry text', mood: 6 }],
            tasks: [{ title: 'Call sponsor', priority: 'High', status: 'pending' }],
            workbookAnswers: [{ workbookId: 'wb1', sectionId: 's1', questionId: 'q1', answer: originalCiphertext, isEncrypted: true }],
            gameProgress: [{ gameId: 'urge-surfer', score: 3, stats: { waves: 2 }, reflection: 'Rode it out' }],
        }), encrypt);

        expect(result).toEqual({
            journals: { success: 1, errors: 0 },
            tasks: { success: 1, errors: 0 },
            workbookAnswers: { success: 1, errors: 0 },
            gameProgress: { success: 1, errors: 0 },
        });
        expect(setCalls).toHaveLength(4);
    });

    it('passes an already-ciphertext workbook answer through verbatim — a pre-TD-26 export, isEncrypted:true', async () => {
        const originalCiphertext = await encrypt('an already-encrypted workbook answer');
        await importBackup(makeUid(), fileFor({
            journals: [],
            workbookAnswers: [{ workbookId: 'wb1', sectionId: 's1', questionId: 'q1', answer: originalCiphertext, isEncrypted: true }],
        }), encrypt);

        const wbCall = setCalls.find(c => c.path.includes('workbook_answers'));
        expect(wbCall).toBeDefined();
        expect(wbCall!.data.answer).toBe(originalCiphertext);
        expect(wbCall!.data.isEncrypted).toBe(true);
        expect(wbCall!.path).toBe(`users/${makeUid()}/workbook_answers/wb1_q1`);
        expect(wbCall!.options).toEqual({ merge: true });
    });

    // TD-26: after exporter.ts's decrypt bug fix, a real export now carries
    // a genuinely plaintext `answer` with isEncrypted:false (matching
    // journals' convention) — this must be re-encrypted with the current
    // vault key on import, not passed through (which would write real
    // plaintext into the encrypted workbook_answers collection).
    it('re-encrypts a plaintext workbook answer from a post-TD-26 export, isEncrypted:false', async () => {
        const plaintext = 'My biggest trigger is stress at work.';
        await importBackup(makeUid(), fileFor({
            journals: [],
            workbookAnswers: [{ workbookId: 'wb1', sectionId: 's1', questionId: 'q1', answer: plaintext, isEncrypted: false }],
        }), encrypt);

        const wbCall = setCalls.find(c => c.path.includes('workbook_answers'));
        expect(wbCall).toBeDefined();
        expect(wbCall!.data.isEncrypted).toBe(true);
        expect(wbCall!.data.answer).not.toBe(plaintext);
        expect(String(wbCall!.data.answer)).toMatch(/^[0-9a-f]{24}:[0-9a-f]+$/i);
        await expect(decrypt(wbCall!.data.answer as string)).resolves.toBe(plaintext);
    });

    it('rejects a claimed-encrypted workbook answer whose value does not actually look like ciphertext (zk-audit hardening)', async () => {
        const result = await importBackup(makeUid(), fileFor({
            journals: [],
            workbookAnswers: [{ workbookId: 'wb1', sectionId: 's1', questionId: 'q1', answer: 'this is plainly plaintext, not ciphertext', isEncrypted: true }],
        }), encrypt);

        expect(result.workbookAnswers).toEqual({ success: 0, errors: 1 });
        expect(setCalls.filter(c => c.path.includes('workbook_answers'))).toHaveLength(0);
    });

    it('re-encrypts game_progress stats/reflection and never writes the plaintext fields', async () => {
        await importBackup(makeUid(), fileFor({
            journals: [],
            gameProgress: [{ gameId: 'goal-ladder', score: 5, stats: { rungs: 4 }, reflection: 'Felt good' }],
        }), encrypt);

        const gpCall = setCalls.find(c => c.path.startsWith('game_progress/'));
        expect(gpCall).toBeDefined();
        expect(gpCall!.data.stats).toBeUndefined();
        expect(gpCall!.data.reflection).toBeUndefined();
        expect(typeof gpCall!.data.encryptedStats).toBe('string');
        expect(typeof gpCall!.data.encryptedReflection).toBe('string');
        await expect(decrypt(gpCall!.data.encryptedReflection as string)).resolves.toBe('Felt good');
    });

    it('fails closed on a locked vault: skips the journal entry instead of ever writing plaintext', async () => {
        const lockedEncrypt = vi.fn().mockRejectedValue(new Error('Vault is locked'));
        const result = await importBackup(makeUid(), fileFor([{ content: 'secret entry' }]), lockedEncrypt);

        expect(result.journals).toEqual({ success: 0, errors: 1 });
        expect(setCalls.filter(c => c.path.startsWith('journals/'))).toHaveLength(0);
    });

    it('skips a malformed task (no title) without failing the whole import', async () => {
        const result = await importBackup(makeUid(), fileFor({
            journals: [],
            tasks: [{ priority: 'Low' }, { title: 'Valid task' }],
        }), encrypt);

        expect(result.tasks).toEqual({ success: 1, errors: 1 });
    });

    it('rejects a non-JSON file', async () => {
        const badFile = new File(['not json'], 'backup.json', { type: 'application/json' });
        await expect(importBackup(makeUid(), badFile, encrypt)).rejects.toBeInstanceOf(SyntaxError);
    });
});
