import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // If user is already logged in, kick them to dashboard
  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return; // Prevent double-clicks
    setIsLoggingIn(true);

    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Login Failed:", error);
      if (error.code === 'auth/popup-blocked') {
        alert("Please allow popups for this site to sign in.");
      } else if (error.code !== 'auth/cancelled-popup-request') {
        alert("Login failed. Please try again.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 shadow rounded-lg">
        <div className="text-center">
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            My Recovery Toolkit
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Your personal companion for the journey ahead.
          </p>
        </div>
        
        <div className="mt-8">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className={`group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all ${
              isLoggingIn ? 'opacity-75 cursor-wait' : ''
            }`}
          >
            {isLoggingIn ? (
               <span className="flex items-center gap-2">
                 <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                 </svg>
                 Signing in...
               </span>
            ) : (
               'Sign in with Google'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}