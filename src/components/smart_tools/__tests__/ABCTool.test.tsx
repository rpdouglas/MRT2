/**
 * src/components/smart_tools/__tests__/ABCTool.test.tsx
 * PROJ-50: Guided CBT/REBT Interactive Workflows
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ABCTool } from '../ABCTool';

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

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

const fillStep = (placeholder: string, value: string) => {
    fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
};

describe('🧠 ABCTool (Guided ABCDE flow)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAddJournal.mockResolvedValue({ id: 'new-doc' });
    });

    it('renders the first step (Activating Event) with the spec-verbatim question', async () => {
        render(<ABCTool />);
        await waitFor(() => expect(screen.getByText('Step 1 of 5 — A — Activating Event')).toBeInTheDocument());
        expect(screen.getByText('What happened? Describe just the facts — what you saw, heard, or experienced.')).toBeInTheDocument();
    });

    it('renders the Socratic prompt card and distortion picker on Step D, and excludes the distortion from the saved payload', async () => {
        render(<ABCTool />);
        await waitFor(() => screen.getByPlaceholderText("e.g., My boss sent a vague email asking to 'talk later'."));

        fillStep("e.g., My boss sent a vague email asking to 'talk later'.", 'My sponsor missed our scheduled call today.');
        fireEvent.click(screen.getByText('Next →'));

        fillStep('e.g., I\'m definitely getting fired. I can never do anything right.', 'They probably think I am a lost cause.');
        fireEvent.click(screen.getByText('Next →'));

        fillStep('e.g., I felt panicked and my chest tightened. I wanted to drink to numb the anxiety.', 'I felt anxious and wanted to isolate myself completely.');
        fireEvent.click(screen.getByText('Next →'));

        await waitFor(() => expect(screen.getByText('Step 4 of 5 — D — Dispute')).toBeInTheDocument());
        expect(screen.getByText('Questions to challenge this belief')).toBeInTheDocument();
        expect(screen.getByText('Does this match a thinking pattern? (optional)')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Catastrophising'));

        fillStep('e.g., Where is the proof I\'m getting fired? We have a standard 1-on-1 scheduled today.', 'There could be many reasons for a missed call, not just abandonment.');
        fireEvent.click(screen.getByText('Next →'));

        fillStep('e.g., My boss probably just wants an update on the project. I will wait for facts before assuming the worst.', 'My sponsor is likely just busy; I can reach out again tomorrow.');
        fireEvent.click(screen.getByText('Finish'));

        await waitFor(() => expect(mockAddJournal).toHaveBeenCalledTimes(1));
        const savedCipher = (mockAddJournal.mock.calls[0][0] as { content: string }).content;
        const decoded = JSON.parse(savedCipher.replace(/^ENC:/, ''));
        expect(Object.keys(decoded.data).sort()).toEqual(
            ['activatingEvent', 'beliefs', 'consequences', 'dispute', 'effectiveBelief'].sort()
        );
        expect(decoded.data.dispute).not.toContain('Catastrophising');
    });
});
