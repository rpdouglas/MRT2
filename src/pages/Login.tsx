import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheckIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Auto-Redirect when User is Detected ---
  useEffect(() => {
    if (user && !loading) {
      navigate('/'); 
    }
  }, [user, loading, navigate]);

  // Handle Google Login
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

  // Handle Email Submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Basic Validation
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
      navigate('/'); 
    } catch (err: unknown) { // <--- FIXED: Changed to 'unknown' to satisfy TS1196
      console.error(err);
      setIsSubmitting(false); 
      
      // Safe cast to access properties
      const error = err as { code?: string }; 
      
      // Firebase error mapping
      if (error.code === 'auth/email-already-in-use') {
        setError('That email is already in use.');
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError('Failed to authenticate. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
             <ShieldCheckIcon className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            My Recovery Toolkit
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center">
                {error}
            </div>
        )}

        {/* Email Form */}
        <form className="mt-8 space-y-4" onSubmit={handleEmailSubmit}>
            <div className="space-y-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="email"
                        required
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
                    />
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="password"
                        required
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
                    />
                </div>

                {!isLogin && (
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="password"
                            required
                            placeholder="Confirm Password"
                            value={confirmPass}
                            onChange={(e) => setConfirmPass(e.target.value)}
                            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
                        />
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
                {isSubmitting ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
        </form>

        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isSubmitting || loading}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5 mr-2" />
          Sign in with Google
        </button>

        {/* Toggle Mode */}
        <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setError('');
                        setEmail('');
                        setPassword('');
                        setConfirmPass('');
                    }}
                    className="font-medium text-blue-600 hover:text-blue-500"
                >
                    {isLogin ? 'Sign up' : 'Sign in'}
                </button>
            </p>
        </div>

      </div>
    </div>
  );
}