import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { prepareDataForExport } from '../exporter';
import { generateKey, encrypt, generateSalt, clearKey } from '../crypto';
import type { FullUserData, JournalEntry } from '../db';

// Real PBKDF2/AES-GCM round-trips (crypto.ts is left un-mocked), matching
// rotation.test.ts's approach — synthetic fixture content only, never real
// user data, and no decrypted value is ever asserted via a logged intermediate.

function baseData(overrides: Partial<FullUserData> = {}): FullUserData {
    return {
        profile: null,
        journals: [],
        tasks: [],
        templates: [],
        workbookAnswers: [],
        ...overrides,
    };
}

describe('🔓 prepareDataForExport (decryption-adjacent)', () => {
    const PIN = '4242';

    beforeEach(async () => {
        vi.clearAllMocks();
        clearKey();
        await generateKey(PIN, generateSalt());
    });

    it('decrypts journal content and marks entries as no longer encrypted', async () => {
        const plaintext = 'Went to a meeting today, felt grounded.';
        const cipher = await encrypt(plaintext);

        const journal: JournalEntry = {
            id: 'j1',
            uid: 'user_1',
            content: cipher,
            moodScore: 7,
            tags: ['gratitude'],
            createdAt: Timestamp.now(),
            isEncrypted: true,
        };

        const onProgress = vi.fn();
        const result = await prepareDataForExport(baseData({ journals: [journal] }), onProgress);

        expect(result.journals[0].content).toBe(plaintext);
        expect(result.journals[0].isEncrypted).toBe(false);
        expect(onProgress).toHaveBeenCalled();
    });

    it('leaves already-plaintext journal entries untouched', async () => {
        const journal: JournalEntry = {
            id: 'j2',
            uid: 'user_1',
            content: 'Never encrypted (legacy entry)',
            moodScore: 5,
            tags: [],
            createdAt: Timestamp.now(),
            isEncrypted: false,
        };

        const result = await prepareDataForExport(baseData({ journals: [journal] }), () => {});

        expect(result.journals[0].content).toBe('Never encrypted (legacy entry)');
    });

    it('decrypts nested workbook answers keyed by prompt id', async () => {
        const plaintext = 'My biggest fear is losing my family again.';
        const cipher = await encrypt(plaintext);

        const workbookAnswer = {
            id: 'w1',
            answers: {
                q1: { isEncrypted: true, text: cipher },
                q2: 'Plain scalar answer (not an encrypted-shaped value)',
            },
        };

        const result = await prepareDataForExport(
            baseData({ workbookAnswers: [workbookAnswer] }),
            () => {}
        );

        const decryptedAnswers = result.workbookAnswers[0].answers as Record<string, unknown>;
        expect(decryptedAnswers.q1).toBe(plaintext);
        expect(decryptedAnswers.q2).toBe('Plain scalar answer (not an encrypted-shaped value)');
    });

    it('surfaces a clear per-entry failure marker instead of silently producing a partial/corrupt export', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        // crypto.ts's decrypt() swallows a bad-auth-tag ciphertext internally
        // (resolves to a fallback string rather than rejecting) — the one path
        // where it actually throws to its caller is a locked vault. That's a
        // real scenario here: the vault can lock mid-export (session timeout),
        // and this is what exporter.ts's per-entry try/catch exists to handle.
        const cipher = await encrypt('Content encrypted before the vault locked');
        clearKey();

        const journal: JournalEntry = {
            id: 'j3',
            uid: 'user_1',
            content: cipher,
            moodScore: 3,
            tags: [],
            createdAt: Timestamp.now(),
            isEncrypted: true,
        };

        const result = await prepareDataForExport(baseData({ journals: [journal] }), () => {});

        // Failure is surfaced as an explicit marker, not the corrupt ciphertext
        // and not a thrown/uncaught exception that would abort the whole export.
        expect(result.journals[0].content).toBe('[DECRYPTION FAILED]');
        expect(result.journals[0].isEncrypted).toBe(true);

        // Other entries in the same export must still succeed — one bad
        // record must not corrupt the batch.
        expect(errorSpy).toHaveBeenCalled();
        // Console hygiene: the logged call must reference the entry id, never
        // the decrypted plaintext (there isn't any — decryption failed), and
        // never the raw ciphertext being treated as plaintext.
        const loggedArgs = errorSpy.mock.calls.flat();
        expect(loggedArgs.some(arg => typeof arg === 'string' && arg.includes('j3'))).toBe(true);

        errorSpy.mockRestore();
    });

    it('surfaces a "[LOCKED]" marker for a workbook answer whose decrypt call fails, without aborting the batch', async () => {
        // Same locked-vault trigger as the journal failure case above — one
        // entry (encrypted under a key that's since been cleared) fails while
        // a second, already-plaintext-shaped entry in the same batch is
        // untouched, proving one bad record doesn't corrupt the whole export.
        const brokenCipher = await encrypt('Encrypted before lock');
        clearKey();

        const workbookAnswer = {
            id: 'w2',
            answers: {
                broken: { isEncrypted: true, text: brokenCipher },
                fine: 'Plain scalar answer',
            },
        };

        const result = await prepareDataForExport(
            baseData({ workbookAnswers: [workbookAnswer] }),
            () => {}
        );

        const decryptedAnswers = result.workbookAnswers[0].answers as Record<string, unknown>;
        expect(decryptedAnswers.broken).toBe('[LOCKED]');
        expect(decryptedAnswers.fine).toBe('Plain scalar answer');
    });

    it('reports progress across the 0-80% (journals) and 80-100% (workbooks) ranges', async () => {
        const cipher = await encrypt('short entry');
        const journal: JournalEntry = {
            id: 'j4', uid: 'user_1', content: cipher, moodScore: 6, tags: [],
            createdAt: Timestamp.now(), isEncrypted: true,
        };
        const workbookAnswer = { id: 'w3', answers: { q1: { isEncrypted: true, text: cipher } } };

        const progressValues: number[] = [];
        await prepareDataForExport(
            baseData({ journals: [journal], workbookAnswers: [workbookAnswer] }),
            (p) => progressValues.push(p)
        );

        expect(progressValues.length).toBeGreaterThan(0);
        expect(Math.max(...progressValues)).toBeLessThanOrEqual(100);
        expect(Math.min(...progressValues)).toBeGreaterThanOrEqual(0);
    });
});
