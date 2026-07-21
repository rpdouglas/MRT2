/**
 * src/lib/__tests__/deletion.test.ts
 * PROJ-72 Phase 7. First test coverage for executeTotalAccountAnnihilation
 * (none existed before this phase) — verifies game_progress and game_saves
 * are scanned and deleted alongside every other collection, closing a real
 * gap: account deletion previously left orphaned encrypted Recovery Games
 * data behind after Phases 1-6 introduced those two collections.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firestore from 'firebase/firestore';
import { executeTotalAccountAnnihilation } from '../deletion';

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

const ROOT_COLLECTIONS = ['journals', 'tasks', 'insights', 'ai_logs', 'feedback', 'game_progress', 'game_saves'];
const SUBCOLLECTIONS = ['workbook_answers', 'templates'];

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
            return { docs: [] } as unknown as firestore.QuerySnapshot;
        });
    });

    it('scans and deletes game_progress and game_saves alongside every other root collection', async () => {
        await executeTotalAccountAnnihilation('user_1');

        const scannedCollections = vi.mocked(firestore.collection).mock.calls.map((call) => call[call.length - 1]);
        for (const col of [...ROOT_COLLECTIONS, ...SUBCOLLECTIONS]) {
            expect(scannedCollections).toContain(col);
        }

        expect(deleteCalls).toContain('game_progress/gp1');
        expect(deleteCalls).toContain('game_saves/gs1');
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
