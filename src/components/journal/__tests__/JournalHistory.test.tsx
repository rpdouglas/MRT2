import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import JournalHistory from '../JournalHistory';

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

const mockDeleteJournal = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../hooks/useJournalOperations', () => ({
    useJournalOperations: () => ({ deleteJournal: mockDeleteJournal }),
}));

vi.mock('../../../lib/firebase', () => ({ db: { type: 'mock-db' } }));

vi.mock('react-router-dom', () => {
    const searchParams = new URLSearchParams();
    return {
        useSearchParams: () => [searchParams, vi.fn()],
        useNavigate: () => vi.fn(),
    };
});

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

// Mock react-virtuoso to render list items normally in JSDOM, since virtuoso relies on DOM measurement
vi.mock('react-virtuoso', () => ({
    Virtuoso: ({ data, itemContent }: { data: unknown[]; itemContent: (index: number, item: unknown) => ReactNode }) => {
        return (
            <div data-testid="mock-virtuoso">
                {data.map((item: unknown, index: number) => (
                    <div key={index}>
                        {itemContent(index, item)}
                    </div>
                ))}
            </div>
        );
    },
}));

const mockWriteText = vi.fn().mockResolvedValue(undefined);
const mockShare = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        configurable: true,
    });
    Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
        writable: true,
    });
});

const renderHistory = (entries: unknown[]) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                // Manually-seeded cache data (below) is the test's source of truth — without this,
                // the default staleTime triggers a background refetch on mount that resolves via the
                // module-level getDocs mock (empty docs) and silently overwrites it once anything awaits.
                staleTime: Infinity,
            },
        },
    });
    // Set query data for the active cache key
    queryClient.setQueryData(['journals', 'test-uid', true], entries);

    return render(
        <QueryClientProvider client={queryClient}>
            <JournalHistory onEdit={vi.fn()} />
        </QueryClientProvider>
    );
};

describe('JournalHistory Sharing', () => {
    // Current year is set to today's year to ensure it gets expanded by default
    const currentYearStr = new Date().getFullYear().toString();
    const currentMonthIndex = new Date().getMonth();

    const testEntries = [
        {
            id: 'entry-1',
            content: 'Today I processed some difficult emotions.',
            isEncrypted: false,
            createdAt: new Date(`${currentYearStr}-${String(currentMonthIndex + 1).padStart(2, '0')}-01T12:00:00.000Z`),
            moodScore: 7,
            tags: ['emotions'],
        },
    ];

    it('shares formatting with myrecoverytoolkit.ca at the end via navigator.share if available', async () => {
        renderHistory(testEntries);

        const shareBtn = screen.getByTitle('Share Entry');
        await act(async () => {
            fireEvent.click(shareBtn);
        });

        expect(mockShare).toHaveBeenCalled();
        const shareArg = mockShare.mock.calls[0][0];
        expect(shareArg.title).toBe('Journal Entry');
        expect(shareArg.text).toContain('Today I processed some difficult emotions.');
        expect(shareArg.text).toContain('myrecoverytoolkit.ca');
        expect(shareArg.text.endsWith('myrecoverytoolkit.ca')).toBe(true);
    });

    it('shares formatting with myrecoverytoolkit.ca via clipboard fallback if navigator.share is not supported', async () => {
        // Force clipboard path by setting navigator.share to undefined
        Object.defineProperty(navigator, 'share', {
            value: undefined,
            configurable: true,
            writable: true,
        });

        renderHistory(testEntries);

        const shareBtn = screen.getByTitle('Share Entry');
        await act(async () => {
            fireEvent.click(shareBtn);
        });

        expect(mockWriteText).toHaveBeenCalled();
        const copyText = mockWriteText.mock.calls[0][0];
        expect(copyText).toContain('Today I processed some difficult emotions.');
        expect(copyText).toContain('myrecoverytoolkit.ca');
        expect(copyText.endsWith('myrecoverytoolkit.ca')).toBe(true);
    });
});

