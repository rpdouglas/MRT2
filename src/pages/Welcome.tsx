import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';

// ----------------------------------------------------------------------
// ASSET DICTIONARY: Single source of truth for WebP marketing assets
// ----------------------------------------------------------------------
const ASSETS = {
  hero: {
    dashboard: '/Marketing/Screenshots/scn_dashboard.webp',
    cleanTime: '/Marketing/Screenshots/scn_dashboard_02_clean_time.webp'
  },
  personas: [
    { 
      id: 'david', 
      name: 'David', 
      title: 'The Fresh Start',
      quote: '"A completely private space to start over."',
      headshot: '/Marketing/david_headshot.webp', 
      screen: '/Marketing/Screenshots/scn_journal_write.webp',
      color: 'bg-blue-50 text-blue-600'
    },
    { 
      id: 'ned', 
      name: 'Ned', 
      title: 'The Pink Cloud',
      quote: '"Turning manic energy into grounded momentum."',
      headshot: '/Marketing/ned_headshot.webp', 
      screen: '/Marketing/Screenshots/scn_tasks_this_week.webp',
      color: 'bg-cyan-50 text-cyan-600'
    },
    { 
      id: 'lisa', 
      name: 'Lisa', 
      title: 'The Service Superstar',
      quote: '"Self-care tools to prevent burnout."',
      headshot: '/Marketing/lisa_headshot.webp', 
      screen: '/Marketing/Screenshots/scn_vitality_breath.webp',
      color: 'bg-amber-50 text-amber-600'
    },
    { 
      id: 'walt', 
      name: 'Walt', 
      title: 'The Zen Master',
      quote: '"Finding hidden patterns with AI analysis."',
      headshot: '/Marketing/walt_headshot.webp', 
      screen: '/Marketing/Screenshots/scn_journal_ai_wizard.webp',
      color: 'bg-fuchsia-50 text-fuchsia-600'
    }
  ]
} as const;

export default function Welcome() {
  const navigate = useNavigate();
  const auth = useAuth() as { user: unknown; loading: boolean; loginWithGoogle?: () => Promise<void> };
  const { user, loading, loginWithGoogle } = auth;
  const [isSignUp, setIsSignUp] = useState(true);

  // Smart Redirect: If user is already logged in, skip the splash page entirely
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Wire to useAuth() hook and executePinRotation / setup
    // For now, route directly to login flow or dashboard
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200">
      
      {/* 1. THE TRUST BAR (Sticky) */}
      <div className="sticky top-0 w-full bg-slate-900 text-white py-3 px-4 flex items-center justify-center gap-3 text-xs sm:text-sm font-medium z-50 shadow-md">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <span className="text-center">
          Zero-Knowledge Encryption. <span className="hidden sm:inline">Even our developers can't read your journal.</span>
        </span>
      </div>

      {/* 2. THE HERO SECTION */}
      <section className="relative min-h-[100dvh] flex flex-col lg:grid lg:grid-cols-2 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white overflow-hidden">
        
        {/* Hero Text */}
        <div className="flex flex-col justify-center px-6 py-16 lg:p-20 z-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/50 text-blue-700 font-semibold text-sm mb-8 w-fit backdrop-blur-sm border border-blue-200/50">
            <Lock className="w-4 h-4" />
            <span>100% Private Workspace</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
            Recovery is a <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">High-Performance</span> <br />
            Lifestyle.
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-xl leading-relaxed">
            Journal securely, track your habits without shame, and uncover hidden emotional patterns with a private toolkit built for the real work of recovery.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-slate-900/20"
            >
              Begin Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Hero Bento Graphic */}
        <div className="relative flex-1 flex items-center justify-center p-6 min-h-[50vh] lg:min-h-full z-10 perspective-1000">
          {/* Abstract glowing orbs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl mix-blend-multiply"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl mix-blend-multiply"></div>
          
          {/* The Devices */}
          <div className="relative w-full max-w-md aspect-[9/16] transform -rotate-2 hover:rotate-0 transition-transform duration-700 ease-out">
            <img 
              src={ASSETS.hero.dashboard} 
              alt="MRT Dashboard Interface" 
              fetchPriority="high"
              className="absolute inset-0 w-full h-full object-cover rounded-[2.5rem] shadow-2xl ring-1 ring-slate-900/5 bg-white"
              onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800"%3E%3Crect width="100%25" height="100%25" fill="%23e2e8f0"/%3E%3C/svg%3E' }}
            />
            {/* Floating Badge */}
            <img 
              src={ASSETS.hero.cleanTime} 
              alt="Clean Time Chip" 
              loading="lazy"
              className="absolute -bottom-6 -left-6 w-48 object-contain rounded-2xl shadow-xl ring-1 ring-white/50 transform rotate-6 animate-float"
              style={{ animation: 'float 6s ease-in-out infinite' }}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
        </div>
      </section>

      {/* 3. THE PERSONA CAROUSEL (CSS Scroll Snap) */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Meet the Toolkit</h2>
          <p className="text-lg text-slate-500 max-w-2xl">
            Recovery isn't a straight line. MRT transforms to provide exactly the tools you need, right when you need them.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 px-6 pb-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {ASSETS.personas.map((persona) => (
            <article 
              key={persona.id} 
              className="snap-center shrink-0 w-[85vw] sm:w-[400px] bg-slate-50 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col"
            >
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={persona.headshot} 
                  alt={persona.name} 
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
              <p className="text-slate-600 italic mb-8 font-medium">
                {persona.quote}
              </p>
              <div className="mt-auto relative rounded-2xl overflow-hidden shadow-lg border border-slate-200/50 bg-white">
                <img 
                  src={persona.screen} 
                  alt={`${persona.name} App Interface`} 
                  loading="lazy"
                  className="w-full aspect-[4/3] object-cover object-top"
                  onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="100%25" height="100%25" fill="%23e2e8f0"/%3E%3C/svg%3E' }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. THE AUTH CARD (Conversion Zone) */}
      <section id="auth-section" className="relative py-24 px-4 overflow-hidden bg-slate-900">
        {/* Background glowing effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900"></div>
        
        <div className="relative max-w-md mx-auto w-full backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl rounded-[2rem] p-6 sm:p-10" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 2.5rem)' }}>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {isSignUp ? 'Create Your Vault' : 'Welcome Back'}
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
            
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-blue-500 transition-colors mt-2 shadow-lg shadow-blue-900/20"
            >
              {isSignUp ? 'Initialize Toolkit' : 'Unlock Vault'}
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
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
          </div>

        </div>
      </section>

    </div>
  );
}
