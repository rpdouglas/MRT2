import { useUserProfile } from './useUserProfile';
import { WORKBOOKS, getDefaultInstalledWorkbookIds, type Workbook } from '../data/workbooks';

// PROJ-75 (Workbook Marketplace v1): per-user "My Workbooks" library built on
// top of the existing profile field/mutation — no new Firestore collection or
// rules. installedWorkbookIds lives on users/{uid} and is read/written through
// useUserProfile(), which already documents itself as safe for scalar/array
// fields with no sibling nested keys owned by another hook.
export function useWorkbookLibrary() {
  const { profile, isLoading, updateProfile } = useUserProfile();

  const installedIds = profile?.installedWorkbookIds ?? getDefaultInstalledWorkbookIds();
  const installedWorkbooks: Workbook[] = WORKBOOKS.filter(w => installedIds.includes(w.id));

  const isInstalled = (workbookId: string) => installedIds.includes(workbookId);

  const addWorkbook = (workbookId: string) => {
    if (installedIds.includes(workbookId)) return Promise.resolve();
    return updateProfile.mutateAsync({ installedWorkbookIds: [...installedIds, workbookId] });
  };

  const removeWorkbook = (workbookId: string) => {
    if (!installedIds.includes(workbookId)) return Promise.resolve();
    return updateProfile.mutateAsync({
      installedWorkbookIds: installedIds.filter(id => id !== workbookId),
    });
  };

  return {
    isLoading,
    catalog: WORKBOOKS,
    installedWorkbooks,
    isInstalled,
    addWorkbook,
    removeWorkbook,
    isUpdating: updateProfile.isPending,
  };
}
