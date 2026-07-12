import { useState, Fragment } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { executeTotalAccountAnnihilation } from '../../lib/deletion';
import { ExclamationTriangleIcon, TrashIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function AccountDeletionModal() {
    const { user, reauthenticateWithEmail, reauthenticateWithGoogle, deleteAccount } = useAuth();
    const navigate = useNavigate();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteStep, setDeleteStep] = useState<'confirm' | 'reauth' | 'shredding'>('confirm');
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteProgressMsg, setDeleteProgressMsg] = useState('');
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const isGoogleUser = user?.providerData.some(p => p.providerId === 'google.com');

    const handleInitiateDelete = () => { setDeleteStep('confirm'); setDeleteError(null); setDeletePassword(''); setIsDeleteModalOpen(true); };

    const handleReAuthAndDelete = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        if (!user) return;

        setDeleteError(null);
        setDeleteStep('shredding');
        setDeleteProgressMsg('Verifying secure session...');

        try {
            if (isGoogleUser) {
                await reauthenticateWithGoogle();
            } else {
                if (!deletePassword) {
                    setDeleteError("Password is required.");
                    setDeleteStep('reauth');
                    return;
                }
                await reauthenticateWithEmail(deletePassword);
            }

            setDeleteProgressMsg('Locating and destroying all database records...');
            await executeTotalAccountAnnihilation(user.uid, (msg) => setDeleteProgressMsg(msg));

            setDeleteProgressMsg('Removing authentication profile...');
            await deleteAccount();

            setIsDeleteModalOpen(false);
            navigate('/login');
        } catch (err: unknown) {
            const error = err as { code?: string; message?: string };
            console.error("Deletion failed", error);

            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                setDeleteError('Incorrect password. Please try again.');
            } else if (error.code === 'auth/requires-recent-login') {
                setDeleteError('Session expired. Please close this modal, log out, and log back in to try again.');
            } else if (error.code === 'auth/popup-closed-by-user') {
                setDeleteError('Google verification cancelled.');
            } else {
                setDeleteError(error.message || 'An error occurred during deletion.');
            }
            setDeleteStep('reauth');
        }
    };

    return (
        <>
            {/* DANGER ZONE: ACCOUNT DELETION */}
            <div className="bg-red-50 p-6 rounded-xl border border-red-200 mt-8">
                <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                    <TrashIcon className="h-5 w-5" /> Danger Zone: Delete Account
                </h3>
                <p className="text-sm text-red-800 mb-4 leading-relaxed">
                    This action is permanent and cannot be undone. We will execute a cryptographic shredding of all your journals, workbooks, tasks, AI logs, and metadata before deleting your authentication profile. <strong>You will lose everything.</strong>
                </p>
                <button
                    onClick={handleInitiateDelete}
                    className="w-full sm:w-auto px-6 py-3 bg-white text-red-600 border-2 border-red-200 font-bold rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95"
                >
                    Request Account Deletion
                </button>
            </div>

            {/* ACCOUNT DELETION MODAL */}
            <Transition appear show={isDeleteModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => deleteStep === 'shredding' ? null : setIsDeleteModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95 translate-y-4"
                                enterTo="opacity-100 scale-100 translate-y-0"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100 translate-y-0"
                                leaveTo="opacity-0 scale-95 translate-y-4"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all border-t-8 border-red-600">

                                    {deleteStep !== 'shredding' && (
                                        <button
                                            onClick={() => setIsDeleteModalOpen(false)}
                                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                                        >
                                            <XMarkIcon className="h-6 w-6" />
                                        </button>
                                    )}

                                    <div className="flex items-center gap-3 text-red-600 mb-4">
                                        <ExclamationTriangleIcon className="h-8 w-8" />
                                        <Dialog.Title as="h3" className="text-xl font-bold">
                                            Permanent Deletion
                                        </Dialog.Title>
                                    </div>

                                    {deleteError && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg">
                                            {deleteError}
                                        </div>
                                    )}

                                    {deleteStep === 'confirm' && (
                                        <div className="animate-fadeIn">
                                            <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                                Are you absolutely sure? This will wipe your account, journals, insights, and all settings from our servers instantly. There is no recovery.
                                            </p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setIsDeleteModalOpen(false)}
                                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => setDeleteStep('reauth')}
                                                    className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
                                                >
                                                    Yes, Proceed
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {deleteStep === 'reauth' && (
                                        <div className="animate-fadeIn">
                                            <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                                To prevent unauthorized deletion, please verify your identity to proceed with the data wipe.
                                            </p>

                                            {isGoogleUser ? (
                                                <button
                                                    onClick={() => handleReAuthAndDelete()}
                                                    className="w-full flex items-center justify-center px-4 py-4 border border-gray-300 shadow-sm text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all"
                                                >
                                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5 mr-3" />
                                                    Re-verify with Google
                                                </button>
                                            ) : (
                                                <form onSubmit={handleReAuthAndDelete} className="space-y-4">
                                                    <input
                                                        type="password"
                                                        required
                                                        autoFocus
                                                        placeholder="Enter your account password"
                                                        value={deletePassword}
                                                        onChange={(e) => setDeletePassword(e.target.value)}
                                                        className="w-full text-sm rounded-xl border-gray-300 focus:border-red-500 focus:ring-red-500 p-3"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={!deletePassword}
                                                        className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                    >
                                                        Verify & Delete
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    )}

                                    {deleteStep === 'shredding' && (
                                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn">
                                            <ArrowPathIcon className="h-12 w-12 text-red-500 animate-spin" />
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-900 mb-2">Executing Annihilation Protocol</h4>
                                                <p className="text-sm font-mono text-gray-500 animate-pulse">{deleteProgressMsg}</p>
                                            </div>
                                            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mt-4">
                                                Do not close this window!
                                            </p>
                                        </div>
                                    )}

                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
}
