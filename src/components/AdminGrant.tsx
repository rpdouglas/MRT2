/**
 * GITHUB COMMENT:
 * [AdminGrant.tsx]
 * TEMPORARY UTILITY: One-time script to grant 'admin' role to the current logged-in user.
 * INSTRUCTIONS: Add to App.tsx, click the button, then DELETE this file and its reference.
 */
import { useState } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, type Firestore } from 'firebase/firestore';
import { ShieldCheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function AdminGrant() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const grantAdmin = async () => {
    if (!user || !db) {
      setStatus("Error: No user logged in or DB not found.");
      return;
    }

    const database: Firestore = db;
    setLoading(true);
    setStatus("Processing grant...");

    try {
      const userRef = doc(database, 'users', user.uid);
      await updateDoc(userRef, {
        role: 'admin'
      });
      setStatus(`SUCCESS: ${user.email} is now an Admin. Refresh the app.`);
    } catch (error) {
      console.error(error);
      setStatus("Error: Check console. You may need to update Firestore rules first.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 left-4 z-[9999] animate-bounce">
      <button
        onClick={grantAdmin}
        disabled={loading}
        className="bg-red-600 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 hover:bg-red-700 transition-all active:scale-95"
      >
        {loading ? (
          <ArrowPathIcon className="h-6 w-6 animate-spin" />
        ) : (
          <ShieldCheckIcon className="h-6 w-6" />
        )}
        <span className="font-bold text-xs uppercase">Grant Admin Access</span>
      </button>
      {status && (
        <div className="absolute bottom-full mb-2 left-0 bg-black text-white text-[10px] p-2 rounded w-48 shadow-lg">
          {status}
        </div>
      )}
    </div>
  );
}