/**
 * GITHUB COMMENT:
 * [DataManagement.tsx]
 * UPDATED: Integrated Google Drive status indicator.
 * Displays whether auto-sync is active based on the existence of the driveAccessToken.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../contexts/EncryptionContext';
import { db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc, type Firestore } from 'firebase/firestore';
import { fetchAllUserData } from '../../lib/db';
import { prepareDataForExport, generateJSON, generatePDF } from '../../lib/exporter';
import { importLegacyJournals } from '../../lib/importer';
import { 
    ArrowDownTrayIcon, 
    ArrowUpTrayIcon, 
    DocumentTextIcon, 
    CodeBracketSquareIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    LockClosedIcon,
    CloudArrowUpIcon
} from '@heroicons/react/24/outline';

export default function DataManagement() {
    const { user, driveAccessToken } = useAuth();
    const { isVaultUnlocked } = useEncryption();
    
    const [exporting, setExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [exportError, setExportError] = useState<string | null>(null);
    const [lastExportStr, setLastExportStr] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const [importStatus, setImportStatus] = useState<string | null>(null);

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

    return (
        <div className="space-y-8">
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

                {!isVaultUnlocked ? (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                        <LockClosedIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-3">Vault is locked. Please unlock to decrypt data.</p>
                        <button disabled className="bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-bold cursor-not-allowed">
                            Unlock Required
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                            onClick={() => handleExport('json')}
                            disabled={exporting}
                            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group"
                        >
                            <CodeBracketSquareIcon className="h-8 w-8 text-gray-400 group-hover:text-blue-600 mb-2" />
                            <span className="font-bold text-gray-700 group-hover:text-blue-700">JSON Backup</span>
                            <span className="text-xs text-gray-400">Machine-readable format</span>
                        </button>

                        <button 
                            onClick={() => handleExport('pdf')}
                            disabled={exporting}
                            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all group"
                        >
                            <DocumentTextIcon className="h-8 w-8 text-gray-400 group-hover:text-red-600 mb-2" />
                            <span className="font-bold text-gray-700 group-hover:text-red-700">PDF Document</span>
                            <span className="text-xs text-gray-400">Readable format</span>
                        </button>
                    </div>
                )}

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
        </div>
    );
}