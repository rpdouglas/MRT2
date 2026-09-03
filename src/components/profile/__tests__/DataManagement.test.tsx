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
import { importBackup } from '../../../lib/importer';

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
    useEncryption: vi.fn(() => ({ isVaultUnlocked: true, encrypt: vi.fn(async (t: string) => `cipher:${t}`) })),
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
vi.mock('../../../lib/importer', () => ({ importBackup: vi.fn() }));
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
        vi.mocked(importBackup).mockRejectedValueOnce(new SyntaxError('Unexpected token'));
        renderDataManagement();

        selectFile(new File(['not json'], 'backup.json', { type: 'application/json' }));

        expect(await screen.findByText(/isn't valid JSON/i)).toBeInTheDocument();
    });

    it('2. reports a permission-specific message for a permission-denied write', async () => {
        vi.mocked(importBackup).mockRejectedValueOnce({ code: 'permission-denied' });
        renderDataManagement();

        selectFile(new File(['{}'], 'backup.json', { type: 'application/json' }));

        expect(await screen.findByText(/don't have permission/i)).toBeInTheDocument();
    });

    it('3. reports a connection-specific message for a network failure', async () => {
        vi.mocked(importBackup).mockRejectedValueOnce({ code: 'unavailable' });
        renderDataManagement();

        selectFile(new File(['{}'], 'backup.json', { type: 'application/json' }));

        expect(await screen.findByText(/lost connection/i)).toBeInTheDocument();
    });

    it('4. falls back to an actionable generic message for an unrecognized failure, never "check console"', async () => {
        vi.mocked(importBackup).mockRejectedValueOnce(new Error('boom'));
        renderDataManagement();

        selectFile(new File(['{}'], 'backup.json', { type: 'application/json' }));

        const message = await screen.findByText(/couldn't import this file/i);
        expect(message).toBeInTheDocument();
        expect(screen.queryByText(/check console/i)).not.toBeInTheDocument();
    });

    it('5. reports success with the entry count on a clean import', async () => {
        vi.mocked(importBackup).mockResolvedValueOnce({
            journals: { success: 4, errors: 1 },
            tasks: { success: 0, errors: 0 },
            workbookAnswers: { success: 0, errors: 0 },
            gameProgress: { success: 0, errors: 0 },
        });
        renderDataManagement();

        selectFile(new File(['{}'], 'backup.json', { type: 'application/json' }));

        expect(await screen.findByText(/Imported 4 journals\. \(1 skipped\)/i)).toBeInTheDocument();
    });

    // PROJ-110: a real backup restores more than just journals — the summary
    // should name every non-empty category, not just journal count.
    it('6. reports a multi-collection summary when the backup restores more than just journals', async () => {
        vi.mocked(importBackup).mockResolvedValueOnce({
            journals: { success: 4, errors: 1 },
            tasks: { success: 2, errors: 0 },
            workbookAnswers: { success: 6, errors: 0 },
            gameProgress: { success: 1, errors: 0 },
        });
        renderDataManagement();

        selectFile(new File(['{}'], 'backup.json', { type: 'application/json' }));

        expect(await screen.findByText(
            /Imported 4 journals, 2 tasks, 6 workbook answers, 1 game history\. \(1 skipped\)/i
        )).toBeInTheDocument();
    });

    // PROJ-110: importBackup re-encrypts recovered content through the live
    // vault key — if the vault is locked, that must fail closed with a clear
    // message, not a generic "couldn't import" dead end.
    it('7. reports a vault-locked-specific message when re-encryption fails', async () => {
        vi.mocked(importBackup).mockRejectedValueOnce(new Error('Vault is locked'));
        renderDataManagement();

        selectFile(new File(['{}'], 'backup.json', { type: 'application/json' }));

        expect(await screen.findByText(/your vault is locked/i)).toBeInTheDocument();
    });
});
