import { useState } from 'react';
import { XMarkIcon, ArrowTopRightOnSquareIcon, ChevronLeftIcon, ChevronRightIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import ReadingShareButton from './ReadingShareButton';
import { MODALITY_LABELS } from '../../hooks/useReadingPreferences';
import type { DailyReading } from '../../lib/db';

interface Props {
  readings: DailyReading[];
  initialIndex?: number;
  onClose: () => void;
  onJournal?: (reading: DailyReading) => void;
}

export default function ReadingModal({ readings, initialIndex = 0, onClose, onJournal }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const reading = readings[currentIndex];

  if (!reading) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < readings.length - 1;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-3xl shadow-2xl sm:max-w-lg overflow-hidden flex flex-col animate-slideUp">

        {/* Header */}
        <div className="shrink-0 bg-gradient-to-br from-sky-400 to-blue-600 px-5 pt-8 sm:pt-4 pb-4 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-4 w-4 text-white" />
          </button>

          {/* Modality row with optional cycling nav */}
          <div className="flex items-center justify-between mb-3 pr-8">
            <span className="text-xs font-semibold text-white/80">
              {MODALITY_LABELS[reading.modality]}
            </span>
            {readings.length > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentIndex(i => i - 1)}
                  disabled={!hasPrev}
                  className="p-1 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous reading"
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5 text-white" />
                </button>
                <span className="text-[10px] font-bold text-white/70 tabular-nums">
                  {currentIndex + 1}/{readings.length}
                </span>
                <button
                  onClick={() => setCurrentIndex(i => i + 1)}
                  disabled={!hasNext}
                  className="p-1 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next reading"
                >
                  <ChevronRightIcon className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            )}
          </div>

          <h2 className="text-lg font-black text-white leading-tight text-center">{reading.theme}</h2>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-6 space-y-5">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{reading.body}</p>

          {/* Reflection */}
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-500 mb-1.5">Reflection</p>
            <p className="text-sm font-medium text-gray-700 italic leading-snug">{reading.reflection}</p>
          </div>

          {/* Affirmation */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl p-4 border border-blue-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1.5">Affirmation</p>
            <p className="text-sm font-bold text-blue-700 leading-snug">{reading.affirmation}</p>
          </div>

          {/* Attribution (Recovery Dharma) */}
          {reading.attribution && (
            <p className="text-[10px] text-gray-400 italic leading-relaxed">{reading.attribution}</p>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-1 pb-2">
            <ReadingShareButton reading={reading} />
            <div className="flex items-center gap-3">
              {reading.goDeeper && (
                <a
                  href={reading.goDeeper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {reading.goDeeper.label}
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                </a>
              )}
              {onJournal && (
                <button
                  onClick={() => onJournal(reading)}
                  className="flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors"
                >
                  <PencilSquareIcon className="h-3.5 w-3.5" />
                  Journal
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
