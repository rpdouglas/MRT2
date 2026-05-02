import { XMarkIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import ReadingShareButton from './ReadingShareButton';
import type { DailyReading } from '../../lib/db';

interface Props {
  reading: DailyReading;
  onClose: () => void;
}

export default function ReadingModal({ reading, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg overflow-hidden animate-slideUp">

        {/* Header */}
        <div className="bg-gradient-to-br from-sky-400 to-blue-600 px-5 pt-5 pb-4 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-4 w-4 text-white" />
          </button>
          <span className="inline-block text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white px-2.5 py-1 rounded-full mb-2">
            {reading.theme}
          </span>
          <h2 className="text-lg font-black text-white leading-tight pr-8">{reading.title}</h2>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[65vh] overflow-y-auto space-y-5">
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
          </div>
        </div>
      </div>
    </div>
  );
}
