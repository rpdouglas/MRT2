// src/components/VaultGate.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEncryption } from '../contexts/EncryptionContext';
import { LockClosedIcon, KeyIcon, ShieldCheckIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface VaultGateProps {
  children: React.ReactNode;
}

export default function VaultGate({ children }: VaultGateProps) {
  const { isVaultSet, isVaultUnlocked, vaultLoading, unlockVault, setupVault } = useEncryption();
  const navigate = useNavigate();
  
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If loading, show spinner
  if (vaultLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-gray-500">Securing Vault...</p>
      </div>
    );
  }

  // If Unlocked, show content
  if (isVaultUnlocked) {
    return <>{children}</>;
  }

  // HANDLE SETUP FLOW (No changes to existing flow logic, just UI consistency)
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Recovery Vault</h2>
            <p className="text-gray-500 mb-6 text-sm">
                Your journal entries will be encrypted. Create a secure PIN. 
                <span className="block mt-2 text-red-500 font-bold">⚠️ If you lose this PIN, your data is lost forever.</span>
            </p>

            <form onSubmit={handleSetup} className="space-y-4">
                <input
                    type="password"
                    inputMode="numeric"
                    placeholder="Create PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full text-center text-2xl tracking-widest p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                />
                <input
                    type="password"
                    inputMode="numeric"
                    placeholder="Confirm PIN"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="w-full text-center text-2xl tracking-widest p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                    {isSubmitting ? 'Securing...' : 'Secure My Journal'}
                </button>
            </form>
        </div>
      </div>
    );
  }

  // HANDLE UNLOCK FLOW (Strict Check Implementation)
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;

    setIsSubmitting(true);
    setError('');

    const success = await unlockVault(pin);
    
    if (!success) {
      // 1. Show Error UI
      setError("Improper PIN. Access Denied.");
      
      // 2. Clear input to prevent rapid retries/confusion
      setPin('');
      
      // 3. Wait 1.5s then Redirect
      setTimeout(() => {
          navigate('/dashboard');
      }, 1500);
    } else {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center animate-fadeIn">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 relative overflow-hidden">
            
            {/* Transient Error Banner */}
            {error && (
                <div className="absolute top-0 left-0 w-full bg-red-500 text-white p-2 text-sm font-bold flex items-center justify-center gap-2 animate-slideDown">
                    <ExclamationCircleIcon className="h-5 w-5" />
                    {error}
                </div>
            )}

            <div className="bg-gray-100 p-3 rounded-full w-fit mx-auto mb-4 mt-2">
                <LockClosedIcon className="h-8 w-8 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Vault Locked</h2>
            <p className="text-gray-500 mb-6 text-sm">Enter your PIN to decrypt your journal.</p>

            <form onSubmit={handleUnlock} className="space-y-4">
                <input
                    type="password"
                    inputMode="numeric"
                    autoFocus
                    placeholder="Enter PIN"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value); setError(''); }}
                    className={`w-full text-center text-2xl tracking-widest p-3 border rounded-xl focus:ring-2 transition-all ${error ? 'border-red-300 ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-gray-500'}`}
                    autoComplete="new-password"
                    disabled={isSubmitting || !!error} // Lock input on error or submit
                />
                
                <button 
                    type="submit"
                    disabled={isSubmitting || !!error}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <span>Verifying...</span>
                    ) : (
                        <>
                            <KeyIcon className="h-5 w-5" />
                            Unlock
                        </>
                    )}
                </button>
            </form>
        </div>
    </div>
  );
}