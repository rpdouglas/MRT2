/**
 * src/hooks/__tests__/useGuidedDraft.test.ts
 * PROJ-50: Guided CBT/REBT Interactive Workflows
 * Verifies the sessionStorage-backed draft round-trip used by GuidedWorkflowEngine.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGuidedDraft, hasGuidedDraft } from '../useGuidedDraft';

describe('📝 useGuidedDraft Hook', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('returns null when no draft exists', () => {
        const { result } = renderHook(() => useGuidedDraft('ABC'));
        expect(result.current.getDraft()).toBeNull();
    });

    it('round-trips a draft through sessionStorage', () => {
        const { result } = renderHook(() => useGuidedDraft<{ activatingEvent: string }>('ABC'));

        act(() => {
            result.current.saveDraft(2, { activatingEvent: 'My sponsor missed our call.' });
        });

        expect(result.current.getDraft()).toEqual({
            currentStep: 2,
            stepData: { activatingEvent: 'My sponsor missed our call.' },
        });
    });

    it('clears the draft', () => {
        const { result } = renderHook(() => useGuidedDraft<{ activatingEvent: string }>('ABC'));

        act(() => {
            result.current.saveDraft(1, { activatingEvent: 'Something happened.' });
        });
        expect(result.current.getDraft()).not.toBeNull();

        act(() => {
            result.current.clearDraft();
        });
        expect(result.current.getDraft()).toBeNull();
    });

    it('scopes drafts independently per toolType', () => {
        const { result: abc } = renderHook(() => useGuidedDraft('ABC'));
        const { result: cba } = renderHook(() => useGuidedDraft('CBA'));

        act(() => {
            abc.current.saveDraft(0, { foo: 'abc-draft' });
        });

        expect(abc.current.getDraft()).not.toBeNull();
        expect(cba.current.getDraft()).toBeNull();
    });

    it('returns null and does not throw on malformed stored JSON', () => {
        sessionStorage.setItem('guidedDraft_ABC', '{not-json');
        const { result } = renderHook(() => useGuidedDraft('ABC'));
        expect(result.current.getDraft()).toBeNull();
    });

    describe('hasGuidedDraft (plain, non-hook check)', () => {
        it('returns false when no draft exists', () => {
            expect(hasGuidedDraft('CBA')).toBe(false);
        });

        it('returns true once a draft has been saved for that toolType', () => {
            const { result } = renderHook(() => useGuidedDraft('CBA'));
            act(() => { result.current.saveDraft(1, { behavior: 'Drinking' }); });

            expect(hasGuidedDraft('CBA')).toBe(true);
            expect(hasGuidedDraft('ABC')).toBe(false);
        });

        it('returns false after the draft is cleared', () => {
            const { result } = renderHook(() => useGuidedDraft('DENTS'));
            act(() => { result.current.saveDraft(0, { scenario: 'A party' }); });
            expect(hasGuidedDraft('DENTS')).toBe(true);

            act(() => { result.current.clearDraft(); });
            expect(hasGuidedDraft('DENTS')).toBe(false);
        });
    });
});
