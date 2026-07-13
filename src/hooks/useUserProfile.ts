import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc, type Firestore } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, updateProfileData, type UserProfile } from '../lib/db';
import { getMockProfile } from '../lib/mockData';

export function useUserProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const uid = user?.uid;

  const query = useQuery<UserProfile | null>({
    queryKey: ['profile', uid],
    queryFn: () => {
      if (user?.email?.endsWith('.mock')) {
        return getMockProfile(user.email);
      }
      return getProfile(uid as string);
    },
    enabled: !!uid,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['profile', uid] });

  // Top-level merge write — safe for scalar fields with no sibling nested keys
  // owned by another hook.
  const updateProfile = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      if (!uid) throw new Error('Not authenticated');
      if (user?.email?.endsWith('.mock')) return;
      return updateProfileData(uid, data);
    },
    onSuccess: invalidate,
  });

  // Dot-path updateDoc for fields where a plain merge would clobber sibling
  // nested keys another hook owns — e.g. anchorSettings.lastReadingDate is
  // written by useReadingPreferences, so a raw `anchorSettings: {...}` merge
  // here would silently wipe it.
  const patchFields = useMutation({
    mutationFn: async (fields: Record<string, unknown>) => {
      if (!uid) throw new Error('Not authenticated');
      if (user?.email?.endsWith('.mock')) return;
      if (!db) throw new Error('Not authenticated');
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
