/**
 * src/components/journal/__tests__/JournalEditor.test.tsx
 * PROJ-57: Journal Template Modality Expansion — default template selection
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import JournalEditor from '../JournalEditor';
import { getUserTemplates } from '../../../lib/db';

const mockAuthValue = { user: { uid: 'test-uid' }, userTier: 'free' };
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: vi.fn(() => mockAuthValue),
}));

vi.mock('../../../contexts/EncryptionContext', () => ({
    useEncryption: () => ({
        isVaultUnlocked: true,
        encrypt: vi.fn(async (plain: string) => `ENC:${plain}`),
        decrypt: vi.fn(async (cipher: string) => cipher.replace(/^ENC:/, '')),
    }),
}));

const mockAddJournal = vi.fn().mockResolvedValue({ id: 'new-doc' });
const mockUpdateJournal = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../hooks/useJournalOperations', () => ({
    useJournalOperations: () => ({ addJournal: mockAddJournal, updateJournal: mockUpdateJournal }),
}));

vi.mock('../../../lib/firebase', () => ({ db: { type: 'mock-db' } }));

vi.mock('../../../lib/db', () => ({ getUserTemplates: vi.fn().mockResolvedValue([]) }));

vi.mock('../../../lib/weather', () => ({ getCurrentWeather: vi.fn().mockResolvedValue(null) }));

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

vi.mock('../AudioRecorder', () => ({ default: () => null }));

const renderEditor = async () => {
    const queryClient = new QueryClient();
    const utils = render(
        <QueryClientProvider client={queryClient}>
            <JournalEditor initialEntry={null} onSaveComplete={vi.fn()} />
        </QueryClientProvider>
    );
    // Flush the async loadCustomTemplates effect (and the state reset that
    // depends on it) before interacting with the picker, so it doesn't
    // clobber a selection made mid-flight.
    await waitFor(() => expect(vi.mocked(getUserTemplates)).toHaveBeenCalled());
    await act(async () => {});
    return utils;
};

const selectTemplate = (templateId: string) => {
    fireEvent.change(screen.getByRole('combobox'), { target: { value: templateId } });
};

describe('JournalEditor default template selection (PROJ-57)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAddJournal.mockResolvedValue({ id: 'new-doc' });
    });

    it('drops a content-shaped default template straight into the free-write textarea', async () => {
        await renderEditor();

        selectTemplate('morning_intention');

        const textarea = await screen.findByPlaceholderText('How are you feeling today?');
        expect((textarea as HTMLTextAreaElement).value).toContain('Morning Intention');
        expect(screen.queryByText('Switch to Text Mode')).not.toBeInTheDocument();
    });

    it('renders a prompts-shaped default template as a guided form sized to its prompts', async () => {
        await renderEditor();

        selectTemplate('thought_check_in');

        await waitFor(() => expect(screen.getByRole('heading', { name: 'Thought Check-In' })).toBeInTheDocument());
        expect(screen.getAllByPlaceholderText('Type your answer...')).toHaveLength(5);
        expect(screen.queryByPlaceholderText('How are you feeling today?')).not.toBeInTheDocument();
    });

    it('saves a prompts-based default template with prompts interpolated into the entry content', async () => {
        await renderEditor();

        selectTemplate('thought_check_in');
        await waitFor(() => expect(screen.getByRole('heading', { name: 'Thought Check-In' })).toBeInTheDocument());

        const answers = screen.getAllByPlaceholderText('Type your answer...');
        fireEvent.change(answers[0], { target: { value: 'Sitting alone at home.' } });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => expect(mockAddJournal).toHaveBeenCalled());
        const savedContent = mockAddJournal.mock.calls[0][0].content as string;
        expect(savedContent).toContain('Situation:');
        expect(savedContent).toContain('Sitting alone at home.');
        expect(savedContent).toContain('-(Skipped)-');
    });
});
