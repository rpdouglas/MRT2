/**
 * src/pages/Login.tsx
 * GITHUB COMMENT:
 * [Login.tsx]
 * UX: Adjusted hero background gradient for a lighter, more vibrant feel.
 * UX: Removed max-width constraints and <br/> tags to allow title and tagline to span one line on desktop.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    ShieldCheckIcon, 
    EnvelopeIcon, 
    LockClosedIcon,
    KeyIcon,
    EyeSlashIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

// --- Interfaces & Data ---
interface Persona {
  id: string;
  name: string;
  title: string;
  stage: string;
  image: string;
  color: string;
}

const PERSONAS: Persona[] = [
  { id: 'david', name: 'David', title: 'The Fresh Start', stage: 'Day 1', image: '/personas/david.jpg', color: 'bg-blue-500' },
  { id: 'ned', name: 'Ned', title: 'The Pink Cloud', stage: '90 Days', image: '/personas/ned.jpg', color: 'bg-emerald-500' },
  { id: 'lisa', name: 'Lisa', title: 'Service Superstar', stage: '7 Years', image: '/personas/lisa.jpg', color: 'bg-purple-500' },
  { id: 'walt', name: 'Walt', title: 'The Zen Master', stage: '35+ Years', image: '/personas/walt.jpg', color: 'bg-amber-500' }
];

export default function Login() {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, user, loading } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-Redirect when User is Detected
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard'); 
    }
  }, [user, loading, navigate]);

  // Handlers
  const handleGoogleLogin = async () => {
    try {
      setError('');
      setIsSubmitting(true);
      await loginWithGoogle();
    } catch (error) {
      console.error(error);
      setError('Failed to sign in with Google.');
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!email || !password) {
        setError("Please fill in all fields.");
        setIsSubmitting(false);
        return;
    }
    
    if (!isLogin && password !== confirmPass) {
        setError("Passwords do not match.");
        setIsSubmitting(false);
        return;
    }

    if (password.length < 6) {
        setError("Password should be at least 6 characters.");
        setIsSubmitting(false);
        return;
    }

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password);
      }
      navigate('/dashboard'); 
    } catch (err: unknown) { 
      console.error(err);
      setIsSubmitting(false); 
      
      const authError = err as { code?: string }; 
      
      if (authError.code === 'auth/email-already-in-use') {
        setError('That email is already in use.');
      } else if (authError.code === 'auth/wrong-password' || authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError('Failed to authenticate. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      
      {/* LEFT COLUMN: BRANDING & NARRATIVE */}
      <div className="lg:w-5/12 xl:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white flex flex-col justify-between p-8 lg:p-12 relative overflow-hidden shrink-0">
        {/* Background Texture/Glow */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-cyan-300 opacity-20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
            {/* Logo & Title */}
            <div className="flex items-center gap-4 mb-12">
                <div className="bg-white p-2 rounded-2xl shadow-lg">
                    <img src="/pwa-192x192.png" alt="MRT Logo" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-none sm:whitespace-nowrap">
                        My Recovery Toolkit
                    </h1>
                </div>
            </div>

            {/* Value Proposition */}
            <div className="space-y-8 w-full max-w-2xl">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[2.5rem] font-bold leading-tight lg:whitespace-nowrap tracking-tight">
                    The safest place to do the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">Hardest Work.</span>
                </h2>
                
                <div className="space-y-5 max-w-lg">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm shrink-0">
                            <LockClosedIcon className="h-6 w-6 text-cyan-200" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">The Vault</h3>
                            <p className="text-blue-50 text-sm leading-relaxed mt-1">Zero-Knowledge encryption ensures your personal inventory and reflections are mathematically unreadable by anyone but you.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm shrink-0">
                            <SparklesIcon className="h-6 w-6 text-fuchsia-200" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">The Compass</h3>
                            <p className="text-blue-50 text-sm leading-relaxed mt-1">On-device AI pattern recognition helps identify subtle emotional triggers and builds actionable, step-by-step habit plans.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* The Personas Grid (Desktop mainly, visible on mobile scroll) */}
        <div className="relative z-10 mt-12 lg:mt-0 max-w-2xl">
            <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-4">Meeting you where you are</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PERSONAS.map(p => (
                    <div key={p.id} className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg border border-white/10 group">
                        <div className={`absolute inset-0 ${p.color} mix-blend-multiply opacity-40 group-hover:opacity-20 transition-opacity z-10`}></div>
                        <img 
                            src={p.image} 
                            alt={p.name} 
                            className="absolute inset-0 w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" 
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex flex-col justify-end p-3">
                            <span className="text-[9px] font-bold text-white/80 uppercase">{p.stage}</span>
                            <span className="text-sm font-bold text-white leading-tight">{p.name}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* RIGHT COLUMN: AUTHENTICATION FORM */}
      <div className="lg:w-7/12 xl:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="max-w-md w-full bg-white p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-200/60 animate-fadeIn">
            
            <div className="text-center mb-8 lg:hidden">
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Toolkit</h2>
            </div>

            {/* Tab Toggle */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8 shadow-inner">
                <button 
                    onClick={() => { setIsLogin(true); setError(''); }}
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Sign In
                </button>
                <button 
                    onClick={() => { setIsLogin(false); setError(''); }}
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Create Account
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 animate-fadeIn flex items-start gap-3">
                    <EyeSlashIcon className="h-5 w-5 shrink-0" />
                    {error}
                </div>
            )}

            {/* Trust Badges (Sign Up Only) */}
            {!isLogin && (
                <div className="bg-emerald-50 p-5 rounded-xl mb-8 border border-emerald-100 animate-fadeIn">
                    <h4 className="text-[10px] font-bold text-emerald-800 flex items-center gap-1.5 mb-3 uppercase tracking-widest">
                        <ShieldCheckIcon className="h-4 w-4" />
                        Privacy Guarantee
                    </h4>
                    <ul className="text-xs text-emerald-900 space-y-3 font-medium leading-relaxed">
                        <li className="flex items-start gap-2">
                            <KeyIcon className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span><strong>Zero-Knowledge Encryption:</strong> Your journals are encrypted on your device. We cannot read them.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <EyeSlashIcon className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span><strong>No Cloud Tracking:</strong> AI analysis is triggered explicitly by you and is never stored for training.</span>
                        </li>
                    </ul>
                </div>
            )}

            {/* Email Form */}
            <form className="space-y-4" onSubmit={handleEmailSubmit}>
                <div className="space-y-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <EnvelopeIcon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="email"
                            required
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-12 block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm p-4 bg-slate-50 focus:bg-white transition-all outline-none"
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="password"
                            required
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-12 block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm p-4 bg-slate-50 focus:bg-white transition-all outline-none"
                        />
                    </div>

                    {!isLogin && (
                        <div className="relative group animate-fadeIn">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <LockClosedIcon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="password"
                                required
                                placeholder="Confirm Password"
                                value={confirmPass}
                                onChange={(e) => setConfirmPass(e.target.value)}
                                className="pl-12 block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm p-4 bg-slate-50 focus:bg-white transition-all outline-none"
                            />
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50 transition-all mt-6"
                >
                    {isSubmitting ? 'Processing...' : (isLogin ? 'Sign In Securely' : 'Create Secure Account')}
                </button>
            </form>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-400 font-medium">Or continue with</span>
                </div>
            </div>

            {/* Google Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isSubmitting || loading}
              className="w-full flex items-center justify-center px-4 py-4 border-2 border-slate-200 shadow-sm text-sm font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 active:scale-95 disabled:opacity-50 transition-all"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5 mr-3" />
              Sign in with Google
            </button>
        </div>
      </div>

    </div>
  );
}
