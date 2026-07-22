/**
 * src/hooks/__tests__/useWorkbookLibrary.test.ts
 * QA: Project 75 (Workbook Marketplace v1) — verifies the installed-workbook
 * filter/default fallback and that add/remove write through the existing
 * useUserProfile().updateProfile mutation rather than a new Firestore path.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWorkbookLibrary } from '../useWorkbookLibrary';
import * as UserProfileHook from '../useUserProfile';
import { WORKBOOKS } from '../../data/workbooks';

vi.mock('../useUserProfile', () => ({ useUserProfile: vi.fn() }));

type UserProfileValue = ReturnType<typeof UserProfileHook.useUserProfile>;

function mockProfile(installedWorkbookIds: string[] | undefined, mutateAsync = vi.fn().mockResolvedValue(undefined)) {
    vi.mocked(UserProfileHook.useUserProfile).mockReturnValue({
        profile: installedWorkbookIds === undefined ? {} : { installedWorkbookIds },
        isLoading: false,
        updateProfile: { mutateAsync, isPending: false },
    } as unknown as UserProfileValue);
    return mutateAsync;
}

const ALL_IDS = WORKBOOKS.map(w => w.id);

describe('📚 useWorkbookLibrary Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('1. defaults to all official workbooks installed when the field is undefined (legacy/new user)', () => {
        mockProfile(undefined);
        const { result } = renderHook(() => useWorkbookLibrary());

        expect(result.current.installedWorkbooks.map(w => w.id)).toEqual(ALL_IDS);
        expect(result.current.catalog).toEqual(WORKBOOKS);
    });

    it('2. filters installedWorkbooks down to the ids on the profile', () => {
        mockProfile(['general_recovery']);
        const { result } = renderHook(() => useWorkbookLibrary());

        expect(result.current.installedWorkbooks.map(w => w.id)).toEqual(['general_recovery']);
        expect(result.current.isInstalled('general_recovery')).toBe(true);
        expect(result.current.isInstalled('12_steps')).toBe(false);
    });

    it('3. addWorkbook appends the id via updateProfile.mutateAsync', async () => {
        const mutateAsync = mockProfile(['general_recovery']);
        const { result } = renderHook(() => useWorkbookLibrary());

        await result.current.addWorkbook('12_steps');

        expect(mutateAsync).toHaveBeenCalledWith({ installedWorkbookIds: ['general_recovery', '12_steps'] });
    });

    it('4. addWorkbook is a no-op when the workbook is already installed (no duplicate ids)', async () => {
        const mutateAsync = mockProfile(['general_recovery']);
        const { result } = renderHook(() => useWorkbookLibrary());

        await result.current.addWorkbook('general_recovery');

        expect(mutateAsync).not.toHaveBeenCalled();
    });

    it('5. removeWorkbook filters the id out via updateProfile.mutateAsync', async () => {
        const mutateAsync = mockProfile(['general_recovery', '12_steps']);
        const { result } = renderHook(() => useWorkbookLibrary());

        await result.current.removeWorkbook('general_recovery');

        expect(mutateAsync).toHaveBeenCalledWith({ installedWorkbookIds: ['12_steps'] });
    });

    it('6. removeWorkbook is a no-op when the workbook is not installed', async () => {
        const mutateAsync = mockProfile(['general_recovery']);
        const { result } = renderHook(() => useWorkbookLibrary());

        await result.current.removeWorkbook('12_steps');

        expect(mutateAsync).not.toHaveBeenCalled();
    });
});
