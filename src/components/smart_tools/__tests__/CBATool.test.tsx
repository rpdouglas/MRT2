/**
 * src/components/smart_tools/__tests__/CBATool.test.tsx
 * PROJ-50 Phase 3: Guided CBA Flow
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CBATool } from '../CBATool';
import { useAuth } from '../../../contexts/AuthContext';
import { generateCBAReflection } from '../../../lib/gemini';
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

vi.mock('../../../lib/gemini', () => ({ generateCBAReflection: vi.fn() }));

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

interface CBAPayloadLike {
    behavior: string;
    advantagesDoing: string[];
    disadvantagesDoing: string[];
    advantagesStopping: string[];
    disadvantagesStopping: string[];
}

const mockResumeDoc = (payload: CBAPayloadLike, tags: string[]) => {
    const content = `ENC:${JSON.stringify({ metadata: { type: 'CBA', version: '2.0', lastSaved: new Date().toISOString() }, data: payload })}`;
    vi.mocked(firestore.getDocs).mockResolvedValueOnce({
        empty: false,
        docs: [{
            id: 'existing-doc',
            data: () => ({ isEncrypted: true, content, tags, createdAt: { toDate: () => new Date() } }),
        }],
    } as unknown as firestore.QuerySnapshot);
};

const addQuadrantItem = (placeholder: string, value: string) => {
    fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
    fireEvent.keyDown(screen.getByPlaceholderText(placeholder), { key: 'Enter' });
};

describe('⚖️ CBATool (Guided CBA flow)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAddJournal.mockResolvedValue({ id: 'new-doc' });
        (useAuth as Mock).mockReturnValue({ user: { uid: 'test-uid' }, userTier: 'free' });
        vi.mocked(firestore.getDocs).mockResolvedValue({ empty: true, docs: [] } as unknown as firestore.QuerySnapshot);
    });

    it('disables Continue with an empty behavior and enables it once typed', async () => {
        render(<CBATool />);
        await waitFor(() => screen.getByPlaceholderText('e.g. Drinking, Isolating'));

        const continueButton = screen.getByText('Continue →');
        expect(continueButton).toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText('e.g. Drinking, Isolating'), { target: { value: 'Drinking' } });
        expect(continueButton).not.toBeDisabled();
    });

    it('transitions to the guided phase and interpolates the entered behavior into the quadrant question', async () => {
        render(<CBATool />);
        await waitFor(() => screen.getByPlaceholderText('e.g. Drinking, Isolating'));

        fireEvent.change(screen.getByPlaceholderText('e.g. Drinking, Isolating'), { target: { value: 'Drinking' } });
        fireEvent.click(screen.getByText('Continue →'));

        await waitFor(() => expect(screen.getByText('Step 1 of 4 — Advantages of Drinking')).toBeInTheDocument());
        expect(screen.getByText('What does Drinking actually give you?')).toBeInTheDocument();
    });

    it('walks through all 4 quadrants and reaches the summary phase', async () => {
        render(<CBATool />);
        await waitFor(() => screen.getByPlaceholderText('e.g. Drinking, Isolating'));
        fireEvent.change(screen.getByPlaceholderText('e.g. Drinking, Isolating'), { target: { value: 'Drinking' } });
        fireEvent.click(screen.getByText('Continue →'));

        await waitFor(() => screen.getByPlaceholderText('e.g., Relief from anxiety, at least for a while'));
        addQuadrantItem('e.g., Relief from anxiety, at least for a while', 'Relief from stress');
        fireEvent.click(screen.getByText('Next →'));

        await waitFor(() => screen.getByPlaceholderText('e.g., Damaged trust with my family'));
        addQuadrantItem('e.g., Damaged trust with my family', 'Damaged trust');
        fireEvent.click(screen.getByText('Next →'));

        await waitFor(() => screen.getByPlaceholderText('e.g., Waking up clear-headed'));
        addQuadrantItem('e.g., Waking up clear-headed', 'Clear head');
        fireEvent.click(screen.getByText('Next →'));

        await waitFor(() => screen.getByPlaceholderText("e.g., Losing my main way to unwind after work"));
        addQuadrantItem("e.g., Losing my main way to unwind after work", 'Losing my routine');
        fireEvent.click(screen.getByText('Finish'));

        await waitFor(() => expect(screen.getByText('Reviewing: Drinking')).toBeInTheDocument());
        expect(screen.getByText('Advantages of Doing')).toBeInTheDocument();
        expect(screen.getByText('Relief from stress')).toBeInTheDocument();
        expect(screen.getByText('Losing my routine')).toBeInTheDocument();
    });

    it('preserves behavior through a mid-guided "Save Progress" call', async () => {
        render(<CBATool />);
        await waitFor(() => screen.getByPlaceholderText('e.g. Drinking, Isolating'));
        fireEvent.change(screen.getByPlaceholderText('e.g. Drinking, Isolating'), { target: { value: 'Isolating' } });
        fireEvent.click(screen.getByText('Continue →'));

        await waitFor(() => screen.getByPlaceholderText('e.g., Relief from anxiety, at least for a while'));
        addQuadrantItem('e.g., Relief from anxiety, at least for a while', 'Alone time');
        fireEvent.click(screen.getByText('Save Progress'));

        await waitFor(() => expect(mockUpdateJournal).toHaveBeenCalledTimes(1));
        const savedCipher = (mockUpdateJournal.mock.calls[0][0] as { content: string }).content;
        const decoded = JSON.parse(savedCipher.replace(/^ENC:/, ''));
        expect(decoded.data.behavior).toBe('Isolating');
        expect(decoded.data.advantagesDoing).toEqual(['Alone time']);
    });

    it('drops the DRAFT tag only on the summary phase\'s final save, with the full 5-field payload', async () => {
        mockResumeDoc(
            { behavior: 'Drinking', advantagesDoing: ['a'], disadvantagesDoing: ['b'], advantagesStopping: ['c'], disadvantagesStopping: ['d'] },
            ['SMART Tool', 'CBA', 'DRAFT']
        );
        render(<CBATool />);

        await waitFor(() => expect(screen.getByText('Reviewing: Drinking')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Save to Journal'));

        await waitFor(() => expect(mockUpdateJournal).toHaveBeenCalledTimes(1));
        const call = mockUpdateJournal.mock.calls[0][0] as { content: string; tags: string[] };
        expect(call.tags).toEqual(['SMART Tool', 'CBA']);
        const decoded = JSON.parse(call.content.replace(/^ENC:/, ''));
        expect(Object.keys(decoded.data).sort()).toEqual(
            ['advantagesDoing', 'advantagesStopping', 'behavior', 'disadvantagesDoing', 'disadvantagesStopping'].sort()
        );
    });

    it('resumes directly into the summary phase when the saved draft is already complete', async () => {
        mockResumeDoc(
            { behavior: 'Drinking', advantagesDoing: ['a'], disadvantagesDoing: ['b'], advantagesStopping: ['c'], disadvantagesStopping: ['d'] },
            ['SMART Tool', 'CBA', 'DRAFT']
        );
        render(<CBATool />);

        await waitFor(() => expect(screen.getByText('Reviewing: Drinking')).toBeInTheDocument());
        expect(screen.queryByText('Continue →')).not.toBeInTheDocument();
        expect(screen.queryByText(/Step 1 of 4/)).not.toBeInTheDocument();
    });

    it('resumes directly into the guided phase when behavior is set but quadrants are incomplete', async () => {
        mockResumeDoc(
            { behavior: 'Drinking', advantagesDoing: [], disadvantagesDoing: [], advantagesStopping: [], disadvantagesStopping: [] },
            ['SMART Tool', 'CBA', 'DRAFT']
        );
        render(<CBATool />);

        await waitFor(() => expect(screen.getByText('Step 1 of 4 — Advantages of Drinking')).toBeInTheDocument());
        expect(screen.queryByText('Continue →')).not.toBeInTheDocument();
    });

    it('gates the AI reflection behind Premium', async () => {
        mockResumeDoc(
            { behavior: 'Drinking', advantagesDoing: ['a'], disadvantagesDoing: ['b'], advantagesStopping: ['c'], disadvantagesStopping: ['d'] },
            ['SMART Tool', 'CBA', 'DRAFT']
        );
        (useAuth as Mock).mockReturnValue({ user: { uid: 'test-uid' }, userTier: 'free' });
        render(<CBATool />);

        await waitFor(() => expect(screen.getByText('Reviewing: Drinking')).toBeInTheDocument());
        expect(screen.queryByText('What does this tell you?')).not.toBeInTheDocument();
        expect(generateCBAReflection).not.toHaveBeenCalled();
    });

    it('calls the AI reflection for Premium users and renders the result', async () => {
        mockResumeDoc(
            { behavior: 'Drinking', advantagesDoing: ['a'], disadvantagesDoing: ['b'], advantagesStopping: ['c'], disadvantagesStopping: ['d'] },
            ['SMART Tool', 'CBA', 'DRAFT']
        );
        (useAuth as Mock).mockReturnValue({ user: { uid: 'test-uid' }, userTier: 'premium' });
        (generateCBAReflection as Mock).mockResolvedValue('You seem to value connection more than you value escape.');
        render(<CBATool />);

        await waitFor(() => expect(screen.getByText('Reviewing: Drinking')).toBeInTheDocument());
        fireEvent.click(screen.getByText('What does this tell you?'));

        await waitFor(() => expect(generateCBAReflection).toHaveBeenCalledWith('Drinking', {
            advantagesDoing: ['a'], disadvantagesDoing: ['b'], advantagesStopping: ['c'], disadvantagesStopping: ['d'],
        }));
        expect(await screen.findByText('You seem to value connection more than you value escape.')).toBeInTheDocument();
    });
});
