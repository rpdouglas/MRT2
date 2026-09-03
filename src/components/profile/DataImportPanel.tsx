import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../contexts/EncryptionContext';
import { importBackup } from '../../lib/importer';
import type { ImportResult } from '../../lib/importer';
import { ArrowUpTrayIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Replaces the old blanket "Check console for details" message — names the
// likely cause where importBackup's rejection lets us tell, so a
// non-technical user isn't sent to devtools for a routine "wrong file" mistake.
function describeImportError(error: unknown): string {
    if (error instanceof SyntaxError) {
        return "Error: That file isn't valid JSON. Export a fresh backup from MRT and try that file instead.";
    }
    const err = error as { code?: string; message?: string };
    if (err?.code === 'permission-denied') {
        return "Error: You don't have permission to write this data. Try signing out and back in, then retry.";
    }
    if (err?.code === 'unavailable' || err?.message?.toLowerCase().includes('network')) {
        return "Error: Lost connection during import. Check your network and try again.";
    }
    if (err?.message?.toLowerCase().includes('vault is locked')) {
        return "Error: Your vault is locked. Unlock it (go to Journal) before importing, then try again.";
    }
    return "Error: Couldn't import this file. Confirm it's an MRT backup, or try exporting a fresh copy.";
}

// PROJ-110: summarizes every collection a real backup can restore, not just
// journals — only mentions a category if the file actually contained any of
// it, so a legacy journals-only export doesn't print "0 tasks, 0 workbook
// answers, 0 game history" noise.
function summarizeImportResult(result: ImportResult): string {
    const parts: string[] = [];
    const labels: [keyof ImportResult, string][] = [
        ['journals', 'journal'],
        ['tasks', 'task'],
        ['workbookAnswers', 'workbook answer'],
        ['gameProgress', 'game history'],
    ];
    let totalErrors = 0;
    for (const [key, label] of labels) {
        const { success, errors } = result[key];
        totalErrors += errors;
        if (success > 0) parts.push(`${success} ${label}${success === 1 ? '' : 's'}`);
    }
    const summary = parts.length > 0 ? parts.join(', ') : 'nothing recognizable';
    return `Success! Imported ${summary}. (${totalErrors} skipped)`;
}

export default function DataImportPanel() {
    const { user } = useAuth();
    const { encrypt } = useEncryption();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const [importStatus, setImportStatus] = useState<string | null>(null);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
          setImportStatus('Error: Please select a valid JSON file.');
          return;
        }

        setImporting(true);
        setImportStatus('Reading file and mapping data...');

        try {
          const result = await importBackup(user.uid, file, encrypt);
          setImportStatus(summarizeImportResult(result));
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) { console.error("Import failed", error); setImportStatus(describeImportError(error)); } finally {
          setImporting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ArrowUpTrayIcon className="h-5 w-5 text-gray-500" />
                Import Backup
            </h3>
            <p className="text-sm text-gray-600 mb-4">
                Restore journals, tasks, workbook answers, and game history from a JSON backup. This adds entries to your history — it doesn't overwrite what's already there.
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
    );
}
