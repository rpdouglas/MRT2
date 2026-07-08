/**
 * src/components/smart_tools/__tests__/FiveQuestionsTool.test.tsx
 * PROJ-50 Phase 5: Five Questions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FiveQuestionsTool } from '../FiveQuestionsTool';
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

interface FiveQuestionsPayloadLike {
    thought: string;
    q1Explanation: string; q1IsTrue: string;
    q2Explanation: string; q2CanKnow: string;
    q3Reaction: string;
    q4WithoutThought: string;
    turnaround: string; turnaroundRating: number;
}

const mockResumeDoc = (payload: FiveQuestionsPayloadLike, tags: string[]) => {
    const content = `ENC:${JSON.stringify({ metadata: { type: 'FIVE_QUESTIONS', version: '2.0', lastSaved: new Date().toISOString() }, data: payload })}`;
    vi.mocked(firestore.getDocs).mockResolvedValueOnce({
        empty: false,
        docs: [{
            id: 'existing-doc',
            data: () => ({ isEncrypted: true, content, tags, createdAt: { toDate: () => new Date() } }),
        }],
    } as unknown as firestore.QuerySnapshot);
};

const completeAllSteps = async () => {
    fireEvent.change(screen.getByPlaceholderText("e.g. I'll never be able to relax without using"), { target: { value: "I'll never relax without using" } });
    fireEvent.click(screen.getByText('Continue →'));

    await waitFor(() => screen.getByPlaceholderText('e.g., It feels true in the moment, but I can think of times it wasn\'t.'));
    fireEvent.change(screen.getByPlaceholderText('e.g., It feels true in the moment, but I can think of times it wasn\'t.'), { target: { value: 'It feels true right now but I know it is not always true.' } });
    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    fireEvent.click(screen.getByText('Next →'));

    fireEvent.change(screen.getByPlaceholderText('e.g., No — I can\'t know for certain, even if it feels that way right now.'), { target: { value: 'No, I cannot know that for certain.' } });
    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    fireEvent.click(screen.getByText('Next →'));

    fireEvent.change(screen.getByPlaceholderText('e.g., I get tense, pull away from people, and start looking for a way to numb out.'), { target: { value: 'I get tense and isolate from everyone around me.' } });
    fireEvent.click(screen.getByText('Next →'));

    fireEvent.change(screen.getByPlaceholderText('e.g., I\'d probably feel lighter, and I\'d actually call my friend back instead of avoiding it.'), { target: { value: 'I would feel lighter and reach out to my friends.' } });
    fireEvent.click(screen.getByText('Next →'));

    fireEvent.change(screen.getByPlaceholderText('e.g., The opposite of my thought might be just as true, if not more.'), { target: { value: 'I am learning how to relax without using.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rate 4 out of 5' }));
    fireEvent.click(screen.getByText('Finish'));
};

describe('❓ FiveQuestionsTool (Guided Byron Katie self-enquiry flow)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAddJournal.mockResolvedValue({ id: 'new-doc' });
        (useAuth as Mock).mockReturnValue({ user: { uid: 'test-uid' }, userTier: 'free' });
        vi.mocked(firestore.getDocs).mockResolvedValue({ empty: true, docs: [] } as unknown as firestore.QuerySnapshot);
    });

    it('walks through the thought intro and all 5 questions to reach the summary', async () => {
        render(<FiveQuestionsTool />);
        await waitFor(() => screen.getByText("What's the thought or belief you want to examine?"));

        await completeAllSteps();

        await waitFor(() => expect(screen.getByText('Examining: "I\'ll never relax without using"')).toBeInTheDocument());
        expect(screen.getByText('I am learning how to relax without using.')).toBeInTheDocument();
        expect(screen.getAllByText('No')).toHaveLength(2);
    });

    it('blocks Finish on Q1 until both the explanation and the Yes/No answer are given', async () => {
        render(<FiveQuestionsTool />);
        await waitFor(() => screen.getByText("What's the thought or belief you want to examine?"));
        fireEvent.change(screen.getByPlaceholderText("e.g. I'll never be able to relax without using"), { target: { value: 'thought' } });
        fireEvent.click(screen.getByText('Continue →'));

        await waitFor(() => screen.getByPlaceholderText('e.g., It feels true in the moment, but I can think of times it wasn\'t.'));
        fireEvent.change(screen.getByPlaceholderText('e.g., It feels true in the moment, but I can think of times it wasn\'t.'), { target: { value: 'a long enough explanation here' } });
        expect(screen.getByText('Next →')).toBeDisabled();

        fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
        expect(screen.getByText('Next →')).not.toBeDisabled();
    });

    it('drops the DRAFT tag only on the summary phase\'s final save, with the full payload', async () => {
        render(<FiveQuestionsTool />);
        await waitFor(() => screen.getByText("What's the thought or belief you want to examine?"));
        await completeAllSteps();

        await waitFor(() => expect(screen.getByText(/Examining:/)).toBeInTheDocument());
        fireEvent.click(screen.getByText('Save to Journal'));

        await waitFor(() => expect(mockUpdateJournal).toHaveBeenCalled());
        const lastCall = mockUpdateJournal.mock.calls[mockUpdateJournal.mock.calls.length - 1][0] as { content: string; tags: string[] };
        expect(lastCall.tags).toEqual(['SMART Tool', 'FIVE_QUESTIONS']);
        const decoded = JSON.parse(lastCall.content.replace(/^ENC:/, ''));
        expect(decoded.data.q1IsTrue).toBe('no');
        expect(decoded.data.turnaroundRating).toBe(4);
    });

    it('resumes directly into the summary phase when the saved draft is already complete', async () => {
        mockResumeDoc(
            {
                thought: 'a', q1Explanation: 'b', q1IsTrue: 'no', q2Explanation: 'c', q2CanKnow: 'no',
                q3Reaction: 'd', q4WithoutThought: 'e', turnaround: 'f', turnaroundRating: 3,
            },
            ['SMART Tool', 'FIVE_QUESTIONS', 'DRAFT']
        );
        render(<FiveQuestionsTool />);

        await waitFor(() => expect(screen.getByText('Examining: "a"')).toBeInTheDocument());
        expect(screen.queryByText("What's the thought or belief you want to examine?")).not.toBeInTheDocument();
    });

    it('resumes directly into the guided phase when the saved draft is incomplete', async () => {
        mockResumeDoc(
            {
                thought: 'Something I keep telling myself', q1Explanation: '', q1IsTrue: '', q2Explanation: '', q2CanKnow: '',
                q3Reaction: '', q4WithoutThought: '', turnaround: '', turnaroundRating: 0,
            },
            ['SMART Tool', 'FIVE_QUESTIONS', 'DRAFT']
        );
        render(<FiveQuestionsTool />);

        await waitFor(() => expect(screen.getByText('Step 1 of 5 — Q1 — Is It True?')).toBeInTheDocument());
    });
});
