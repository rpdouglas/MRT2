import type { FormEvent } from 'react';

export interface AuthCardProps {
  isSignUp: boolean;
  onToggleSignUp: () => void;
  headline: string;
  subheadline: string;
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  authError: string | null;
  isSubmitting: boolean;
  onSubmit: (e: FormEvent) => void;
  onGoogleSignIn: () => void;
}

/**
 * The embedded email/password + Google sign-up/sign-in form. Extracted from
 * Welcome.tsx (PROJ-116) so the full web page and the slim Android-TWA
 * landing (WelcomeAndroidApp) render the exact same auth logic/markup
 * instead of two copies that can drift apart.
 */
export default function AuthCard({
  isSignUp,
  onToggleSignUp,
  headline,
  subheadline,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  authError,
  isSubmitting,
  onSubmit,
  onGoogleSignIn,
}: AuthCardProps) {
  return (
    <div
      className="relative max-w-md mx-auto w-full backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl rounded-[2rem] p-6 sm:p-10"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 2.5rem)' }}
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">{headline}</h2>
        <p className="text-slate-300 text-sm">{subheadline}</p>
      </div>

      {/* Auth Form Embed */}
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email Address"
          required
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-3.5 rounded-xl placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-3.5 rounded-xl placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />

        {authError && (
          <p role="alert" className="text-rose-300 text-sm text-center -mb-1">{authError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-blue-500 transition-colors mt-2 shadow-lg shadow-blue-900/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Please wait…' : isSignUp ? 'Begin your toolkit' : 'Unlock Vault'}
        </button>
      </form>

      {/* Google Auth Separator */}
      <div className="flex items-center gap-4 mt-6">
        <div className="h-px bg-slate-700/50 flex-1"></div>
        <span className="text-slate-400 text-sm font-medium">Or</span>
        <div className="h-px bg-slate-700/50 flex-1"></div>
      </div>

      {/* Google Button */}
      <button
        type="button"
        className="w-full bg-white text-slate-900 font-bold text-lg py-3.5 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-3 mt-6 shadow-lg shadow-white/5"
        onClick={onGoogleSignIn}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      {/* Toggle State */}
      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={onToggleSignUp}
          className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
        </button>
      </div>

      <div className="mt-8 text-center text-xs text-slate-400 space-x-4">
        <a href="https://docs.myrecoverytoolkit.ca/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-slate-300">Privacy Policy</a>
        <span>&middot;</span>
        <a href="https://docs.myrecoverytoolkit.ca/tos" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-slate-300">Terms of Service</a>
      </div>
      <p className="mt-4 text-center text-xs text-slate-500 max-w-sm mx-auto">
        My Recovery Toolkit is a self-help peer support tool and is not a medical device, diagnostic tool, or replacement for professional clinical addiction treatment.
      </p>
    </div>
  );
}
