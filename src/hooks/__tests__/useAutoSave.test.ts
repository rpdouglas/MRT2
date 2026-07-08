/**
 * src/hooks/__tests__/useAutoSave.test.ts
 * QA: Strict timing and state boundary tests for the useAutoSave hook.
 * Verifies debounce logic, delegation to the injected saveAnswer mutation, and
 * duplicate-save prevention. Firestore/encryption concerns live in
 * useWorkbookAnswers now, so this hook is tested against a mocked saveAnswer.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../useAutoSave';

describe('💾 useAutoSave Engine', () => {
    const makeProps = (overrides: Partial<Parameters<typeof useAutoSave>[0]> = {}) => ({
        sectionId: 'sec1',
        questionId: 'q1',
        value: '',
        saveAnswer: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    });

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

    it('1. should initialize in an idle state', () => {
        const { result } = renderHook(() => useAutoSave(makeProps()));
        expect(result.current.status).toBe('idle');
        expect(result.current.lastSavedAt).toBeNull();
    });

    it('2. should not trigger save if value is empty', () => {
        const props = makeProps({ value: ' ' });
        renderHook(() => useAutoSave(props));
        act(() => { vi.advanceTimersByTime(3000); });

        expect(props.saveAnswer).not.toHaveBeenCalled();
    });

    it('3. should debounce typing and trigger save after 2 seconds of inactivity', async () => {
        const props = makeProps({ value: 'Initial text' });
        const { result, rerender } = renderHook(
            (p) => useAutoSave(p),
            { initialProps: props }
        );

        // User keeps typing within the 2 second window
        rerender({ ...props, value: 'Initial text updated' });
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        rerender({ ...props, value: 'Initial text updated again' });
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        // Ensure nothing has saved yet because we keep interrupting the timer
        expect(props.saveAnswer).not.toHaveBeenCalled();

        // Now wait the full 2 seconds (using async timer advance to flush promises)
        await act(async () => {
            await vi.advanceTimersByTimeAsync(2000);
        });

        expect(result.current.status).toBe('saved');
        expect(props.saveAnswer).toHaveBeenCalledTimes(1);

        // Verify the payload shape — the hook delegates encryption/Firestore to saveAnswer
        expect(props.saveAnswer).toHaveBeenCalledWith({
            sectionId: 'sec1',
            questionId: 'q1',
            plaintext: 'Initial text updated again',
        });
    });

    it('4. should not save if the value is identical to the previously saved value', async () => {
        const props = makeProps({ value: 'Final Answer' });
        const { result, rerender } = renderHook(
            (p) => useAutoSave(p),
            { initialProps: props }
        );

        // Trigger first save
        await act(async () => {
            await vi.advanceTimersByTimeAsync(2000);
        });
        expect(result.current.status).toBe('saved');
        expect(props.saveAnswer).toHaveBeenCalledTimes(1);

        // User edits, but puts it back to the exact same text before the debounce finishes
        rerender({ ...props, value: 'Final Answer' });

        await act(async () => {
            await vi.advanceTimersByTimeAsync(2000);
        });

        // Should NOT have called saveAnswer a second time
        expect(props.saveAnswer).toHaveBeenCalledTimes(1);
    });

    it('5. should set error status if saveAnswer rejects', async () => {
        const props = makeProps({ value: 'Will fail', saveAnswer: vi.fn().mockRejectedValue(new Error('offline')) });
        const { result } = renderHook(() => useAutoSave(props));

        await act(async () => {
            await vi.advanceTimersByTimeAsync(2000);
        });

        expect(result.current.status).toBe('error');
    });
});
