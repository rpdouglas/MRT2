/**
 * src/components/smart_tools/__tests__/DentsTool.test.tsx
 * PROJ-50 Phase 5: DENTS Scenario Mode
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { DentsTool } from '../DentsTool';
import { useAuth } from '../../../contexts/AuthContext';
import * as firestore from 'firebase/firestore';

function renderWithQueryClient(ui: ReactElement) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: vi.fn(() => ({ user: { uid: 'test-uid' }, userTier: 'free' })),
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

vi.mock('../../../lib/gemini', () => ({ generateCBTCoachingPrompt: vi.fn() }));

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

interface DentsPayloadLike {
    scenario?: string;
    deny: string; escape: string; neutralize: string; tasks: string; swap: string;
}

const mockResumeDoc = (payload: DentsPayloadLike, tags: string[]) => {
    const content = `ENC:${JSON.stringify({ metadata: { type: 'DENTS', version: '2.0', lastSaved: new Date().toISOString() }, data: payload })}`;
    vi.mocked(firestore.getDocs).mockResolvedValueOnce({
        empty: false,
        docs: [{
            id: 'existing-doc',
            data: () => ({ isEncrypted: true, content, tags, createdAt: { toDate: () => new Date() } }),
        }],
    } as unknown as firestore.QuerySnapshot);
};

const completeAllSteps = async () => {
    fireEvent.change(screen.getByPlaceholderText("e.g. My best friend's wedding, open bar all night"), { target: { value: "My friend's wedding" } });
    fireEvent.click(screen.getByText('Continue →'));

    await waitFor(() => screen.getByPlaceholderText('e.g., I will promise myself to wait 24 hours before acting on any urge.'));
    fireEvent.change(screen.getByPlaceholderText('e.g., I will promise myself to wait 24 hours before acting on any urge.'), { target: { value: 'I will wait 24 hours before deciding anything.' } });
    fireEvent.click(screen.getByText('Next →'));

    fireEvent.change(screen.getByPlaceholderText("e.g., I'll say I have a family emergency and take an Uber home immediately."), { target: { value: 'I will call a cab and leave immediately if needed.' } });
    fireEvent.click(screen.getByText('Next →'));

    fireEvent.change(screen.getByPlaceholderText('e.g., I will step outside and call my sponsor or a supportive friend.'), { target: { value: 'I will step outside and call my sponsor.' } });
    fireEvent.click(screen.getByText('Next →'));

    fireEvent.change(screen.getByPlaceholderText('e.g., I will go to the kitchen and help wash the dishes.'), { target: { value: 'I will help in the kitchen to stay busy.' } });
    fireEvent.click(screen.getByText('Next →'));

    fireEvent.change(screen.getByPlaceholderText('e.g., I will order a sparkling water with lime instead of alcohol.'), { target: { value: 'I will order a sparkling water with lime.' } });
    fireEvent.click(screen.getByText('Finish'));
};

describe('⚡ DentsTool (Guided D.E.N.T.S. Scenario Mode)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAddJournal.mockResolvedValue({ id: 'new-doc' });
        (useAuth as Mock).mockReturnValue({ user: { uid: 'test-uid' }, userTier: 'free' });
        vi.mocked(firestore.getDocs).mockResolvedValue({ empty: true, docs: [] } as unknown as firestore.QuerySnapshot);
    });

    it('walks through the scenario intro and all 5 steps to reach an editable summary', async () => {
        renderWithQueryClient(<DentsTool />);
        await waitFor(() => screen.getByText("What's the high-risk situation you're planning for?"));

        await completeAllSteps();

        await waitFor(() => expect(screen.getByText("Reviewing: My friend's wedding")).toBeInTheDocument());
        expect(screen.getByDisplayValue('I will wait 24 hours before deciding anything.')).toBeInTheDocument();
        expect(screen.getByDisplayValue('I will order a sparkling water with lime.')).toBeInTheDocument();
    });

    it('drops the DRAFT tag only on the summary phase\'s final save, with the scenario in the payload', async () => {
        renderWithQueryClient(<DentsTool />);
        await waitFor(() => screen.getByText("What's the high-risk situation you're planning for?"));
        await completeAllSteps();

        await waitFor(() => expect(screen.getByText(/Reviewing:/)).toBeInTheDocument());
        fireEvent.click(screen.getByText('Save to Journal'));

        await waitFor(() => expect(mockUpdateJournal).toHaveBeenCalled());
        const lastCall = mockUpdateJournal.mock.calls[mockUpdateJournal.mock.calls.length - 1][0] as { content: string; tags: string[] };
        expect(lastCall.tags).toEqual(['SMART Tool', 'DENTS']);
        const decoded = JSON.parse(lastCall.content.replace(/^ENC:/, ''));
        expect(decoded.data.scenario).toBe("My friend's wedding");
        expect(decoded.data.deny).toBe('I will wait 24 hours before deciding anything.');
    });

    it('resumes a legacy complete entry with no scenario field straight into the summary', async () => {
        mockResumeDoc(
            { deny: 'a', escape: 'b', neutralize: 'c', tasks: 'd', swap: 'e' },
            ['SMART Tool', 'DENTS']
        );
        renderWithQueryClient(<DentsTool />);

        await waitFor(() => expect(screen.getByText('Reviewing your plan')).toBeInTheDocument());
        expect(screen.queryByText("What's the high-risk situation you're planning for?")).not.toBeInTheDocument();
    });

    it('resumes an incomplete draft into the scenario intro', async () => {
        mockResumeDoc(
            { deny: '', escape: '', neutralize: '', tasks: '', swap: '' },
            ['SMART Tool', 'DENTS', 'DRAFT']
        );
        renderWithQueryClient(<DentsTool />);

        await waitFor(() => expect(screen.getByText("What's the high-risk situation you're planning for?")).toBeInTheDocument());
    });
});
