import { LockClosedIcon } from '@heroicons/react/24/outline';
import { ASSETS } from '../../data/assets';
import WelcomeTrustBar from './WelcomeTrustBar';
import AuthCard, { type AuthCardProps } from './AuthCard';

type WelcomeAndroidAppProps = Omit<AuthCardProps, 'headline' | 'subheadline'> & {
  onCrisisClick: () => void;
};

/**
 * The Android-TWA landing experience (amends PROJ-116). A Play Store visitor
 * already made the highest-intent decision (install) before ever seeing this
 * screen, so unlike the full web Welcome page it skips the marketing hero,
 * feature strip, persona quiz, and showcase carousel entirely and goes
 * straight to sign-up/login — closer to David's "max 3 taps, zero cognitive
 * load" floor. The crisis-bypass link (WelcomeTrustBar) stays present
 * regardless of platform; that floor is never conditional.
 */
export default function WelcomeAndroidApp({ onCrisisClick, isSignUp, ...authCardProps }: WelcomeAndroidAppProps) {
  return (
    <div className="min-h-screen bg-slate-900 font-sans selection:bg-blue-200 flex flex-col">
      <WelcomeTrustBar onCrisisClick={onCrisisClick} />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <img
          src={ASSETS.pwa_512x512}
          alt="MRT Logo"
          className="w-20 h-20 object-contain drop-shadow-xl mb-3"
          onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect width="100%25" height="100%25" fill="%23e2e8f0"/%3E%3C/svg%3E' }}
        />
        <span className="text-lg font-black text-white tracking-widest uppercase text-center mb-3">
          My Recovery Toolkit
        </span>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 font-semibold text-xs mb-8 border border-blue-400/20">
          <LockClosedIcon className="w-3.5 h-3.5" />
          <span>The safest place to do the hardest work.</span>
        </div>

        <AuthCard
          isSignUp={isSignUp}
          headline={isSignUp ? 'Begin your toolkit' : 'Welcome Back'}
          subheadline={isSignUp ? 'Start your secure journey today.' : 'Enter your credentials to unlock.'}
          {...authCardProps}
        />
      </div>
    </div>
  );
}
