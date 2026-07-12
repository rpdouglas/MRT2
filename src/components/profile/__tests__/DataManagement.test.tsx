/**
 * src/components/profile/__tests__/DataManagement.test.tsx
 * QA: Project 58 Phase 3 — the import-failure path used to report a single generic
 * "Check console for details" message regardless of cause. These tests verify
 * describeImportError's classification is actually wired up: a bad JSON file, a
 * permission error, and a network error each get a distinct, actionable message.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DataManagement from '../DataManagement';
import { importLegacyJournals } from '../../../lib/importer';

vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: vi.fn(() => ({
        user: { uid: 'test-user-123', providerData: [{ providerId: 'password' }] },
        driveAccessToken: null,
        reauthenticateWithEmail: vi.fn(),
        reauthenticateWithGoogle: vi.fn(),
        deleteAccount: vi.fn(),
    })),
}));

vi.mock('../../../contexts/EncryptionContext', () => ({
    useEncryption: vi.fn(() => ({ isVaultUnlocked: true })),
}));

vi.mock('../../../lib/firebase', () => ({ db: { type: 'mock-db' } }));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        doc: vi.fn(() => ({})),
        setDoc: vi.fn().mockResolvedValue(undefined),
        updateDoc: vi.fn().mockResolvedValue(undefined),
        getDoc: vi.fn().mockResolvedValue({ exists: () => false, data: () => ({}) }),
    };
});

vi.mock('../../../lib/db', () => ({ fetchAllUserData: vi.fn() }));
vi.mock('../../../lib/exporter', () => ({
    prepareDataForExport: vi.fn(),
    generateJSON: vi.fn(),
    generatePDF: vi.fn(),
}));
vi.mock('../../../lib/importer', () => ({ importLegacyJournals: vi.fn() }));
vi.mock('../../../lib/deletion', () => ({ executeTotalAccountAnnihilation: vi.fn() }));

vi.mock('../../PremiumGate', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('../../VaultGate', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

function renderDataManagement() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <DataManagement />
            </BrowserRouter>
        </QueryClientProvider>
    );
}

function selectFile(file: File) {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
}

describe('📤 DataManagement — Import Error Messages (Project 58 Phase 3)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('1. reports a JSON-specific message when the file fails to parse', async () => {
        vi.mocked(importLegacyJournals).mockRejectedValueOnce(new SyntaxError('Unexpected token'));
        renderDataManagement();

        selectFile(new File(['not json'], 'backup.json', { type: 'application/json' }));

        expect(await screen.findByText(/isn't valid JSON/i)).toBeInTheDocument();
    });

    it('2. reports a permission-specific message for a permission-denied write', async () => {
        vi.mocked(importLegacyJournals).mockRejectedValueOnce({ code: 'permission-denied' });
        renderDataManagement();

        selectFile(new File(['{}'], 'backup.json', { type: 'application/json' }));

        expect(await screen.findByText(/don't have permission/i)).toBeInTheDocument();
    });

    it('3. reports a connection-specific message for a network failure', async () => {
        vi.mocked(importLegacyJournals).mockRejectedValueOnce({ code: 'unavailable' });
        renderDataManagement();

        selectFile(new File(['{}'], 'backup.json', { type: 'application/json' }));

        expect(await screen.findByText(/lost connection/i)).toBeInTheDocument();
    });

    it('4. falls back to an actionable generic message for an unrecognized failure, never "check console"', async () => {
        vi.mocked(importLegacyJournals).mockRejectedValueOnce(new Error('boom'));
        renderDataManagement();

        selectFile(new File(['{}'], 'backup.json', { type: 'application/json' }));

        const message = await screen.findByText(/couldn't import this file/i);
        expect(message).toBeInTheDocument();
        expect(screen.queryByText(/check console/i)).not.toBeInTheDocument();
    });

    it('5. reports success with the entry count on a clean import', async () => {
        vi.mocked(importLegacyJournals).mockResolvedValueOnce({ success: 4, errors: 1 });
        renderDataManagement();

        selectFile(new File(['{}'], 'backup.json', { type: 'application/json' }));

        expect(await screen.findByText(/Imported 4 entries\. \(1 skipped\)/i)).toBeInTheDocument();
    });
});
