import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc, type Firestore } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, updateProfileData, type UserProfile } from '../lib/db';

export function useUserProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const uid = user?.uid;

  const query = useQuery<UserProfile | null>({
    queryKey: ['profile', uid],
    queryFn: () => getProfile(uid as string),
    enabled: !!uid,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['profile', uid] });

  // Top-level merge write — safe for scalar fields with no sibling nested keys
  // owned by another hook.
  const updateProfile = useMutation({
    mutationFn: (data: Partial<UserProfile>) => {
      if (!uid) throw new Error('Not authenticated');
      return updateProfileData(uid, data);
    },
    onSuccess: invalidate,
  });

  // Dot-path updateDoc for fields where a plain merge would clobber sibling
  // nested keys another hook owns — e.g. anchorSettings.lastReadingDate is
  // written by useReadingPreferences, so a raw `anchorSettings: {...}` merge
  // here would silently wipe it.
  const patchFields = useMutation({
    mutationFn: (fields: Record<string, unknown>) => {
      if (!uid || !db) throw new Error('Not authenticated');
      return updateDoc(doc(db as Firestore, 'users', uid), fields);
    },
    onSuccess: invalidate,
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    updateProfile,
    patchFields,
  };
}
