import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, updateProfileData } from '../lib/db';
import { importLegacyJournals } from '../lib/importer';
import { 
  UserCircleIcon, 
  ArrowLeftOnRectangleIcon, 
  ArrowUpTrayIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // --- VERSIONING ---
  const appVersion = import.meta.env.VITE_APP_VERSION || 'Dev-Local';
  
  const [displayName, setDisplayName] = useState('');
  const [sobrietyDate, setSobrietyDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        const data = await getProfile(user.uid);
        if (data) {
          setDisplayName(data.displayName || user.displayName || '');
          // Format date for input field (YYYY-MM-DD)
          if (data.sobrietyDate) {
            setSobrietyDate(data.sobrietyDate.toDate().toISOString().split('T')[0]);
          }
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
      // Create date object correctly
      let dateObj: Date | null = null;
      if (sobrietyDate) {
         const [y, m, d] = sobrietyDate.split('-').map(Number);
         // Note: Month is 0-indexed in JS Date
         dateObj = new Date(y, m - 1, d);
      }
      
      // Update in Firestore
      await updateProfileData(user.uid, {
        displayName,
        sobrietyDate: dateObj
      });

      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  // --- IMPORT HANDLER ---
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
      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error("Import failed", error);
      setImportStatus('Error: Import failed. Check console for details.');
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
        <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
           {user?.photoURL ? (
             <img src={user.photoURL} alt="Profile" className="h-16 w-16 rounded-full" />
           ) : (
             <UserCircleIcon className="h-10 w-10" />
           )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user?.displayName || 'User Profile'}</h1>
          <p className="text-gray-500">{user?.email}</p>
        </div>
      </div>

      {/* --- PROFILE FORM --- */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Sobriety Date</label>
          <input
            type="date"
            value={sobrietyDate}
            onChange={(e) => setSobrietyDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
          <p className="mt-1 text-xs text-gray-500">Used to calculate your recovery stats on the dashboard.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-end gap-3">
           <button
             type="submit"
             disabled={saving}
             className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
           >
             {saving ? 'Saving...' : 'Save Changes'}
           </button>
        </div>
      </form>

      {/* --- IMPORT SECTION --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowUpTrayIcon className="h-5 w-5 text-gray-500" />
            Import Legacy Data
        </h3>
        <p className="text-sm text-gray-600 mb-4">
            If you have a JSON backup of your journals from the old app, you can import them here. 
            This will add them to your history.
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
                        <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
                    )}
                    {importStatus}
                </div>
            )}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <button
          onClick={handleLogout}
          className="w-full flex justify-center items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg font-semibold hover:bg-red-100 transition-colors"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          Log Out
        </button>
      </div>

      {/* --- VERSION INFO --- */}
      <div className="text-center text-xs text-gray-400 font-mono">
          App Version: v{appVersion}
      </div>
    </div>
  );
}