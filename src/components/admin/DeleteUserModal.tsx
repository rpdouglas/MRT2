import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon, TrashIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import type { UserProfile } from '../../lib/db';
import { useAdminUserDeletion } from '../../hooks/useAdminUserDeletion';
import { AdminDeletionError } from '../../lib/adminUserDeletion';

interface DeleteUserModalProps {
    user: UserProfile | null;
    onClose: () => void;
    onDeleted: (uid: string) => void;
}

export default function DeleteUserModal({ user, onClose, onDeleted }: DeleteUserModalProps) {
    const [purgeFirestoreData, setPurgeFirestoreData] = useState(true);
    const [deleteAuthRecord, setDeleteAuthRecord] = useState(true);
    const [confirmEmail, setConfirmEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const mutation = useAdminUserDeletion();

    const isOpen = !!user;
    const targetEmail = user?.email ?? '';
    // Some test/ghost accounts have no email on file — fall back to
    // requiring the uid instead, so confirmation can never be satisfied by
    // two empty strings matching each other.
    const confirmTarget = targetEmail || user?.uid || '';
    const emailMatches = confirmTarget.length > 0 && confirmEmail.trim().toLowerCase() === confirmTarget.trim().toLowerCase();
    const scopeSelected = purgeFirestoreData || deleteAuthRecord;

    const handleClose = () => {
        if (mutation.isPending) return;
        setPurgeFirestoreData(true);
        setDeleteAuthRecord(true);
        setConfirmEmail('');
        setError(null);
        mutation.reset();
        onClose();
    };

    const handleDelete = async () => {
        if (!user || !emailMatches || !scopeSelected) return;
        setError(null);
        try {
            await mutation.mutateAsync({ targetUid: user.uid, purgeFirestoreData, deleteAuthRecord });
            toast.success(`Deleted ${targetEmail || user.uid}.`);
            onDeleted(user.uid);
            handleClose();
        } catch (err: unknown) {
            const message = err instanceof AdminDeletionError ? err.message : 'Deletion failed. Check the audit log for details.';
            setError(message);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translate-y-4" enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all border-t-8 border-red-600 relative">
                                {!mutation.isPending && (
                                    <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                )}

                                <div className="flex items-center gap-3 text-red-600 mb-4">
                                    <ExclamationTriangleIcon className="h-8 w-8" />
                                    <Dialog.Title as="h3" className="text-xl font-bold">
                                        Delete User Account
                                    </Dialog.Title>
                                </div>

                                {mutation.isPending ? (
                                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
                                        <ArrowPathIcon className="h-10 w-10 text-red-500 animate-spin" />
                                        <p className="text-sm font-mono text-gray-500">Deleting {targetEmail || user?.uid}...</p>
                                        <p className="text-xs font-bold text-red-600 uppercase tracking-widest">Do not close this window!</p>
                                    </div>
                                ) : (
                                    <div className="text-left animate-fadeIn">
                                        <p className="text-sm text-gray-600 mb-4">
                                            Deleting <strong>{targetEmail || user?.uid}</strong> is permanent and cannot be undone. This action is logged to the admin audit trail.
                                        </p>

                                        {error && (
                                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg">
                                                {error}
                                            </div>
                                        )}

                                        <div className="space-y-2 mb-4">
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={purgeFirestoreData}
                                                    onChange={(e) => setPurgeFirestoreData(e.target.checked)}
                                                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                />
                                                Purge Firestore data (journals, tasks, workbooks, etc.)
                                            </label>
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={deleteAuthRecord}
                                                    onChange={(e) => setDeleteAuthRecord(e.target.checked)}
                                                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                />
                                                Delete Auth record (frees the email/uid to sign up again)
                                            </label>
                                        </div>

                                        {!scopeSelected && (
                                            <p className="text-xs text-amber-600 mb-4">Select at least one option above.</p>
                                        )}

                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            Type {targetEmail ? "the account's email" : "the account's uid"} to confirm
                                        </label>
                                        <input
                                            type="text"
                                            value={confirmEmail}
                                            onChange={(e) => setConfirmEmail(e.target.value)}
                                            placeholder={confirmTarget}
                                            className="w-full text-sm rounded-xl border-gray-300 focus:border-red-500 focus:ring-red-500 p-3 mb-4"
                                        />

                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleClose}
                                                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleDelete}
                                                disabled={!emailMatches || !scopeSelected}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <TrashIcon className="h-4 w-4" /> Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