describe('JournalHistory SMART Tool entries', () => {
    const currentYearStr = new Date().getFullYear().toString();
    const currentMonthIndex = new Date().getMonth();
    const createdAt = new Date(`${currentYearStr}-${String(currentMonthIndex + 1).padStart(2, '0')}-02T12:00:00.000Z`);

    const toolEntries = [
        {
            id: 'tool-entry-1',
            content: JSON.stringify({
                metadata: { type: 'CBA', version: '2.0', lastSaved: createdAt.toISOString() },
                data: { behavior: 'Drinking' },
            }),
            isEncrypted: false,
            createdAt,
            moodScore: 5,
            tags: ['SMART Tool', 'CBA'],
            toolPayload: { type: 'CBA', data: { behavior: 'Drinking' } },
        },
    ];

    it('renders a humanized headline instead of raw JSON', () => {
        renderHistory(toolEntries);

        expect(screen.getByText('Drinking')).toBeInTheDocument();
        expect(screen.queryByText(/"metadata"/)).not.toBeInTheDocument();
        expect(screen.getByText('Cost Benefit Analysis')).toBeInTheDocument();
    });

    it('expands to show humanized fields via PayloadSummaryList on click', async () => {
        renderHistory(toolEntries);

        const headlineBtn = screen.getByText('Drinking').closest('button');
        expect(headlineBtn).not.toBeNull();
        await act(async () => {
            fireEvent.click(headlineBtn!);
        });

        // The real question text (not a generic humanized field name) for CBA's `behavior` field.
        expect(screen.getByText('What behavior are we analyzing?')).toBeInTheDocument();
    });

    it('shares humanized text instead of raw JSON', async () => {
        renderHistory(toolEntries);

        const shareBtn = screen.getByTitle('Share Entry');
        await act(async () => {
            fireEvent.click(shareBtn);
        });

        expect(mockShare).toHaveBeenCalled();
        const shareArg = mockShare.mock.calls[0][0];
        expect(shareArg.text).toContain('What behavior are we analyzing?: Drinking');
        expect(shareArg.text).not.toContain('"metadata"');
    });

    it('does not render an Edit button for a SMART Tool entry', () => {
        renderHistory(toolEntries);

        expect(screen.queryByTitle('Edit Entry')).not.toBeInTheDocument();
    });

    it('shows the real question text for a Five Questions entry, not a generic field-name label', async () => {
        const fiveQuestionsEntry = {
            id: 'tool-entry-2',
            content: JSON.stringify({
                metadata: { type: 'FIVE_QUESTIONS', version: '2.0', lastSaved: createdAt.toISOString() },
                data: { thought: 'I need this drink', q1IsTrue: 'no' },
            }),
            isEncrypted: false,
            createdAt,
            moodScore: 5,
            tags: ['SMART Tool', 'FIVE_QUESTIONS'],
            toolPayload: { type: 'FIVE_QUESTIONS', data: { thought: 'I need this drink', q1IsTrue: 'no' } },
        };

        renderHistory([fiveQuestionsEntry]);

        const headlineBtn = screen.getByText('I need this drink').closest('button');
        await act(async () => {
            fireEvent.click(headlineBtn!);
        });

        expect(screen.getByText('Is It True?')).toBeInTheDocument();
        expect(screen.getByText('no')).toBeInTheDocument();
        expect(screen.queryByText('Q1 Is True')).not.toBeInTheDocument();
    });

    it('renders a Personify entry\'s personas as readable rows, not [object Object]', async () => {
        const personifyEntry = {
            id: 'tool-entry-3',
            content: JSON.stringify({
                metadata: { type: 'PERSONIFY', version: '2.0', lastSaved: createdAt.toISOString() },
                data: { personas: [{ id: 1, name: 'The Critic', action: 'You always fail.', result: "That's not true." }] },
            }),
            isEncrypted: false,
            createdAt,
            moodScore: 5,
            tags: ['SMART Tool', 'PERSONIFY'],
            toolPayload: {
                type: 'PERSONIFY',
                data: { personas: [{ id: 1, name: 'The Critic', action: 'You always fail.', result: "That's not true." }] },
            },
        };

        renderHistory([personifyEntry]);

        // "Personify & Disarm" appears twice (tool badge + headline fallback, since PERSONIFY has no HEADLINE_FIELD) — target the headline inside the toggle button.
        const headlineBtn = screen.getAllByText('Personify & Disarm').map(el => el.closest('button')).find(Boolean);
        await act(async () => {
            fireEvent.click(headlineBtn!);
        });

        expect(screen.getByText("Rogue's Name:")).toBeInTheDocument();
        expect(screen.getByText('The Critic')).toBeInTheDocument();
        expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
    });
});
