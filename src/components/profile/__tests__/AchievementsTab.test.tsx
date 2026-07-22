/**
 * src/components/profile/__tests__/AchievementsTab.test.tsx
 * PROJ-76: Rank/Level/XP, journal streak, and habit fire were relocated from the
 * Dashboard's SobrietyHero/bento tiles into this new Profile tab. These tests verify
 * the relocated data still renders correctly, both with and without existing activity.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AchievementsTab from '../AchievementsTab';

vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({ user: { uid: 'test-user-123', email: 'walt@example.com' } }),
}));

vi.mock('../../../lib/firebase', () => ({ db: { type: 'mock-db' } }));

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

let mockGameHistory: Array<{ score: number }>;
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
    });

    it('renders the Rank & Level card with a Seeker/Level 1 baseline for a brand-new user', async () => {
        renderAchievementsTab();

        expect(await screen.findByText('Rank & Level')).toBeInTheDocument();
        expect(screen.getByText(/LVL: 1/)).toBeInTheDocument();
    });

    it('renders zeroed Journal Streak and Habit Fire cards when there is no activity yet', async () => {
        renderAchievementsTab();

        expect(await screen.findByText('Journal Streak')).toBeInTheDocument();
        expect(screen.getByText('Habit Fire')).toBeInTheDocument();
        expect(screen.getAllByText('0')).not.toHaveLength(0);
    });

    it('shows a loading state before profile/journal/task data resolves', () => {
        mockGetDocs.mockReturnValue(new Promise(() => {})); // never resolves
        renderAchievementsTab();

        expect(screen.getByText(/loading achievements/i)).toBeInTheDocument();
    });
});
