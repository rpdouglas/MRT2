/**
 * GITHUB COMMENT:
 * [VaultGate.tsx]
 * CLEANUP: Removed unused 'err' variable and redundant eslint-disable directives.
 * MAINTAINED: Recovery Wizard UI and Emergency Reset flow logic.
 */
import React, { useState } from 'react';
import { useEncryption } from '../contexts/EncryptionContext';
import { 
  LockClosedIcon, 
  KeyIcon, 
  ShieldCheckIcon, 
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface VaultGateProps {
  children: React.ReactNode;
}

export default function VaultGate({ children }: VaultGateProps) {
  const { isVaultSet, isVaultUnlocked, vaultLoading, unlockVault, setupVault, resetVault } = useEncryption();
  
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecoveryWizard, setShowRecoveryWizard] = useState(false);

  if (vaultLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 font-medium">Securing Vault...</p>
      </div>
    );
  }

  if (isVaultUnlocked) {
    return <>{children}</>;
  }

  const handleHardReset = async () => {
    const confirmed = window.confirm(
      "CRITICAL: PERMANENT DATA LOSS WARNING\n\n" +
      "This will wipe your current security key. Your existing journals will be UNREADABLE.\n\n" +
      "Do not proceed unless you have a backup file to import later.\n\n" +
      "Reset now?"
    );
    
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await resetVault();
      setShowRecoveryWizard(false);
      setPin('');
      setError('');
      window.location.reload();
    } catch (e) {
      console.error("Reset failed", e);
      setError("Reset failed. Please check connection.");
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
      try {
        await setupVault(pin);
      } catch {
        setError("Setup failed.");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center animate-fadeIn">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
            <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Recovery Vault</h2>
            <div className="bg-blue-50 p-4 rounded-xl text-left mb-6 border border-blue-100">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>Zero-Knowledge Policy:</strong> Your PIN is never stored on our servers. This ensures your privacy, but it means <strong>lost PINs cannot be recovered</strong> without a manual backup file.
                </p>
            </div>

            <form onSubmit={handleSetup} className="space-y-4">
                <input
                    type="password"
                    inputMode="numeric"
                    placeholder="New Security PIN"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value); setError(''); }}
                    className="w-full text-center text-2xl tracking-widest p-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                />
                <input
                    type="password"
                    inputMode="numeric"
                    placeholder="Confirm PIN"
                    value={confirmPin}
                    onChange={(e) => { setConfirmPin(e.target.value); setError(''); }}
                    className="w-full text-center text-2xl tracking-widest p-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                />
                {error && <p className="text-red-500 text-sm font-bold animate-pulse">{error}</p>}
                
                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-md disabled:opacity-50 active:scale-95"
                >
                    {isSubmitting ? 'Generating Vault...' : 'Secure My Journal'}
                </button>
            </form>
        </div>
      </div>
    );
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || isSubmitting) return;

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
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100 relative overflow-hidden">
            
            {error && (
                <div className="absolute top-0 left-0 w-full bg-red-500 text-white p-3 text-sm font-bold flex items-center justify-center gap-2 animate-slideDown">
                    <ExclamationCircleIcon className="h-5 w-5" />
                    {error}
                </div>
            )}

            <div className="bg-gray-100 p-3 rounded-full w-fit mx-auto mb-4 mt-4">
                <LockClosedIcon className="h-8 w-8 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Vault Locked</h2>
            <p className="text-gray-500 mb-6 text-sm">Please enter your PIN to decrypt your data.</p>

            <form onSubmit={handleUnlock} className="space-y-4">
                <input
                    type="password"
                    inputMode="numeric"
                    autoFocus
                    placeholder="Enter PIN"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value); setError(''); }}
                    className={`w-full text-center text-3xl tracking-widest p-4 border rounded-2xl focus:ring-2 outline-none transition-all ${error ? 'border-red-300 ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-blue-500'}`}
                    disabled={isSubmitting}
                />
                
                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                >
                    {isSubmitting ? <span>Verifying...</span> : <><KeyIcon className="h-5 w-5" /> Unlock Vault</>}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100">
                <button 
                  onClick={() => setShowRecoveryWizard(true)}
                  className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                >
                  Forgot PIN or Locked Out?
                </button>
            </div>
        </div>

        {showRecoveryWizard && (
          <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-left animate-slideUp relative">
              <button 
                onClick={() => setShowRecoveryWizard(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              <div className="flex items-center gap-3 text-red-600 mb-4">
                <ExclamationTriangleIcon className="h-8 w-8" />
                <h3 className="text-xl font-bold">Vault Recovery</h3>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Privacy is our priority. Since we do not store your PIN, we cannot "reset" it for you. You must wipe the current lock to set a new one.
              </p>
              
              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 mb-8">
                <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <ArrowUpTrayIcon className="h-4 w-4" /> Recovery Steps:
                </h4>
                <ol className="text-xs text-amber-800 space-y-3 list-decimal pl-4 font-medium">
                  <li>Locate your most recent <strong>JSON Backup</strong> file.</li>
                  <li>Click <strong>Reset & Wipe</strong> below.</li>
                  <li>Create a new PIN immediately.</li>
                  <li>Restore entries via <strong>Profile &rarr; Import</strong>.</li>
                </ol>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleHardReset}
                  className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  <TrashIcon className="h-5 w-5" /> Reset & Wipe Vault
                </button>
                <button 
                  onClick={() => setShowRecoveryWizard(false)}
                  className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}