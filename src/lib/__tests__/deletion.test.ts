/**
 * src/lib/__tests__/deletion.test.ts
 * PROJ-72 Phase 7: original coverage for game_progress/game_saves, closing a
 * real gap where those two collections were introduced without being added
 * to account deletion.
 *
 * PROJ-115: the *same* gap shape recurred — rosc_assessments, client_errors,
 * service, plus 2 more found along the way during that ticket's /planning
 * pass (mat_doses, user_reading_preferences) had never been added either.
 * ai_logs/client_errors/feedback additionally had no owner-delete rule at
 * all in firestore.rules (fixed alongside this file). Deliberately NOT
 * covered: users/{uid}/checkout_sessions, subscriptions, payments (Stripe)
 * and playPurchases/playPurchaseIndex (Play Billing) — locked against ANY
 * client-side mutation by design (tamper-proofing a user's own billing
 * state), so purging them needs a privileged server-side Cloud Function,
 * tracked separately in docs/ACTIVE_CYCLE.md rather than attempted here.
 *
 * This file also asserts SCAN_TARGETS (deletion.ts's exported declarative
 * manifest) matches a hardcoded expected list, so a *third* recurrence of
 * this gap shape fails this test instead of shipping unnoticed the next
 * time a new user-data collection is added to the app.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firestore from 'firebase/firestore';
import { executeTotalAccountAnnihilation, SCAN_TARGETS } from '../deletion';

vi.mock('../firebase', () => ({
    db: {}
}));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual as Record<string, unknown>,
        collection: vi.fn((..._args: unknown[]) => ({ __col: _args[_args.length - 1] })),
        query: vi.fn((collRef: unknown) => collRef),
        where: vi.fn(),
        getDocs: vi.fn(),
        doc: vi.fn((..._args: unknown[]) => ({ __id: _args.slice(1).join('/') })),
        writeBatch: vi.fn(),
    };
});

// The full expected set of uid-owned, client-deletable collections,
// cross-checked against firestore.rules (PROJ-115). Deliberately hardcoded
// rather than derived from the rules file itself — a manual list a reviewer
// can eyeball against a rules diff is more trustworthy here than a regex
// parser that could silently mis-parse a future rules change and pass
// anyway.
const EXPECTED_ROOT_COLLECTIONS = [
    'journals', 'tasks', 'mat_doses', 'insights', 'ai_logs',
    'client_errors', 'service', 'game_progress', 'game_saves', 'feedback',
];
const EXPECTED_SUBCOLLECTIONS = [
    'workbook_answers', 'templates', 'rosc_assessments',
];
// user_reading_preferences is handled outside SCAN_TARGETS entirely (no uid
// field to query on) — covered by its own behavioral test below instead of
// a manifest-list assertion.

describe('SCAN_TARGETS manifest (PROJ-115 regression guard)', () => {
    it('covers every uid-owned, client-deletable root collection declared in firestore.rules', () => {
        const roots = SCAN_TARGETS.filter(t => t.type === 'root').map(t => t.name);
        expect(roots.sort()).toEqual([...EXPECTED_ROOT_COLLECTIONS].sort());
    });

    it('covers every uid-owned, client-deletable subcollection declared in firestore.rules', () => {
        const subs = SCAN_TARGETS.filter(t => t.type === 'subcollection').map(t => t.name);
        expect(subs.sort()).toEqual([...EXPECTED_SUBCOLLECTIONS].sort());
    });

    it('does not include the Stripe/Play-Billing collections locked against client deletion', () => {
        const allNames = SCAN_TARGETS.map(t => t.name);
        for (const lockedCollection of ['checkout_sessions', 'subscriptions', 'payments', 'playPurchases', 'playPurchaseIndex']) {
            expect(allNames).not.toContain(lockedCollection);
        }
    });
});

describe('🗑️ executeTotalAccountAnnihilation', () => {
    let deleteCalls: string[];
    let commitMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        deleteCalls = [];
        commitMock = vi.fn().mockResolvedValue(undefined);

        const batch = {
            delete: vi.fn((ref: { __id: string }) => { deleteCalls.push(ref.__id); return batch; }),
            commit: commitMock,
        };
        vi.mocked(firestore.writeBatch).mockReturnValue(batch as unknown as ReturnType<typeof firestore.writeBatch>);

        vi.mocked(firestore.getDocs).mockImplementation(async (q: unknown) => {
            const colName = (q as { __col: string }).__col;
            if (colName === 'game_progress') {
                return { docs: [{ ref: { __id: 'game_progress/gp1' } }] } as unknown as firestore.QuerySnapshot;
            }
            if (colName === 'game_saves') {
                return { docs: [{ ref: { __id: 'game_saves/gs1' } }] } as unknown as firestore.QuerySnapshot;
            }
            if (colName === 'rosc_assessments') {
                return { docs: [{ ref: { __id: 'rosc_assessments/r1' } }] } as unknown as firestore.QuerySnapshot;
            }
            if (colName === 'client_errors') {
                return { docs: [{ ref: { __id: 'client_errors/e1' } }] } as unknown as firestore.QuerySnapshot;
            }
            if (colName === 'service') {
                return { docs: [{ ref: { __id: 'service/s1' } }] } as unknown as firestore.QuerySnapshot;
            }
            if (colName === 'mat_doses') {
                return { docs: [{ ref: { __id: 'mat_doses/m1' } }] } as unknown as firestore.QuerySnapshot;
            }
            return { docs: [] } as unknown as firestore.QuerySnapshot;
        });
    });

    it('scans and deletes game_progress and game_saves alongside every other root collection', async () => {
        await executeTotalAccountAnnihilation('user_1');

        const scannedCollections = vi.mocked(firestore.collection).mock.calls.map((call) => call[call.length - 1]);
        for (const col of [...EXPECTED_ROOT_COLLECTIONS, ...EXPECTED_SUBCOLLECTIONS]) {
            expect(scannedCollections).toContain(col);
        }

        expect(deleteCalls).toContain('game_progress/gp1');
        expect(deleteCalls).toContain('game_saves/gs1');
    });

    it('scans and deletes the PROJ-115 gap collections (rosc_assessments, client_errors, service, mat_doses)', async () => {
        await executeTotalAccountAnnihilation('user_1');

        expect(deleteCalls).toContain('rosc_assessments/r1');
        expect(deleteCalls).toContain('client_errors/e1');
        expect(deleteCalls).toContain('service/s1');
        expect(deleteCalls).toContain('mat_doses/m1');
    });

    it('deletes the user_reading_preferences doc, keyed by uid directly rather than a uid-field query', async () => {
        await executeTotalAccountAnnihilation('user_1');
        expect(deleteCalls).toContain('user_reading_preferences/user_1');
    });

    it('still deletes the user profile document itself', async () => {
        await executeTotalAccountAnnihilation('user_1');
        expect(deleteCalls.some((id) => id.includes('user_1'))).toBe(true);
    });

    it('commits the batch after collecting all refs', async () => {
        await executeTotalAccountAnnihilation('user_1');
        expect(commitMock).toHaveBeenCalled();
    });
});
