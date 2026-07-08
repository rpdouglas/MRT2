/**
 * src/components/smart_tools/__tests__/ThoughtRecordTool.test.tsx
 * PROJ-50 Phase 4: Thought Record
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThoughtRecordTool } from '../ThoughtRecordTool';
import { useAuth } from '../../../contexts/AuthContext';
import * as firestore from 'firebase/firestore';

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

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

interface ThoughtRecordPayloadLike {
    situation: string;
    automaticThoughts: string;
    emotions: Array<{ emotion: string; intensity: number }>;
    evidenceFor: string;
    evidenceAgainst: string;
    balancedThought: string;
    outcomeEmotions: Array<{ emotion: string; intensity: number }>;
    distortionType?: string;
}

const mockResumeDoc = (payload: ThoughtRecordPayloadLike, tags: string[]) => {
    const content = `ENC:${JSON.stringify({ metadata: { type: 'THOUGHT_RECORD', version: '2.0', lastSaved: new Date().toISOString() }, data: payload })}`;
    vi.mocked(firestore.getDocs).mockResolvedValueOnce({
        empty: false,
        docs: [{
            id: 'existing-doc',
            data: () => ({ isEncrypted: true, content, tags, createdAt: { toDate: () => new Date() } }),
        }],
    } as unknown as firestore.QuerySnapshot);
};

const fillTextStep = (placeholder: string, value: string) => {
    fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
};

const completeAllSteps = () => {
    fillTextStep('e.g., Sitting alone in my apartment on a Friday night, phone buzzing with messages from old friends.', 'Sitting alone at home on a Friday night.');
    fireEvent.click(screen.getByText('Next →'));

    fillTextStep("e.g., I'll never be able to just relax without using. What's even the point of staying sober.", 'I will never relax without using again.');
    fireEvent.click(screen.getByText('Next →'));

    fireEvent.click(screen.getByRole('button', { name: 'Anxious' }));
    const beforeSlider = screen.getAllByRole('slider')[0];
    fireEvent.change(beforeSlider, { target: { value: '80' } });
    fireEvent.click(screen.getByText('Next →'));

    fillTextStep('e.g., I have relapsed after stressful weeks before.', 'I have relapsed after stressful weeks before.');
    fireEvent.click(screen.getByText('Next →'));

    fillTextStep("e.g., I've made it through hard Friday nights before without using, more than once.", 'I have made it through hard Friday nights before.');
    fireEvent.click(screen.getByRole('button', { name: 'Catastrophising' }));
    fireEvent.click(screen.getByText('Next →'));

    fillTextStep('e.g., Staying sober on hard nights is difficult, but I have real evidence I can get through them without using.', 'Staying sober on hard nights is difficult, but I have real evidence I can get through them without using.');
    fireEvent.click(screen.getByText('Next →'));

    const afterSlider = screen.getAllByRole('slider')[0];
    fireEvent.change(afterSlider, { target: { value: '55' } });
    fireEvent.click(screen.getByText('Finish'));
};

describe('🧠 ThoughtRecordTool (Guided Thought Record flow)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAddJournal.mockResolvedValue({ id: 'new-doc' });
        (useAuth as Mock).mockReturnValue({ user: { uid: 'test-uid' }, userTier: 'free' });
        vi.mocked(firestore.getDocs).mockResolvedValue({ empty: true, docs: [] } as unknown as firestore.QuerySnapshot);
    });

    it('walks through all 7 steps, reaches summary, and shows the correct Shift and distortion', async () => {
        render(<ThoughtRecordTool />);
        await waitFor(() => screen.getByText('Step 1 of 7 — Situation'));

        completeAllSteps();

        await waitFor(() => expect(screen.getByText('Reviewing your reframed thought')).toBeInTheDocument());
        expect(screen.getByText((_, el) => el?.textContent === 'Your anxious moved from 80% to 55% after completing this record.')).toBeInTheDocument();
        expect(screen.getByText('Catastrophising')).toBeInTheDocument();
    });

    it('drops the DRAFT tag only on the summary phase\'s final save, with the correct payload', async () => {
        render(<ThoughtRecordTool />);
        await waitFor(() => screen.getByText('Step 1 of 7 — Situation'));
        completeAllSteps();

        await waitFor(() => expect(screen.getByText('Reviewing your reframed thought')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Save to Journal'));

        await waitFor(() => expect(mockUpdateJournal).toHaveBeenCalled());
        const lastCall = mockUpdateJournal.mock.calls[mockUpdateJournal.mock.calls.length - 1][0] as { content: string; tags: string[] };
        expect(lastCall.tags).toEqual(['SMART Tool', 'THOUGHT_RECORD']);
        const decoded = JSON.parse(lastCall.content.replace(/^ENC:/, ''));
        expect(decoded.data.distortionType).toBe('Catastrophising');
        expect(decoded.data.emotions).toEqual([{ emotion: 'Anxious', intensity: 80 }]);
        expect(decoded.data.outcomeEmotions).toEqual([{ emotion: 'Anxious', intensity: 55 }]);
    });

    it('resumes directly into the summary phase when the saved draft is already complete', async () => {
        mockResumeDoc(
            {
                situation: 'a', automaticThoughts: 'b', emotions: [{ emotion: 'Anxious', intensity: 80 }],
                evidenceFor: 'c', evidenceAgainst: 'd', balancedThought: 'e', outcomeEmotions: [{ emotion: 'Anxious', intensity: 50 }],
            },
            ['SMART Tool', 'THOUGHT_RECORD', 'DRAFT']
        );
        render(<ThoughtRecordTool />);

        await waitFor(() => expect(screen.getByText('Reviewing your reframed thought')).toBeInTheDocument());
        expect(screen.queryByText(/Step 1 of 7/)).not.toBeInTheDocument();
    });

    it('resumes directly into the guided phase when the saved draft is incomplete', async () => {
        mockResumeDoc(
            {
                situation: 'Sitting alone at home.', automaticThoughts: '', emotions: [],
                evidenceFor: '', evidenceAgainst: '', balancedThought: '', outcomeEmotions: [],
            },
            ['SMART Tool', 'THOUGHT_RECORD', 'DRAFT']
        );
        render(<ThoughtRecordTool />);

        await waitFor(() => expect(screen.getByText('Step 1 of 7 — Situation')).toBeInTheDocument());
        expect(screen.getByPlaceholderText('e.g., Sitting alone in my apartment on a Friday night, phone buzzing with messages from old friends.')).toHaveValue('Sitting alone at home.');
    });
});
