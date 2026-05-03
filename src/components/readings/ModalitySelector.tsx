import { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useReadingPreferences, ALL_MODALITIES, MODALITY_LABELS } from '../../hooks/useReadingPreferences';
import type { ReadingModality } from '../../lib/db';

export default function ModalitySelector() {
  const { preferences, updateModalities } = useReadingPreferences();

  // Local override: null until the user makes a change, at which point it becomes
  // the source of truth so toggles work without waiting for Firestore roundtrips.
  const [localSelected, setLocalSelected] = useState<ReadingModality[] | null>(null);
  const selected = localSelected ?? preferences?.selectedModalities ?? ALL_MODALITIES;

  const toggle = (modality: ReadingModality) => {
    const next = selected.includes(modality)
      ? selected.filter(m => m !== modality)
      : [...selected, modality];
    if (next.length === 0) return;
    setLocalSelected(next);
    updateModalities.mutate(next);
  };

  return (
    <div className="space-y-2">
      {ALL_MODALITIES.map(modality => {
        const active = selected.includes(modality);
        return (
          <button
            key={modality}
            type="button"
            onClick={() => toggle(modality)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
              active
                ? 'bg-sky-50 border-sky-300 text-sky-800'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            <span>{MODALITY_LABELS[modality]}</span>
            {active && <CheckIcon className="h-4 w-4 text-sky-600 shrink-0" />}
          </button>
        );
      })}
      <p className="text-[10px] text-gray-400 pt-1">
        Active modalities rotate day by day. Deselect any you don't want.
      </p>
    </div>
  );
}
