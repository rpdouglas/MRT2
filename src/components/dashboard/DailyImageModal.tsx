// src/components/dashboard/DailyImageModal.tsx
// PROJ-113 (Daily Inspirational Image), Phase 3. Full-screen, one-tap-
// dismissible overlay shown once per day from Dashboard.tsx — cloning
// DynamicAnchorWidget.tsx's existing fixed-overlay + VaultGate + JournalEditor
// pattern rather than inventing a new one. Never blocks SOS/crisis nav: it's
// a dismissible overlay, not a route gate, per the David persona floor in
// docs/projects/113_DAILY_INSPIRATIONAL_IMAGE.md §4.
import { useState } from 'react';
import { XMarkIcon, ShareIcon, PencilSquareIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useDailyImage } from '../../hooks/useDailyImage';
import { shareFile } from '../../hooks/useShareImage';
import JournalEditor from '../journal/JournalEditor';
import VaultGate from '../VaultGate';

interface DailyImageModalProps {
  onClose: () => void;
}

export default function DailyImageModal({ onClose }: DailyImageModalProps) {
  const { dailyImage } = useDailyImage();
  const [isJournaling, setIsJournaling] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState(false);

  if (!dailyImage) return null;

  const handleShare = async () => {
    setIsSharing(true);
    setShareError(false);
    try {
      const res = await fetch(dailyImage.downloadUrl);
      if (!res.ok) {
        throw new Error(`Daily image fetch failed: ${res.status}`);
      }
      const blob = await res.blob();
      await shareFile(
        blob,
        `daily-image-${dailyImage.date}.jpg`,
        'Daily Inspiration',
        dailyImage.caption || 'My Recovery Toolkit',
      );
    } catch (err) {
      // AbortError just means the user closed the native share sheet without
      // picking anything — normal, not a failure worth surfacing. Checked by
      // duck-typing `name` rather than `instanceof Error`: navigator.share()
      // rejects with a DOMException, which doesn't pass `instanceof Error`
      // in every environment (confirmed in jsdom).
      if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') return;
      console.error('Failed to share daily image', err);
      setShareError(true);
    } finally {
      setIsSharing(false);
    }
  };

  if (isJournaling) {
    return (
      <div className="fixed inset-0 z-[60] bg-indigo-200 flex flex-col animate-slideUp">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
          <span className="text-sm font-bold text-indigo-900">Journal on Daily Image</span>
          <button
            onClick={() => setIsJournaling(false)}
            className="p-2 bg-white/40 hover:bg-white/60 text-indigo-900 rounded-full transition-colors"
            aria-label="Back to image"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-20">
          <VaultGate>
            <JournalEditor
              initialEntry={null}
              initialContent={`Image: "${dailyImage.caption || 'Daily Inspiration'}"\n\nMy thoughts:\n`}
              initialTags={['Daily Image']}
              linkedImageId={dailyImage.imageId}
              onSaveComplete={onClose}
            />
          </VaultGate>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center p-4 animate-slideUp">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
        aria-label="Close"
      >
        <XMarkIcon className="h-6 w-6" />
      </button>

      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
        <img src={dailyImage.downloadUrl} alt="" className="w-full aspect-square object-cover" />
        <div className="p-5 space-y-4">
          {dailyImage.caption && <p className="text-gray-900 font-medium leading-relaxed">{dailyImage.caption}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:bg-gray-300 text-white font-bold py-2.5 rounded-lg transition-all active:scale-95"
            >
              {isSharing ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ShareIcon className="h-4 w-4" />}
              Share
            </button>
            <button
              onClick={() => setIsJournaling(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold py-2.5 rounded-lg transition-all active:scale-95"
            >
              <PencilSquareIcon className="h-4 w-4" />
              Journal
            </button>
          </div>

          {shareError && (
            <p className="text-sm text-red-600 text-center">Couldn't share the image — try again.</p>
          )}
        </div>
      </div>
    </div>
  );
}
