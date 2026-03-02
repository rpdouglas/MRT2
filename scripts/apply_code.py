import os

datamanagement_tsx_content = r'''/**
 * GITHUB COMMENT:
 * [DataManagement.tsx]
 * UX: Migrated User Guide CTA out of Data Management and into the General Profile tab (Ticket 2.4).
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
        </div>
    );
}
'''

profile_tsx_content = r'''/**
 * src/pages/Profile.tsx
 * GITHUB COMMENT:
 * [Profile.tsx]
 * FEAT: Migrated User Guide CTA to the General Tab for better UX context (Ticket 2.4).
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, updateProfileData } from '../lib/db';
import { Timestamp } from 'firebase/firestore'; 
import { updateProfile } from 'firebase/auth'; 
import VibrantHeader from '../components/VibrantHeader'; 
import DataManagement from '../components/profile/DataManagement';
import { 
  UserCircleIcon, 
  ArrowLeftOnRectangleIcon,
  UserGroupIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  CircleStackIcon,
  LockClosedIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { THEME } from '../lib/theme';

type TabType = 'general' | 'security' | 'data';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const appVersion = import.meta.env.VITE_APP_VERSION || 'Dev-Local';
  
  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [sobrietyDate, setSobrietyDate] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorPhone, setSponsorPhone] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        const data = await getProfile(user.uid);
        if (data) {
          setDisplayName(data.displayName || user.displayName || '');
          if (data.sobrietyDate) {
            setSobrietyDate(data.sobrietyDate.toDate().toISOString().split('T')[0]);
          }
          setSponsorName(data.sponsorName || '');
          setSponsorPhone(data.sponsorPhone || '');
          
          // DETECT ONBOARDING STATUS
          if (!data.hasCompletedOnboarding) {
              setIsOnboarding(true);
              setActiveTab('general'); // Force to general tab
          }
        } else {
          // If no profile document, they are definitely onboarding
          setIsOnboarding(true);
          setActiveTab('general');
        }
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      let sobrietyTimestamp: Timestamp | null = null;
      if (sobrietyDate) {
          const [y, m, d] = sobrietyDate.split('-').map(Number);
          const dateObj = new Date(y, m - 1, d);
          sobrietyTimestamp = Timestamp.fromDate(dateObj);
      }
      
      // ALWAYS SET ONBOARDING TO TRUE UPON SAVE
      await updateProfileData(user.uid, {
        displayName,
        sobrietyDate: sobrietyTimestamp,
        sponsorName,  
        sponsorPhone,
        hasCompletedOnboarding: true
      });

      // SYNC FIREBASE AUTH PROFILE FOR SIDEBAR REACTIVITY
      try {
          await updateProfile(user, { displayName });
      } catch (authErr) {
          console.warn("Failed to sync auth profile", authErr);
      }

      if (isOnboarding) {
          // THE RELEASE VALVE: Send them to the dashboard!
          navigate('/dashboard');
      } else {
          setMessage({ type: 'success', text: 'Profile updated successfully' });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

  return (
    <div className={`pb-24 min-h-screen ${THEME.profile.page}`}>
      
      <VibrantHeader 
        title="My Profile"
        subtitle={user?.email || ''}
        icon={UserCircleIcon}
        fromColor={THEME.profile.header.from}
        viaColor={THEME.profile.header.via}
        toColor={THEME.profile.header.to}
      />

      <div className="max-w-2xl mx-auto space-y-6 px-4 -mt-10 relative z-30">
        
        {isOnboarding && (
          <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg animate-slideDown">
              <h2 className="font-bold text-lg">Welcome to your Toolkit.</h2>
              <p className="text-sm text-blue-100 mt-1">To get started, please tell us your name and your sobriety date. This helps us calculate your milestones and dashboard stats.</p>
          </div>
        )}

        {/* TAB NAVIGATION */}
        {!isOnboarding && (
            <div className="bg-white p-1.5 rounded-xl shadow-lg border border-gray-200 flex">
                <button 
                    onClick={() => { setActiveTab('general'); setMessage(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'general' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <IdentificationIcon className="h-4 w-4" /> General
                </button>
                <button 
                    onClick={() => { setActiveTab('security'); setMessage(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'security' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <ShieldCheckIcon className="h-4 w-4" /> Security
                </button>
                <button 
                    onClick={() => { setActiveTab('data'); setMessage(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'data' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <CircleStackIcon className="h-4 w-4" /> Data
                </button>
            </div>
        )}

        {/* TAB 1: GENERAL */}
        {activeTab === 'general' && (
            <div className="space-y-6 animate-fadeIn">
                <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
                        {isOnboarding ? 'Required Setup' : 'Identity'}
                    </h3>
                    
                    {/* PERSONAL INFO */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Display Name {isOnboarding && <span className="text-red-500">*</span>}</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required={isOnboarding}
                            placeholder="How should we address you?"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Sobriety Date {isOnboarding && <span className="text-red-500">*</span>}</label>
                        <input
                            type="date"
                            value={sobrietyDate}
                            onChange={(e) => setSobrietyDate(e.target.value)}
                            required={isOnboarding}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                        <p className="mt-1 text-xs text-gray-500">Used to calculate your recovery stats on the dashboard.</p>
                    </div>

                    {/* SUPPORT NETWORK SECTION */}
                    <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <UserGroupIcon className="h-4 w-4 text-emerald-600" /> Support Network
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Contact Name</label>
                                <input
                                    type="text"
                                    placeholder="Sponsor, Therapist, etc."
                                    value={sponsorName}
                                    onChange={(e) => setSponsorName(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Phone Number</label>
                                <input
                                    type="tel"
                                    placeholder="+1 555-0199"
                                    value={sponsorPhone}
                                    onChange={(e) => setSponsorPhone(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                                />
                                <p className="mt-1 text-[10px] text-gray-400">Used for quick access in the SOS modal.</p>
                            </div>
                        </div>
                    </div>

                    {message && (
                    <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={saving || (isOnboarding && (!displayName || !sobrietyDate))}
                        className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md active:scale-95"
                    >
                        {saving ? 'Saving...' : isOnboarding ? 'Complete Setup' : 'Save Changes'}
                    </button>
                    </div>
                </form>

                {/* USER GUIDE CTA (Moved from DataManagement) */}
                {!isOnboarding && (
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <BookOpenIcon className="h-7 w-7" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">New to MRT?</h3>
                                <p className="text-blue-100 text-sm">Explore our visual guide to master your recovery tools.</p>
                            </div>
                        </div>
                        <a 
                            href="https://rpdouglas.github.io/MRT2/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-center w-full py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors active:scale-95 shadow-md"
                        >
                            View User Guide
                        </a>
                    </div>
                )}
            </div>
        )}

        {/* TAB 2: SECURITY */}
        {activeTab === 'security' && !isOnboarding && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6 animate-fadeIn">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                    <ShieldCheckIcon className="h-5 w-5 text-slate-500" /> Security & PIN
                </h3>
                
                <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50 rounded-xl border border-dashed border-gray-300">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <LockClosedIcon className="h-8 w-8 text-slate-400" />
                    </div>
                    <h4 className="text-md font-bold text-slate-700">Vault Security Tools</h4>
                    <p className="text-sm text-slate-500 max-w-xs mt-2">PIN Management and vault rotation tools are currently being upgraded for enhanced security.</p>
                    <div className="mt-5 px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase rounded-full tracking-wider border border-purple-200">
                        Coming in v2.5
                    </div>
                </div>
            </div>
        )}

        {/* TAB 3: DATA MANAGEMENT */}
        {activeTab === 'data' && !isOnboarding && (
            <DataManagement />
        )}

        {/* LOGOUT BUTTON (Always visible at bottom) */}
        <div className="border-t border-gray-300 pt-6 mt-8">
            <button
              onClick={handleLogout}
              className="w-full flex justify-center items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl font-semibold hover:bg-red-100 transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              Log Out
            </button>
        </div>

        <div className="text-center text-xs text-gray-400 font-mono">
            App Version: v{appVersion}
        </div>
      </div>
    </div>
  );
}
'''

def write_file(path, content):
    dirname = os.path.dirname(path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    # Ensure markdown backticks remain intact
    final_content = content.replace("~~~", "```").strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Updated UI: {path}")

if __name__ == "__main__":
    write_file("src/components/profile/DataManagement.tsx", datamanagement_tsx_content)
    write_file("src/pages/Profile.tsx", profile_tsx_content)
    print("✨ User Guide CTA successfully relocated to General tab.")