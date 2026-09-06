import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheckIcon, LockClosedIcon, ArrowRightIcon, LifebuoyIcon } from '@heroicons/react/24/outline';

import { ASSETS } from '../data/assets';
import PersonaBioCard from '../components/PersonaBioCard';
import { usePageMeta, SITE_ORIGIN } from '../hooks/usePageMeta';
import { WELCOME_PERSONAS } from '../data/welcomePersonas';
import type { RecoveryPersona } from '../lib/welcomeQuizScoring';
import RecoveryQuiz from '../components/welcome/RecoveryQuiz';
import CrisisResourcesPanel from '../components/welcome/CrisisResourcesPanel';
import PersonaCtaButtons, { QUIZ_PERSONA_STORAGE_KEY } from '../components/welcome/PersonaCtaButtons';
import { trackShowcaseCardClicked } from '../lib/telemetry';

// PROJ-102 (SEO/AEO) Phase 2: SoftwareApplication + Organization structured
// data for the homepage — the app's canonical entity description for search
// and answer engines. Kept as plain objects at module scope so usePageMeta's
// effect dependency array sees a stable reference (no unnecessary re-injects).
const WELCOME_JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'My Recovery Toolkit',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web, Android, iOS',
    url: SITE_ORIGIN,
    description: 'A zero-knowledge encrypted recovery companion for 12-Step and Buddhist-inspired recovery. Journal, track habits, and get AI-powered insights — private by design.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'My Recovery Toolkit',
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/pwa-512x512.png`,
  },
];

// Maps common Firebase Auth error codes to David-safe, non-technical copy.
function describeAuthError(err: unknown): string {
  const code = (err as { code?: string } | null)?.code ?? '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists for that email. Try signing in instead.';
    case 'auth/weak-password':
      return 'Please use a password with at least 6 characters.';
    case 'auth/invalid-email':
      return 'That email address doesn’t look right.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function Welcome() {
  const navigate = useNavigate();
  const { user, loading, loginWithGoogle, signupWithEmail, loginWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(true);

  usePageMeta({
    title: 'My Recovery Toolkit',
    description: "A zero-knowledge encrypted companion for 12-Step and Buddhist-inspired recovery. Journal, track habits, and get AI-powered insights — private by design, even our developers can't read your data.",
    path: '/',
    jsonLd: WELCOME_JSON_LD,
  });

  // Smart Redirect: If user is already logged in, skip the splash page entirely
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [crisisPanelOpen, setCrisisPanelOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<RecoveryPersona | null>(null);

  const scrollToAuth = () => {
    document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Shared by the quiz result card and the showcase cards below (PROJ-116,
  // docs/projects/116_WELCOME_PAGE_PERSONA_QUIZ.md §6 Decision 1) — the
  // primary path stays the embedded web signup form; the persona tag is kept
  // in sessionStorage only (never persisted to Firestore) purely to
  // personalize this page's own auth-section headline.
  const handlePersonaWebSignup = (persona: RecoveryPersona) => {
    setSelectedPersona(persona);
    try {
      sessionStorage.setItem(QUIZ_PERSONA_STORAGE_KEY, persona);
    } catch {
      // sessionStorage unavailable (e.g. private browsing) — non-fatal, the
      // page still works, it just won't personalize the auth headline.
    }
    scrollToAuth();
  };

  const handleShowcaseCardClick = (persona: RecoveryPersona) => {
    trackShowcaseCardClicked(persona);
    handlePersonaWebSignup(persona);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await signupWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      // Redirection is handled automatically by the useEffect above once
      // AuthContext's onAuthStateChanged listener picks up the new session.
    } catch (err) {
      console.error('Auth error:', err);
      setAuthError(describeAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200">
      
      {/* 1. THE TRUST BAR (Sticky) — carries the crisis-bypass link so it's
          truly always-visible (David Safety Test), not just "near the hero"
          and vulnerable to being pushed below the fold on a short viewport. */}
      <div className="sticky top-0 w-full bg-slate-900 text-white py-3 px-4 flex items-center justify-between gap-3 text-xs sm:text-sm font-medium z-50 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <ShieldCheckIcon className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="truncate">
            Zero-Knowledge Encryption. <span className="hidden sm:inline">Even our developers can't read your journal.</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCrisisPanelOpen(true)}
          className="inline-flex items-center gap-1 shrink-0 text-red-300 hover:text-red-200 font-bold transition-colors"
        >
          <LifebuoyIcon className="w-4 h-4" />
          <span>Need help?</span>
        </button>
      </div>

      {/* 2. THE HERO SECTION */}
      <section className="relative min-h-[100dvh] flex flex-col lg:grid lg:grid-cols-2 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white overflow-hidden">
        
        {/* BRAND HEADER */}
        <header className="absolute top-0 w-full px-6 py-6 flex items-start justify-between z-40 pointer-events-none">
          {/* Empty spacer to balance flex alignment */}
          <div className="w-20 sm:w-24 hidden sm:block"></div>
          
          {/* Centered Brand Lockup */}
          <div className="flex flex-col items-center gap-0 pointer-events-auto absolute left-1/2 -translate-x-1/2 top-3">
            <img
              src={ASSETS.pwa_512x512}
              alt="MRT Logo"
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-xl -mb-1 sm:-mb-2" 
              onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect width="100%25" height="100%25" fill="%23e2e8f0"/%3E%3C/svg%3E' }}
            />
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-widest uppercase text-center whitespace-nowrap">
              MY RECOVERY TOOLKIT
            </span>
          </div>

          {/* Spacer for mobile where we don't have the left block */}
          <div className="w-1 sm:hidden"></div>

          <button
            onClick={scrollToAuth}
            className="pointer-events-auto text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors bg-white/50 backdrop-blur-sm px-5 py-2.5 rounded-full border border-slate-200/50 shadow-sm z-50 relative"
          >
            Sign In
          </button>
        </header>

        {/* Hero Text */}
        <div className="flex flex-col justify-center px-6 pt-36 pb-16 lg:p-20 lg:pt-44 z-20">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-blue-100/50 text-blue-700 font-semibold text-sm mb-2 w-fit backdrop-blur-sm border border-blue-200/50">
            <LockClosedIcon className="w-4 h-4" />
            <span>The safest place to do the hardest work.</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
            Recovery principles, <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">backed by real tools.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-xl leading-relaxed">
            Go far beyond basic day-counting. Use a completely encrypted workspace to analyze your journal entries, monitor your vitality, and discover the hidden patterns driving your journey forward.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={scrollToAuth}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-slate-900/20"
            >
              Begin your toolkit
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <p className="mt-4 text-xs text-slate-500 max-w-md">
            A self-help peer support tool — not a medical device or a replacement for professional treatment.
          </p>
        </div>

        {/* Hero Bento Graphic */}
        <div className="relative flex-1 flex items-center justify-center p-6 min-h-[50vh] lg:min-h-full z-10 perspective-1000">
          {/* Abstract glowing orbs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl mix-blend-multiply"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl mix-blend-multiply"></div>
          
          {/* The Devices */}
          <div className="relative w-full max-w-md aspect-[9/16] transform -rotate-2 hover:rotate-0 transition-transform duration-700 ease-out">
            <img 
              src={ASSETS.marketing.screenshots.scn_dashboard} 
              alt="MRT Dashboard Interface" 
              fetchPriority="high"
              className="absolute inset-0 w-full h-full object-cover rounded-[2.5rem] shadow-2xl ring-1 ring-slate-900/5 bg-white"
              onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800"%3E%3Crect width="100%25" height="100%25" fill="%23e2e8f0"/%3E%3C/svg%3E' }}
            />
            {/* Floating Badge */}
            <img 
              src={ASSETS.marketing.screenshots.scn_dashboard_02_clean_time} 
              alt="Clean Time Chip" 
              loading="lazy"
              className="absolute -bottom-6 -left-6 w-48 object-contain rounded-2xl shadow-xl ring-1 ring-white/50 transform rotate-6 animate-float"
              style={{ animation: 'float 6s ease-in-out infinite' }}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
        </div>
      </section>

      {/* 3. FEATURE-SUMMARY STRIP */}
      <section className="py-14 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg mb-1">Journal</h3>
            <p className="text-sm text-slate-500">Encrypted long-form entries, voice notes, and guided templates.</p>
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg mb-1">Track habits</h3>
            <p className="text-sm text-slate-500">Daily tasks and streaks that never shame you for a missed day.</p>
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg mb-1">Find patterns</h3>
            <p className="text-sm text-slate-500">AI-powered insights across your own history — private by design.</p>
          </div>
        </div>
      </section>

      {/* 4. "FIND YOUR RECOVERY SEASON" QUIZ */}
      <section className="py-24 bg-white px-6">
        <RecoveryQuiz onWebSignupClick={handlePersonaWebSignup} />
      </section>

      {/* 5. THE PERSONA SHOWCASE (CSS Scroll Snap, trimmed + expandable) */}
      <section className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Meet the Toolkit</h2>
          <p className="text-lg text-slate-500 max-w-2xl">
            Already know your season? Browse all six without taking the quiz.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 px-6 pb-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {WELCOME_PERSONAS.map((persona) => (
            <article
              key={persona.id}
              className="snap-center shrink-0 w-[85vw] sm:w-[400px] bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col"
            >
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={persona.headshot}
                  alt={persona.altDesc}
                  loading="lazy"
                  className="w-16 h-16 rounded-full object-cover shadow-sm bg-white"
                  onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect width="100%25" height="100%25" fill="%23e2e8f0"/%3E%3C/svg%3E' }}
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{persona.name}</h3>
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${persona.color}`}>
                    {persona.title}
                  </span>
                </div>
              </div>
              <p className="text-slate-600 italic mb-4 font-medium">
                {persona.quote}
              </p>
              <PersonaBioCard {...persona.bio} className="mb-6" />
              <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200/50 bg-white mb-2">
                <img
                  src={persona.screen}
                  alt={`${persona.name} App Interface`}
                  loading="lazy"
                  className="w-full aspect-[4/3] object-cover object-top"
                  onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="100%25" height="100%25" fill="%23e2e8f0"/%3E%3C/svg%3E' }}
                />
              </div>
              <div className="mt-auto">
                <PersonaCtaButtons persona={persona.id} personaName={persona.name} onWebSignupClick={handleShowcaseCardClick} />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 6. TRUST STATEMENT */}
      <section className="py-16 bg-white px-6">
        <div className="max-w-3xl mx-auto text-center">
          <ShieldCheckIcon className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">We can't see your journal. Even if compelled to.</h2>
          <p className="text-slate-500 leading-relaxed">
            Everything you write is encrypted on your device before it ever reaches our servers. Your PIN never
            leaves your device either — only you hold the key that unlocks your entries.
          </p>
        </div>
      </section>

      {/* 7. THE AUTH CARD (Closing CTA / Conversion Zone) */}
      <section id="auth-section" className="relative py-24 px-4 overflow-hidden bg-slate-900">
        {/* Background glowing effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900"></div>
        
        <div className="relative max-w-md mx-auto w-full backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl rounded-[2rem] p-6 sm:p-10" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 2.5rem)' }}>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {isSignUp
                ? selectedPersona
                  ? `Begin your toolkit — built for ${WELCOME_PERSONAS.find((p) => p.id === selectedPersona)?.name}`
                  : 'Begin your toolkit'
                : 'Welcome Back'}
            </h2>
            <p className="text-slate-300 text-sm">
              {isSignUp ? 'Start your secure journey today.' : 'Enter your credentials to unlock.'}
            </p>
          </div>

          {/* Auth Form Embed */}
          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
            <input 
              type="email" 
              placeholder="Email Address" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-3.5 rounded-xl placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <input 
              type="password" 
              placeholder="Password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            onClick={async () => {
              try {
                if (loginWithGoogle) {
                  await loginWithGoogle();
                  // Redirection is handled automatically by the useEffect above
                } else {
                  console.error('Google Sign-In method not found in AuthContext');
                }
              } catch (err) {
                console.error('Auth error:', err);
              }
            }}
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
              onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); }}
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
      </section>

      <CrisisResourcesPanel isOpen={crisisPanelOpen} onClose={() => setCrisisPanelOpen(false)} />

    </div>
  );
}
