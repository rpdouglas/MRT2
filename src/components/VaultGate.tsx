import React, { useState } from 'react';
import { useEncryption } from '../contexts/EncryptionContext';
import { LockClosedIcon, KeyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface VaultGateProps {
  children: React.ReactNode;
}

export default function VaultGate({ children }: VaultGateProps) {
  const { isVaultSet, isVaultUnlocked, vaultLoading, unlockVault, setupVault } = useEncryption();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

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

  // HANDLE SETUP FLOW
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
      await setupVault(pin);
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
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
                />
                <input
                    type="password"
                    inputMode="numeric"
                    placeholder="Confirm PIN"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="w-full text-center text-2xl tracking-widest p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md"
                >
                    Secure My Journal
                </button>
            </form>
        </div>
      </div>
    );
  }

  // HANDLE UNLOCK FLOW
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await unlockVault(pin);
    if (!success) {
        setError("Incorrect PIN.");
        setPin('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
            <div className="bg-gray-100 p-3 rounded-full w-fit mx-auto mb-4">
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
                    className="w-full text-center text-2xl tracking-widest p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500"
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <button 
                    type="submit"
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                    <KeyIcon className="h-5 w-5" />
                    Unlock
                </button>
            </form>
        </div>
    </div>
  );
}