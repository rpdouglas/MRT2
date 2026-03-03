import os

test_content = r'''/**
 * src/hooks/__tests__/useAutoSave.test.ts
 * GITHUB COMMENT:
 * [useAutoSave.test.ts]
 * QA: Implemented strict timing and state boundary tests for the useAutoSave hook.
 * Verifies debounce logic, encryption payload mapping, and duplicate-save prevention.
 * FIX: Replaced synchronous timer advances and waitFor with vi.advanceTimersByTimeAsync to resolve React state update hanging/timeouts.
 * FIX: Resolved ESLint 'any' type error and removed unused disable directive.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../useAutoSave';
import * as EncryptionContext from '../../contexts/EncryptionContext';
import * as firestore from 'firebase/firestore';

// Mock Firebase config
vi.mock('../../lib/firebase', () => ({
    db: {}
}));

// Mock Firestore
vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual as Record<string, unknown>,
        doc: vi.fn((_db, ...paths) => paths.join('/')), // Simple string path for easy assertion
        setDoc: vi.fn().mockResolvedValue(undefined),
        Timestamp: {
            now: vi.fn(() => 'mocked-timestamp')
        }
    };
});

// Mock Encryption Context
vi.mock('../../contexts/EncryptionContext', () => ({
    useEncryption: vi.fn()
}));

describe('💾 useAutoSave Engine', () => {
    const defaultProps = {
        uid: 'user123',
        workbookId: 'wb1',
        sectionId: 'sec1',
        questionId: 'q1',
        value: ''
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        
        // Mock encrypt to return a predictable ciphertext
        vi.mocked(EncryptionContext.useEncryption).mockReturnValue({
            encrypt: vi.fn().mockResolvedValue('encrypted-secret-text'),
        } as unknown as ReturnType<typeof EncryptionContext.useEncryption>);
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('1. should initialize in an idle state', () => {
        const { result } = renderHook(() => useAutoSave(defaultProps));
        expect(result.current.status).toBe('idle');
        expect(result.current.lastSavedAt).toBeNull();
    });

    it('2. should not trigger save if value is empty', () => {
        renderHook(() => useAutoSave({ ...defaultProps, value: '   ' }));
        
        act(() => {
            vi.advanceTimersByTime(3000);
        });
        
        expect(firestore.setDoc).not.toHaveBeenCalled();
    });

    it('3. should debounce typing and trigger save after 2 seconds of inactivity', async () => {
        // Start with a value
        const { result, rerender } = renderHook(
            (props) => useAutoSave(props), 
            { initialProps: { ...defaultProps, value: 'Initial text' } }
        );

        // User keeps typing within the 2 second window
        rerender({ ...defaultProps, value: 'Initial text updated' });
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        
        rerender({ ...defaultProps, value: 'Initial text updated again' });
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        // Ensure nothing has saved yet because we keep interrupting the timer
        expect(firestore.setDoc).not.toHaveBeenCalled();

        // Now wait the full 2 seconds (using async timer advance to flush promises)
        await act(async () => {
            await vi.advanceTimersByTimeAsync(2000);
        });

        expect(result.current.status).toBe('saved');
        expect(firestore.setDoc).toHaveBeenCalledTimes(1);
        
        // Verify the payload shape
        expect(firestore.setDoc).toHaveBeenCalledWith(
            'users/user123/workbook_answers/wb1_q1', // Mocked doc() output
            expect.objectContaining({
                uid: 'user123',
                workbookId: 'wb1',
                questionId: 'q1',
                answer: 'encrypted-secret-text', // Verifies encryption happened
                isEncrypted: true
            }),
            { merge: true }
        );
    });

    it('4. should not save if the value is identical to the previously saved value', async () => {
        const { result, rerender } = renderHook(
            (props) => useAutoSave(props), 
            { initialProps: { ...defaultProps, value: 'Final Answer' } }
        );

        // Trigger first save
        await act(async () => {
            await vi.advanceTimersByTimeAsync(2000);
        });
        expect(result.current.status).toBe('saved');
        expect(firestore.setDoc).toHaveBeenCalledTimes(1);

        // User edits, but puts it back to the exact same text before the debounce finishes
        rerender({ ...defaultProps, value: 'Final Answer' });
        
        await act(async () => {
            await vi.advanceTimersByTimeAsync(2000);
        });

        // Should NOT have called setDoc a second time
        expect(firestore.setDoc).toHaveBeenCalledTimes(1);
    });
});
'''

def write_file(path, content):
    dirname = os.path.dirname(path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    final_content = content.replace("~~~", "```").strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Surgically patched Test File: {path}")

if __name__ == "__main__":
    write_file("src/hooks/__tests__/useAutoSave.test.ts", test_content)
    print("✨ SRE Fix complete.")