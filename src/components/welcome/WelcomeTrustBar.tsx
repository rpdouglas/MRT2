import { ShieldCheckIcon, LifebuoyIcon } from '@heroicons/react/24/outline';

interface WelcomeTrustBarProps {
  onCrisisClick: () => void;
}

/**
 * The sticky ZK-encryption badge + crisis-bypass link. Shared by the full
 * web Welcome page and the slim Android-TWA landing (WelcomeAndroidApp) so
 * David's crisis-access floor can't drift out of sync between the two.
 */
export default function WelcomeTrustBar({ onCrisisClick }: WelcomeTrustBarProps) {
  return (
    <div className="sticky top-0 w-full bg-slate-900 text-white py-3 px-4 flex items-center justify-between gap-3 text-xs sm:text-sm font-medium z-50 shadow-md">
      <div className="flex items-center gap-3 min-w-0">
        <ShieldCheckIcon className="w-5 h-5 text-emerald-400 shrink-0" />
        <span className="truncate">
          Zero-Knowledge Encryption. <span className="hidden sm:inline">Even our developers can't read your journal.</span>
        </span>
      </div>
      <button
        type="button"
        onClick={onCrisisClick}
        className="inline-flex items-center gap-1 shrink-0 text-red-300 hover:text-red-200 font-bold transition-colors"
      >
        <LifebuoyIcon className="w-4 h-4" />
        <span>Need help?</span>
      </button>
    </div>
  );
}
