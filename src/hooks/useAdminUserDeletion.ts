/**
 * src/hooks/useAdminUserDeletion.ts
 * PROJ-121: TanStack Query wrapper for the deleteUserAccount Cloud Function,
 * per CLAUDE.md's "all Firestore-adjacent ops go through useQuery/useMutation"
 * convention (FriendsDirectory.tsx's existing role/VIP actions predate this
 * convention and use raw updateDoc calls directly — not propagated here for
 * a destructive new action).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteUserAccount, type DeleteUserAccountRequest } from '../lib/adminUserDeletion';

export function useAdminUserDeletion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: DeleteUserAccountRequest) => deleteUserAccount(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_audit_log'] });
        },
    });
}
