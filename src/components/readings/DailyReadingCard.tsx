import { useState } from 'react';
import { BookOpenIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useDailyReading } from '../../hooks/useDailyReading';
import { useReadingPreferences } from '../../hooks/useReadingPreferences';
import ReadingModal from './ReadingModal';

export default function DailyReadingCard() {
  const { activeModality, hasReadToday, markAsRead } = useReadingPreferences();
  const { data: reading, isLoading, isStale } = useDailyReading(activeModality);
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpen = () => {
    setModalOpen(true);
    if (reading && !hasReadToday) {
      markAsRead.mutate(reading.id);
    }
  };

  // No modality configured
  if (!activeModality) return null;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl p-4 shadow-md animate-pulse">
        <div className="h-3 w-24 bg-white/30 rounded-full mb-2" />
        <div className="h-4 w-40 bg-white/30 rounded-full" />
      </div>
    );
  }

  // No reading in buffer — compassionate fallback, no error styling
  if (!reading) {
    return (
      <div className="bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl shrink-0">
            <BookOpenIcon className="h-5 w-5 text-white" />
          </div>
          <p className="text-sm font-medium text-white/90">
            {isStale
              ? "Showing your last available reading — connect to refresh."
              : "Today's reading is being prepared. Check back soon."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="w-full text-left bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl p-4 shadow-md hover:brightness-105 transition active:scale-[0.99]"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-white/20 rounded-xl shrink-0">
              {hasReadToday
                ? <CheckCircleIcon className="h-5 w-5 text-white" />
                : <BookOpenIcon className="h-5 w-5 text-white" />
              }
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                  {reading.theme}
                </span>
                {hasReadToday && (
                  <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                    Done
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-white truncate">{reading.title}</p>
            </div>
          </div>
          <ChevronRightIcon className="h-4 w-4 text-white/70 shrink-0" />
        </div>

        {!hasReadToday && (
          <p className="mt-2 text-xs text-white/80 ml-[52px]">Read today's reflection →</p>
        )}
      </button>

      {modalOpen && (
        <ReadingModal reading={reading} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
