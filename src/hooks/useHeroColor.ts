/**
 * src/hooks/useHeroColor.ts
 * PROJ-56: Sobriety Hero Color Themes
 * Persists the user's chosen SobrietyHero color preset to users/{uid}.
 * heroColor is plaintext profile metadata (not recovery content), so it
 * carries no zero-knowledge encryption obligation per CLAUDE.md's ZK table.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, setDoc, type Firestore } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { HeroColorKey } from '../lib/db';

export function useHeroColor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateHeroColor = useMutation({
    mutationFn: async (heroColor: HeroColorKey) => {
      if (!user || !db) return;
      await setDoc(doc(db as Firestore, 'users', user.uid), { heroColor }, { merge: true });
    },
    onMutate: async (newColor) => {
      await queryClient.cancelQueries({ queryKey: ['profile', user?.uid] });
      const previous = queryClient.getQueryData(['profile', user?.uid]);
      queryClient.setQueryData(['profile', user?.uid], (old: unknown) =>
        old && typeof old === 'object' ? { ...old, heroColor: newColor } : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['profile', user?.uid], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.uid] });
    },
  });

  return { updateHeroColor };
}
