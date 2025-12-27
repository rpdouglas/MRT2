/**
 * GITHUB COMMENT:
 * [AdminDashboard.tsx]
 * NEW: Internal tools for data maintenance.
 * FEATURE: Journal Deduplication utility using Batched Writes.
 * SECURITY: Restricted to users with 'isAdmin' context.
 */
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  doc, 
  type Firestore 
} from 'firebase/firestore';
import VibrantHeader from '../components/VibrantHeader';
import { THEME } from '../lib/theme';
import { 
  CommandLineIcon, 
  DocumentDuplicateIcon, 
  ShieldCheckIcon,
  UserGroupIcon,
  ArrowPathIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Navigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  const runDeduplication = async () => {
    if (!user || !db) return;
    if (!confirm("This will permanently delete duplicate journal entries. Continue?")) return;

    setLoading(true);
    setStatus("Scanning for duplicates...");
    const database: Firestore = db;

    try {
      const q = query(collection(database, 'journals'), where('uid', '==', user.uid));
      const snapshot = await getDocs(q);
      
      const seen = new Map<string, string>(); // key: content+timestamp, value: docId
      const duplicates: string[] = [];

      snapshot.docs.forEach(d => {
        const data = d.data();
        const content = data.content as string;
        const time = data.createdAt?.toMillis?.() || 0;
        const key = `${content.trim()}_${time}`;

        if (seen.has(key)) {
          duplicates.push(d.id);
        } else {
          seen.set(key, d.id);
        }
      });

      if (duplicates.length === 0) {
        setStatus("No duplicates found.");
        setLoading(false);
        return;
      }

      setStatus(`Found ${duplicates.length} duplicates. Deleting in batches...`);

      // Firestore Batch limit is 500
      let batch = writeBatch(database);
      let count = 0;

      for (const id of duplicates) {
        batch.delete(doc(database, 'journals', id));
        count++;
        if (count >= 400) {
          await batch.commit();
          batch = writeBatch(database);
          count = 0;
        }
      }
      
      if (count > 0) await batch.commit();

      setStatus(`Success! Removed ${duplicates.length} duplicate entries.`);
    } catch (e) {
      console.error(e);
      setStatus("Error running deduplication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`h-[100dvh] flex flex-col ${THEME.profile.page}`}>
      <VibrantHeader 
        title="Admin Tools"
        subtitle="Data maintenance and developer console."
        icon={CommandLineIcon}
        fromColor="from-slate-800"
        viaColor="via-gray-900"
        toColor="to-black"
      />

      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6 max-w-4xl mx-auto w-full">
        {status && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-3 text-blue-800 text-sm font-medium animate-fadeIn">
            {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
            {status}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TOOL: DEDUPLICATION */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-lg text-red-600">
                <DocumentDuplicateIcon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-gray-900">Journal Deduplicator</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Scans your journals for entries with identical content and timestamps created by multiple imports. Keeps the original and removes clones.
            </p>
            <button 
              onClick={runDeduplication}
              disabled={loading}
              className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all active:scale-95"
            >
              Run Clean Up
            </button>
          </div>

          {/* TOOL: ENCRYPTION AUDIT */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 opacity-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <ShieldCheckIcon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-gray-900">Security Audit</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Identifies unencrypted entries in the cloud that need re-saving to be secured by your new PIN.
            </p>
            <button disabled className="w-full py-3 bg-gray-100 text-gray-400 font-bold rounded-xl cursor-not-allowed">
              Coming Soon
            </button>
          </div>

          {/* TOOL: TEAM MANAGEMENT */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 opacity-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <UserGroupIcon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-gray-900">Manage Admins</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Grant developer access to other emails to help troubleshoot data issues.
            </p>
            <button disabled className="w-full py-3 bg-gray-100 text-gray-400 font-bold rounded-xl cursor-not-allowed">
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}