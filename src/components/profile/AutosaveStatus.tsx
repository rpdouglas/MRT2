import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export type AutosaveState = 'idle' | 'saving' | 'saved' | 'partial' | 'error';

// Shared visual language for every autosaving control on the Profile page —
// Project 58 Phase 2 replaces three incompatible save models (explicit submit,
// busy-flag, silent optimistic) with this one indicator everywhere a field
// commits on change instead of waiting for a button. 'partial' is distinct from
// 'error': the primary field did save, but a secondary sync (e.g. the Firebase
// Auth displayName mirror) failed — Phase 3 exists specifically so that case no
// longer reports a blanket "Saved" while quietly swallowing the sub-failure.
export default function AutosaveStatus({ state }: { state: AutosaveState }) {
  if (state === 'idle') return null;

  if (state === 'saving') {
    return <span className="text-[11px] font-semibold text-gray-400">Saving…</span>;
  }

  if (state === 'saved') {
    return (
      <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
        <CheckCircleIcon className="h-3.5 w-3.5" /> Saved
      </span>
    );
  }

  if (state === 'partial') {
    return (
      <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
        <ExclamationTriangleIcon className="h-3.5 w-3.5" /> Saved, but a sync step failed
      </span>
    );
  }

  return (
    <span className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
      <ExclamationTriangleIcon className="h-3.5 w-3.5" /> Couldn't save
    </span>
  );
}
