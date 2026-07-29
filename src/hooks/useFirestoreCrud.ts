/**
 * src/hooks/useFirestoreCrud.ts
 * PROJ-59: Data Access Layer Consolidation.
 *
 * Extracted from the shape already shared by useTaskOperations.ts,
 * useJournalOperations.ts, and useWorkbookAnswers.ts. Two of those three are
 * write-only — their reads are owned by a different component querying the
 * same key (e.g. Dashboard.tsx owns the ['tasks', uid] read that
 * useTaskOperations only mutates against). So this is exposed as two
 * composable primitives rather than one hook that forces read+write
 * ownership together; useFirestoreCrud below is a convenience wrapper for
 * the single-owner case (e.g. TemplateEditor.tsx).
 *
 * Every consumer MUST key reads as [collectionName, uid, ...extra] — a
 * mismatched key (e.g. useJournalOperations previously invalidating
 * ['journals'] while every reader queried ['journals', uid]) silently
 * breaks cache invalidation for every other reader of that collection.
 *
 * ZK NOTE: this factory is encryption-agnostic by design — it has no way to
 * enforce that a mutationFn writing to `journals` or `service` encrypts its
 * payload first. Every call site touching those two collections must still
 * call encrypt() (via useEncryption()) on the content field before it's
 * handed to useFirestoreMutation, per CLAUDE.md's Zero-Knowledge boundary.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { trackMutationFailed } from '../lib/telemetry';

interface MutationSpec<TArgs, TData> {
  mutationFn: (uid: string, args: TArgs) => Promise<TData>;
  /** Return the next cache value given the previous value and mutation args. Omit for non-optimistic mutations. */
  optimisticUpdate?: (previous: unknown, args: TArgs) => unknown;
}

/**
 * Standardized read side: queryFn is called with the current uid, enabled
 * only once a user is present. `queryKey` must be `[collectionName, uid, ...extra]`.
 */
export function useFirestoreQuery<T>(
  queryKey: unknown[],
  fetcher: (uid: string) => Promise<T>,
  options?: { enabled?: boolean },
) {
  const { user } = useAuth();
  const uid = user?.uid;

  return useQuery<T>({
    queryKey,
    queryFn: () => fetcher(uid as string),
    enabled: !!uid && (options?.enabled ?? true),
  });
}

/**
 * Standardized write side: one useMutation per call, with the same
 * onMutate/onError/onSettled optimistic-then-invalidate pattern hand-rolled
 * today in useTaskOperations/useJournalOperations/useWorkbookAnswers.
 * `queryKey` must match the key used by every reader of this collection.
 */
export function useFirestoreMutation<TArgs, TData = void>(
  queryKey: unknown[],
  spec: MutationSpec<TArgs, TData>,
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const uid = user?.uid;

  return useMutation<TData, Error, TArgs, { previous?: unknown }>({
    mutationFn: (args: TArgs) => {
      if (!uid) throw new Error('Not authenticated');
      return spec.mutationFn(uid, args);
    },
    onMutate: spec.optimisticUpdate
      ? async (args: TArgs) => {
          await queryClient.cancelQueries({ queryKey });
          const previous = queryClient.getQueryData(queryKey);
          queryClient.setQueryData(queryKey, spec.optimisticUpdate!(previous, args));
          return { previous };
        }
      : undefined,
    onError: (err, _args, context) => {
      if (context && 'previous' in context) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      trackMutationFailed(String(queryKey[0]), err.name || 'Error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Convenience wrapper for the single-owner case, where one component owns
 * both the read and the writes for a collection (e.g. TemplateEditor.tsx
 * against users/{uid}/templates). Collections where reads and writes are
 * owned by different components (journals, tasks) should compose
 * useFirestoreQuery/useFirestoreMutation directly against a shared key
 * instead of reaching for this wrapper.
 */
export function useFirestoreCrud<T>(queryKey: unknown[], fetcher: (uid: string) => Promise<T>) {
  const queryClient = useQueryClient();
  const query = useFirestoreQuery<T>(queryKey, fetcher);

  return {
    data: query.data,
    isLoading: query.isLoading,
    invalidate: () => queryClient.invalidateQueries({ queryKey }),
  };
}
