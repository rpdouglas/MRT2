import React, { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../contexts/EncryptionContext';
import { db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc, type Firestore } from 'firebase/firestore';
import { fetchAllUserData } from '../../lib/db';
import { prepareDataForExport, generateJSON, generatePDF } from '../../lib/exporter';
import { importLegacyJournals } from '../../lib/importer';
import { executeTotalAccountAnnihilation } from '../../lib/deletion';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import PremiumGate from '../PremiumGate';
import VaultGate from '../VaultGate';
import { 
    ArrowDownTrayIcon, 
    ArrowUpTrayIcon, 
    DocumentTextIcon, 
    CodeBracketSquareIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    CloudArrowUpIcon,
    TrashIcon,
    ArrowPathIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

export default function DataManagement() {
    const { user, driveAccessToken, reauthenticateWithEmail, reauthenticateWithGoogle, deleteAccount } = useAuth();
    const { isVaultUnlocked } = useEncryption();
    const navigate = useNavigate();
    
    const [exporting, setExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [exportError, setExportError] = useState<string | null>(null);
    const [lastExportStr, setLastExportStr] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const [importStatus, setImportStatus] = useState<string | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteStep, setDeleteStep] = useState<'confirm' | 'reauth' | 'shredding'>('confirm');
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteProgressMsg, setDeleteProgressMsg] = useState('');
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const isGoogleUser = user?.providerData.some(p => p.providerId === 'google.com');

    const loadLastExportDate = useCallback(async () => {
        if (!user || !db) return;
        const database: Firestore = db;
        const snap = await getDoc(doc(database, 'users', user.uid));
        if (snap.exists() && snap.data().lastExportAt) {
            const date = snap.data().lastExportAt.toDate() as Date;
            setLastExportStr(date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
    }, [user]);

    useEffect(() => {
        loadLastExportDate();
    }, [loadLastExportDate]);

    const handleExport = async (format: 'json' | 'pdf') => {
        if (!user || !db) return;
        if (!isVaultUnlocked) {
            setExportError("Please unlock your vault (go to Journal) before exporting data.");
            return;
        }

        setExporting(true);
        setProgress(0);
        setExportError(null);

        try {
            const rawData = await fetchAllUserData(user.uid);
            setProgress(10);
            const cleanData = await prepareDataForExport(rawData, (p) => setProgress(10 + Math.floor(p * 0.8)));
            
            let blob: Blob;
            let filename: string;
            const dateStr = new Date().toISOString().split('T')[0];

            if (format === 'json') {
                blob = generateJSON(cleanData);
                filename = `mrt-backup-${dateStr}.json`;
            } else {
                blob = await generatePDF(cleanData);
                filename = `mrt-journal-${dateStr}.pdf`;
            }
            setProgress(100);

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            const database: Firestore = db;
            const userRef = doc(database, 'users', user.uid);
            await setDoc(userRef, { lastExportAt: serverTimestamp() }, { merge: true });
            loadLastExportDate();

        } catch (error) {
            console.error("Export failed", error);
            setExportError("Failed to generate export. Check console.");
        } finally {
            setTimeout(() => setExporting(false), 2000);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
    
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
          setImportStatus('Error: Please select a valid JSON file.');
          return;
        }
    
        setImporting(true);
        setImportStatus('Reading file and mapping data...');
    
        try {
          const result = await importLegacyJournals(user.uid, file);
          setImportStatus(`Success! Imported ${result.success} entries. (${result.errors} skipped)`);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
          console.error("Import failed", error);
          setImportStatus('Error: Import failed. Check console for details.');
        } finally {
          setImporting(false);
        }
    };

    const handleInitiateDelete = () => {
        setDeleteStep('confirm');
        setDeleteError(null);
        setDeletePassword('');
        setIsDeleteModalOpen(true);
    };

    const handleReAuthAndDelete = async (e?: React.FormEvent) => {
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
        <div className="space-y-8 animate-fadeIn">
            {/* GOOGLE DRIVE SYNC STATUS */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <CloudArrowUpIcon className="h-5 w-5 text-blue-600" />
                        Cloud Auto-Sync
                    </h3>
                    {driveAccessToken ? (
                        <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase rounded border border-green-200">Active</span>
                    ) : (
                        <span className="px-2 py-1 bg-gray-50 text-gray-400 text-[10px] font-bold uppercase rounded border border-gray-200">Inactive</span>
                    )}
                </div>
                
                {driveAccessToken ? (
                    <div className="text-sm text-gray-600 space-y-2">
                        <p>Linked to <strong>Google Drive</strong>. Your data is backed up automatically every 7 days when the vault is unlocked.</p>
                        {lastExportStr && <p className="text-xs font-medium text-gray-400 italic">Last Cloud Sync: {lastExportStr}</p>}
                    </div>
                ) : (
                    <p className="text-sm text-gray-600">
                        Automatic backups are only available for users who signed in with Google. Email users must perform manual exports.
                    </p>
                )}
            </div>

            {/* MANUAL EXPORT */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <ArrowDownTrayIcon className="h-5 w-5 text-blue-600" />
                    Data Sovereignty (Manual Export)
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                    Download a copy of your data. You can save a raw JSON backup or a readable PDF.
                    <span className="block mt-2 text-orange-600 text-xs font-semibold bg-orange-50 p-2 rounded border border-orange-100">
                        <ExclamationTriangleIcon className="h-3 w-3 inline mr-1" />
                        Warning: Exported files are NOT encrypted. Store them securely.
                    </span>
                </p>

                <VaultGate>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                            onClick={() => handleExport('json')}
                            disabled={exporting}
                            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group w-full"
                        >
                            <CodeBracketSquareIcon className="h-8 w-8 text-gray-400 group-hover:text-blue-600 mb-2" />
                            <span className="font-bold text-gray-700 group-hover:text-blue-700">JSON Backup</span>
                            <span className="text-xs text-gray-400">Machine-readable format</span>
                        </button>

                        <PremiumGate fallbackMode="button_swap" customMessage="Unlock PDF Exports">
                            <button 
                                onClick={() => handleExport('pdf')}
                                disabled={exporting}
                                className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all group w-full"
                            >
                                <DocumentTextIcon className="h-8 w-8 text-gray-400 group-hover:text-red-600 mb-2" />
                                <span className="font-bold text-gray-700 group-hover:text-red-700">PDF Document</span>
                                <span className="text-xs text-gray-400">Readable format</span>
                            </button>
                        </PremiumGate>
                    </div>
                </VaultGate>

                {exporting && (
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Processing Vault...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                {exportError && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                        {exportError}
                    </div>
                )}
            </div>

            {/* IMPORT */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ArrowUpTrayIcon className="h-5 w-5 text-gray-500" />
                    Import Legacy Data
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Restore data from a JSON backup. This will add entries to your history.
                </p>

                <div className="flex flex-col gap-4">
                    <input 
                        type="file" 
                        accept=".json"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex flex-col items-center justify-center gap-2"
                    >
                        {importing ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        ) : (
                            <ArrowUpTrayIcon className="h-8 w-8" />
                        )}
                        <span className="font-medium">{importing ? 'Importing...' : 'Click to Select JSON File'}</span>
                    </button>

                    {importStatus && (
                        <div className={`flex items-start gap-2 text-sm p-3 rounded-md ${importStatus.includes('Success') ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                            {importStatus.includes('Success') ? (
                                <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
                            ) : (
                                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                            )}
                            {importStatus}
                        </div>
                    )}
                </div>
            </div>

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

        </div>
    );
}
