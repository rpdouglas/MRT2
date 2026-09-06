import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { executeTotalAccountAnnihilation } from '../lib/deletion';
import { usePageMeta } from '../hooks/usePageMeta';
import { ExclamationTriangleIcon, TrashIcon, ArrowPathIcon, EnvelopeIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

type Step = 'login' | 'confirm' | 'deleting' | 'done';

/**
 * Public, unauthenticated web route required by Google Play's Data Safety
 * policy: a web-accessible path to request account deletion without needing
 * to open the app. Distinct from AccountDeletionModal.tsx, which re-verifies
 * an *already active* in-app session — this page authenticates fresh, since
 * a visitor here may have no session on this browser/device at all.
 */
export default function DeleteAccount() {
    usePageMeta({
        title: 'Delete Your Account',
        description: 'Permanently delete your My Recovery Toolkit account and all associated encrypted data.',
        path: '/delete-account',
    });

    const { user, loginWithEmail, loginWithGoogle, deleteAccount } = useAuth();

    const [step, setStep] = useState<Step>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [progressMsg, setProgressMsg] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleEmailLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        try {
            await loginWithEmail(email, password);
            setStep('confirm');
        } catch (err: unknown) {
            const error = err as { code?: string };
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                setError('Incorrect email or password.');
            } else if (error.code === 'auth/user-not-found') {
                setError('No account found with that email.');
            } else if (error.code === 'auth/too-many-requests') {
                setError('Too many attempts. Please wait a few minutes and try again.');
            } else {
                setError('Sign-in failed. Please check your details and try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setIsSubmitting(true);
        try {
            await loginWithGoogle();
            setStep('confirm');
        } catch (err: unknown) {
            const error = err as { code?: string };
            if (error.code === 'auth/popup-closed-by-user') {
                setError('Google sign-in was cancelled.');
            } else {
                setError('Google sign-in failed. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!user) return;
        setError(null);
        setStep('deleting');
        setProgressMsg('Locating and destroying all database records...');
        try {
            await executeTotalAccountAnnihilation(user.uid, (msg) => setProgressMsg(msg));
            setProgressMsg('Removing authentication profile...');
            await deleteAccount();
            setStep('done');
        } catch (err: unknown) {
            const error = err as { code?: string; message?: string };
            if (error.code === 'auth/requires-recent-login') {
                setError('Your session expired during deletion. Please reload this page and sign in again to retry.');
            } else {
                setError(error.message || 'Something went wrong during deletion. Please reload and try again.');
            }
            setStep('confirm');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-t-8 border-red-600 p-6">
                <div className="flex items-center gap-3 text-red-600 mb-2">
                    <TrashIcon className="h-8 w-8" />
                    <h1 className="text-xl font-bold text-gray-900">Delete Your MRT Account</h1>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                    This page lets you permanently delete your My Recovery Toolkit account and all associated data, without needing to open the app.
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg flex items-start gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
                        {error}
                    </div>
                )}

                {step === 'login' && (
                    <div className="animate-fadeIn">
                        <p className="text-sm text-gray-600 mb-4">First, sign in to confirm this is your account.</p>
                        <form onSubmit={handleEmailLogin} className="space-y-3">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-12 block w-full rounded-xl border-slate-200 shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 sm:text-sm p-3 bg-slate-50 focus:bg-white transition-all outline-none"
                                />
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <LockClosedIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-12 block w-full rounded-xl border-slate-200 shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 sm:text-sm p-3 bg-slate-50 focus:bg-white transition-all outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {isSubmitting ? 'Signing in...' : 'Continue'}
                            </button>
                        </form>

                        <div className="relative my-5">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                            <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-slate-600">Or</span></div>
                        </div>

                        <button
                            onClick={handleGoogleLogin}
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center px-4 py-3 border-2 border-slate-200 shadow-sm text-sm font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-all"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5 mr-3" />
                            Sign in with Google
                        </button>
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="animate-fadeIn">
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                            Signed in as <strong>{user?.email}</strong>. This will permanently and immediately cryptographically shred all your journals, workbooks, tasks, and settings from our servers, then delete your login. <strong>There is no recovery.</strong>
                        </p>
                        <button
                            onClick={handleConfirmDelete}
                            className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
                        >
                            Permanently Delete My Account
                        </button>
                    </div>
                )}

                {step === 'deleting' && (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn">
                        <ArrowPathIcon className="h-12 w-12 text-red-500 animate-spin" />
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-2">Deleting Your Account</h2>
                            <p className="text-sm font-mono text-gray-500 animate-pulse">{progressMsg}</p>
                        </div>
                        <p className="text-xs font-bold text-red-600 uppercase tracking-widest">Do not close this window</p>
                    </div>
                )}

                {step === 'done' && (
                    <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
                        <CheckCircleIcon className="h-12 w-12 text-green-500" />
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-2">Account Deleted</h2>
                            <p className="text-sm text-gray-500">Your account and all associated data have been permanently removed.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
