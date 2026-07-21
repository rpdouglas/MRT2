/**
 * src/components/smart_tools/__tests__/MorningIntentTool.test.tsx
 * PROJ-72 (Recovery Games), Phase 2 — mirrors ABCTool.test.tsx's harness.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { MorningIntentTool } from '../MorningIntentTool';

function renderWithQueryClient(ui: ReactElement) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({ user: { uid: 'test-uid' }, userTier: 'free' }),
}));

vi.mock('../../../contexts/EncryptionContext', () => ({
    useEncryption: () => ({
        isVaultUnlocked: true,
        encrypt: vi.fn(async (plain: string) => `ENC:${plain}`),
        decrypt: vi.fn(async (cipher: string) => cipher.replace(/^ENC:/, '')),
    }),
}));

vi.mock('../../../contexts/LayoutContext', () => ({
    useLayout: () => ({ isOnline: true }),
}));

const mockAddJournal = vi.fn().mockResolvedValue({ id: 'new-doc' });
const mockUpdateJournal = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../hooks/useJournalOperations', () => ({
    useJournalOperations: () => ({ addJournal: mockAddJournal, updateJournal: mockUpdateJournal }),
}));

vi.mock('../../../lib/firebase', () => ({ db: { type: 'mock-db' } }));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        collection: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(),
        getDocs: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
    };
});

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn(), useSearchParams: vi.fn(() => [new URLSearchParams()]) }));

const fillStep = (placeholder: string, value: string) => {
    fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
};

describe('☀️ MorningIntentTool (forward-looking guided flow)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAddJournal.mockResolvedValue({ id: 'new-doc' });
    });

    it("renders the first step (Today's Terrain) with the spec-verbatim question", async () => {
        renderWithQueryClient(<MorningIntentTool />);
        await waitFor(() => expect(screen.getByText("Step 1 of 4 — Today's Terrain")).toBeInTheDocument());
        expect(screen.getByText('What situations, people, or moments today are most likely to challenge you?')).toBeInTheDocument();
    });

    it('completes all 4 steps and saves a payload tagged MORNING_INTENT with no DRAFT tag', async () => {
        renderWithQueryClient(<MorningIntentTool />);
        await waitFor(() => screen.getByPlaceholderText('e.g., A stressful meeting at 2pm, or driving past my old bar on the way home.'));

        fillStep('e.g., A stressful meeting at 2pm, or driving past my old bar on the way home.', 'A tense meeting with my manager this afternoon.');
        fireEvent.click(screen.getByText('Next →'));

        fillStep("e.g., 'I can't handle this without using.'", "I can't cope with confrontation sober.");
        fireEvent.click(screen.getByText('Next →'));

        fillStep("e.g., 'This is uncomfortable, not dangerous. I've gotten through moments like this before.'", 'This is uncomfortable, not dangerous, and it will pass.');
        fireEvent.click(screen.getByText('Next →'));

        fillStep('e.g., Text my sponsor before the 2pm meeting.', 'Text my sponsor before the meeting starts.');
        fireEvent.click(screen.getByText('Finish'));

        await waitFor(() => expect(mockAddJournal).toHaveBeenCalledTimes(1));
        const savedCall = mockAddJournal.mock.calls[0][0] as { content: string; tags: string[] };
        expect(savedCall.tags).toEqual(['SMART Tool', 'MORNING_INTENT']);

        const decoded = JSON.parse(savedCall.content.replace(/^ENC:/, ''));
        expect(Object.keys(decoded.data).sort()).toEqual(['intention', 'reframe', 'story', 'terrain'].sort());
    });
});
