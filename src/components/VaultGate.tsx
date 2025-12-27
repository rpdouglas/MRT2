/**
 * GITHUB COMMENT:
 * [VaultGate.tsx]
 * UPDATED: Integrated the Vault Recovery Wizard with educational Zero-Knowledge disclosures.
 * Added "Emergency Reset" UI which triggers after one failed PIN attempt.
 */
import React, { useState } from 'react';
//import { useNavigate } from 'react-router-dom';
import { useEncryption } from '../contexts/EncryptionContext';
import { 
  LockClosedIcon, 
  KeyIcon, 
  ShieldCheckIcon, 
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

interface VaultGateProps {
  children: React.ReactNode;
}

export default function VaultGate({ children }: VaultGateProps) {
  const { isVaultSet, isVaultUnlocked, vaultLoading, unlockVault, setupVault, resetVault } = useEncryption();
  //const navigate = useNavigate();
  
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecoveryWizard, setShowRecoveryWizard] = useState(false);

  if (vaultLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-gray-500">Securing Vault...</p>
      </div>
    );
  }

  if (isVaultUnlocked) {
    return <>{children}</>;
  }

  const handleHardReset = async () => {
    const confirmed = window.confirm(
      "PERMANENT DATA LOSS WARNING:\n\n" +
      "This will wipe your current encryption key. Your existing data will remain in the cloud but will be PERMANENTLY UNREADABLE.\n\n" +
      "You should only do this if you have a backup file ready to re-import.\n\n" +
      "Proceed with Reset?"
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await resetVault();
      setShowRecoveryWizard(false);
      setPin('');
      setError('');
    } catch (e) {
      console.error(e);
      setError("Reset failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVaultSet) {
    const handleSetup = async (e: React.FormEvent) => {
      e.preventDefault();
      if (pin.length < 4) {
        setError("PIN must be at least 4 digits.");
        return;
      }
      if (pin !== confirmPin) {
        setError("PINs do not match.");
        return;
      }
      setIsSubmitting(true);
      await setupVault(pin);
      setIsSubmitting(false);
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center animate-fadeIn">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
            <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Initialize Encryption</h2>
            <div className="bg-blue-50 p-3 rounded-lg text-left mb-6 border border-blue-100">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>Zero-Knowledge System:</strong> We never see or store your PIN. Your recovery key is derived locally. This means your data is private, but <strong>cannot be recovered if you lose this PIN</strong> without a manual backup.
                </p>
            </div>

            <form onSubmit={handleSetup} className="space-y-4">
                <input
                    type="password"
                    inputMode="numeric"
                    placeholder="Set Security PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full text-center text-2xl tracking-widest p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                />
                <input
                    type="password"
                    inputMode="numeric"
                    placeholder="Confirm PIN"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="w-full text-center text-2xl tracking-widest p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                />
                {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
                
                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                    {isSubmitting ? 'Generating Key...' : 'Secure My Data'}
                </button>
            </form>
        </div>
      </div>
    );
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    setIsSubmitting(true);
    setError('');
    const success = await unlockVault(pin);
    if (!success) {
      setError("Improper PIN. Access Denied.");
      setPin('');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center animate-fadeIn">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 relative overflow-hidden">
            {error && (
                <div className="absolute top-0 left-0 w-full bg-red-500 text-white p-2 text-sm font-bold flex items-center justify-center gap-2">
                    <ExclamationCircleIcon className="h-5 w-5" />
                    {error}
                </div>
            )}

            <div className="bg-gray-100 p-3 rounded-full w-fit mx-auto mb-4 mt-2">
                <LockClosedIcon className="h-8 w-8 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Vault Locked</h2>
            <p className="text-gray-500 mb-6 text-sm">Enter your PIN to decrypt your content.</p>

            <form onSubmit={handleUnlock} className="space-y-4">
                <input
                    type="password"
                    inputMode="numeric"
                    autoFocus
                    placeholder="Enter PIN"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value); setError(''); }}
                    className={`w-full text-center text-2xl tracking-widest p-3 border rounded-xl focus:ring-2 transition-all ${error ? 'border-red-300 ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-gray-500'}`}
                    disabled={isSubmitting}
                />
                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isSubmitting ? <span>Verifying...</span> : <><KeyIcon className="h-5 w-5" /> Unlock</>}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100">
                <button 
                  onClick={() => setShowRecoveryWizard(true)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Forgot PIN or Locked Out?
                </button>
            </div>
        </div>

        {showRecoveryWizard && (
          <div className="fixed inset-0 z-[60] bg-gray-900/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-left animate-slideUp">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <ExclamationTriangleIcon className="h-8 w-8" />
                <h3 className="text-xl font-bold">Vault Recovery</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Because we use <strong>Zero-Knowledge encryption</strong>, we cannot reset your PIN via email. Resetting the vault will allow you to create a new PIN, but your current cloud data will be unreadable.
              </p>
              
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6">
                <h4 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <ArrowUpTrayIcon className="h-4 w-4" /> Recommended Steps:
                </h4>
                <ol className="text-xs text-amber-800 space-y-2 list-decimal pl-4">
                  <li>Find your most recent <strong>JSON Backup</strong> file.</li>
                  <li>Click "Reset & Wipe" below.</li>
                  <li>Create a new PIN.</li>
                  <li>Go to Profile &rarr; Import to restore your data.</li>
                </ol>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleHardReset}
                  className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <TrashIcon className="h-5 w-5" /> Reset & Wipe Vault
                </button>
                <button 
                  onClick={() => setShowRecoveryWizard(false)}
                  className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                >
                  Nevermind, I'll try again
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}