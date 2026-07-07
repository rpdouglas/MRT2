/**
 * src/components/smart_tools/__tests__/SmartToolContainer.test.tsx
 * PROJ-50: Guided CBT/REBT Interactive Workflows
 * Regression test for the duplicate-save bug: the first save (no currentDocId)
 * must capture the new doc's id from addJournal's returned DocumentReference,
 * so a second save in the same mount updates that doc instead of creating another.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartToolContainer } from '../SmartToolContainer';

vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({ user: { uid: 'test-uid' } }),
}));

const mockEncrypt = vi.fn(async (plain: string) => `ENC:${plain}`);
const mockDecrypt = vi.fn(async (cipher: string) => cipher.replace(/^ENC:/, ''));

vi.mock('../../../contexts/EncryptionContext', () => ({
    useEncryption: () => ({
        isVaultUnlocked: true,
        encrypt: mockEncrypt,
        decrypt: mockDecrypt,
    }),
}));

const mockAddJournal = vi.fn();
const mockUpdateJournal = vi.fn();

vi.mock('../../../hooks/useJournalOperations', () => ({
    useJournalOperations: () => ({
        addJournal: mockAddJournal,
        updateJournal: mockUpdateJournal,
    }),
}));

vi.mock('../../../lib/firebase', () => ({ db: { type: 'mock-db' } }));

interface TestPayload { note: string; }

describe('🧩 SmartToolContainer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAddJournal.mockResolvedValue({ id: 'doc-abc-1' });
        mockUpdateJournal.mockResolvedValue(undefined);
    });

    it('sets currentDocId from the first save and updates (not re-adds) on a second save', async () => {
        render(
            <SmartToolContainer<TestPayload> toolType="ABC" toolLabel="Test Tool" initialData={{ note: '' }}>
                {({ save }) => (
                    <button onClick={() => save({ note: 'hello' })}>Save</button>
                )}
            </SmartToolContainer>
        );

        const button = screen.getByText('Save');

        fireEvent.click(button);
        await waitFor(() => expect(mockAddJournal).toHaveBeenCalledTimes(1));
        expect(mockUpdateJournal).not.toHaveBeenCalled();

        fireEvent.click(button);
        await waitFor(() => expect(mockUpdateJournal).toHaveBeenCalledTimes(1));
        expect(mockAddJournal).toHaveBeenCalledTimes(1); // still just once — no duplicate doc
        expect(mockUpdateJournal).toHaveBeenCalledWith(expect.objectContaining({ id: 'doc-abc-1' }));
    });

    it('hides the default header save button when hideDefaultSaveButton is true', () => {
        render(
            <SmartToolContainer<TestPayload> toolType="ABC" toolLabel="Test Tool" initialData={{ note: '' }} hideDefaultSaveButton>
                {() => <div>Child content</div>}
            </SmartToolContainer>
        );

        expect(screen.queryByText('Save to Journal')).not.toBeInTheDocument();
    });

    it('shows the default header save button by default', () => {
        render(
            <SmartToolContainer<TestPayload> toolType="ABC" toolLabel="Test Tool" initialData={{ note: '' }}>
                {() => <div>Child content</div>}
            </SmartToolContainer>
        );

        expect(screen.getByText('Save to Journal')).toBeInTheDocument();
    });

    it('applies extra tags passed to save() alongside the base SMART Tool tags', async () => {
        render(
            <SmartToolContainer<TestPayload> toolType="ABC" toolLabel="Test Tool" initialData={{ note: '' }}>
                {({ save }) => <button onClick={() => save({ note: 'draft text' }, ['DRAFT'])}>SaveDraft</button>}
            </SmartToolContainer>
        );

        fireEvent.click(screen.getByText('SaveDraft'));

        await waitFor(() => expect(mockAddJournal).toHaveBeenCalledWith(
            expect.objectContaining({ tags: ['SMART Tool', 'ABC', 'DRAFT'] })
        ));
    });
});
