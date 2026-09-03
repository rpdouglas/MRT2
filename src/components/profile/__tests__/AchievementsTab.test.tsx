/**
 * src/components/profile/__tests__/AchievementsTab.test.tsx
 * PROJ-76: Rank/Level/XP, journal streak, habit fire, vitality rhythm, and workbook
 * wisdom were relocated from the Dashboard's SobrietyHero/bento tiles into this new
 * Profile tab. These tests verify the relocated data still renders correctly, both
 * with and without existing activity.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AchievementsTab from '../AchievementsTab';

vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({ user: { uid: 'test-user-123', email: 'walt@example.com' } }),
}));

vi.mock('../../../lib/firebase', () => ({ db: { type: 'mock-db' } }));

const mockDecrypt = vi.fn(async (cipher: string) => cipher);
vi.mock('../../../contexts/EncryptionContext', () => ({
    useEncryption: () => ({ decrypt: mockDecrypt }),
}));

const mockGetDocs = vi.fn();
vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        collection: vi.fn(() => ({})),
        query: vi.fn(() => ({})),
        where: vi.fn(() => ({})),
        orderBy: vi.fn(() => ({})),
        getDocs: (...args: unknown[]) => mockGetDocs(...args),
    };
});

let mockProfile: Record<string, unknown> | null;
vi.mock('../../../hooks/useUserProfile', () => ({
    useUserProfile: () => ({ profile: mockProfile, isLoading: false }),
}));

let mockGameHistory: Array<{ gameId: string; score: number }>;
vi.mock('../../../hooks/useGameProgress', () => ({
    useGameProgress: () => ({ history: mockGameHistory, isLoading: false }),
}));

function renderAchievementsTab() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <AchievementsTab />
        </QueryClientProvider>,
    );
}

describe('🏆 AchievementsTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGameHistory = [];
        mockProfile = { uid: 'test-user-123', sobrietyDate: null };
        mockGetDocs.mockResolvedValue({ docs: [], size: 0 });
        mockDecrypt.mockImplementation(async (cipher: string) => cipher);
    });

    it('renders the Rank & Level card with a Seeker/Level 1 baseline for a brand-new user', async () => {
        renderAchievementsTab();

        expect(await screen.findByText('Rank & Level')).toBeInTheDocument();
        expect(screen.getByText(/LVL: 1/)).toBeInTheDocument();
    });

    it('renders zeroed Journal Streak, Habit Fire, Vitality Rhythm, and Workbook Wisdom cards when there is no activity yet', async () => {
        renderAchievementsTab();

        expect(await screen.findByText('Journal Streak')).toBeInTheDocument();
        expect(screen.getByText('Habit Fire')).toBeInTheDocument();
        expect(screen.getByText('Vitality Rhythm')).toBeInTheDocument();
        expect(screen.getByText('Workbook Wisdom')).toBeInTheDocument();
        expect(screen.getAllByText('0')).not.toHaveLength(0);
    });

    it('shows a loading state before profile/journal/task data resolves', () => {
        mockGetDocs.mockReturnValue(new Promise(() => {})); // never resolves
        renderAchievementsTab();

        expect(screen.getByText(/loading achievements/i)).toBeInTheDocument();
    });

    it('PROJ-79: does not award XP for daily-crossword completions', async () => {
        mockGameHistory = [
            { gameId: 'daily-crossword', score: 0 },
            { gameId: 'daily-crossword', score: 0 },
        ];
        renderAchievementsTab();

        // Same 0 XP baseline as no game history at all — crossword entries
        // must not feed calculateUserLevel's gameProgressCount.
        expect(await screen.findByText(/^0 \/ /)).toBeInTheDocument();
    });

    it('PROJ-79: still awards XP for a real Recovery Game completion alongside crossword entries', async () => {
        mockGameHistory = [
            { gameId: 'daily-crossword', score: 0 },
            { gameId: 'goal-ladder', score: 8 },
        ];
        renderAchievementsTab();

        // GAME_COMPLETION XP (20) from the one non-crossword entry only.
        expect(await screen.findByText(/^20 \/ /)).toBeInTheDocument();
    });

    // TD-21: the journal query previously never decrypted `content`, so the
    // depth-bonus word count always ran against ciphertext (always length 1
    // when split on whitespace) — the bonus silently never fired for any
    // real account. These two tests are the actual regression check: without
    // the fix, decrypt() is never called and the entry would only ever score
    // the flat 25 XP base, never the +10 depth bonus, regardless of length.
    it('TD-21: awards the journal depth bonus for a real long entry once content is decrypted', async () => {
        const longPlaintext = Array(60).fill('word').join(' ');
        mockGetDocs
            .mockResolvedValueOnce({ docs: [{ data: () => ({ content: 'ciphertext-blob', isEncrypted: true, tags: [], createdAt: { toDate: () => new Date() } }) }], size: 1 }) // journals
            .mockResolvedValueOnce({ docs: [], size: 0 }) // tasks
            .mockResolvedValueOnce({ docs: [], size: 0 }) // workbook_answers count
            .mockResolvedValueOnce({ docs: [], size: 0 }); // rosc_assessments count
        mockDecrypt.mockResolvedValueOnce(longPlaintext);

        renderAchievementsTab();

        // JOURNAL_ENTRY (25) + JOURNAL_LONG_ENTRY depth bonus (10) = 35.
        expect(await screen.findByText(/^35 \/ /)).toBeInTheDocument();
        expect(mockDecrypt).toHaveBeenCalledWith('ciphertext-blob');
    });

    it('TD-21: a decrypt failure fails closed to no depth bonus instead of crashing the tab', async () => {
        mockGetDocs
            .mockResolvedValueOnce({ docs: [{ data: () => ({ content: 'ciphertext-blob', isEncrypted: true, tags: [], createdAt: { toDate: () => new Date() } }) }], size: 1 })
            .mockResolvedValueOnce({ docs: [], size: 0 })
            .mockResolvedValueOnce({ docs: [], size: 0 })
            .mockResolvedValueOnce({ docs: [], size: 0 });
        mockDecrypt.mockRejectedValueOnce(new Error('vault locked'));

        renderAchievementsTab();

        // Base 25 XP only — no bonus, no thrown error reaching the UI.
        expect(await screen.findByText(/^25 \/ /)).toBeInTheDocument();
    });
});
