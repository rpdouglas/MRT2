import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEncryption } from '../contexts/EncryptionContext';
import { getProfile, updateProfileData } from '../lib/db';
import { Timestamp, doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../lib/firebase';
import VibrantHeader from '../components/VibrantHeader'; 
import DataManagement from '../components/profile/DataManagement';
import { UserCircleIcon, UserGroupIcon, IdentificationIcon, ShieldCheckIcon, CircleStackIcon, KeyIcon, TrashIcon, ExclamationTriangleIcon, CheckCircleIcon, BanknotesIcon, ArrowLeftOnRectangleIcon, BookOpenIcon as BookOpenIconOutline } from '@heroicons/react/24/outline';
import { BookOpenIcon } from '@heroicons/react/24/solid';
import ModalitySelector from '../components/readings/ModalitySelector';
import { useNavigate } from 'react-router-dom';
import { THEME } from '../lib/theme';

type TabType = 'general' | 'security' | 'data';

export default function Profile() {
  const { user, logout } = useAuth();
  const { changePin, resetVault } = useEncryption();
  const navigate = useNavigate();
  
  const appVersion = import.meta.env.VITE_APP_VERSION || 'Dev-Local';
  
  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Form State (General)
  const [displayName, setDisplayName] = useState('');
  const [sobrietyDate, setSobrietyDate] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorPhone, setSponsorPhone] = useState('');
  
  // Form State (Financial)
  const [substanceCost, setSubstanceCost] = useState('');
  const [costFrequency, setCostFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [currencySymbol, setCurrencySymbol] = useState('$');

  // Form State (Anchor Notifications)
  const [notifyCheckIn, setNotifyCheckIn] = useState(true);
  const [notifyReading, setNotifyReading] = useState(true);
  const [notifyIntent, setNotifyIntent] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Security State
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [rotProgress, setRotProgress] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [rotError, setRotError] = useState<string | null>(null);
  const [rotSuccess, setRotSuccess] = useState(false);

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
          
          setSubstanceCost(data.substanceCost ? data.substanceCost.toString() : '');
          setCostFrequency(data.costFrequency || 'daily');
          setCurrencySymbol(data.currencySymbol || '$');
          
          setNotifyCheckIn(data.anchorSettings?.notifyCheckIn ?? true);
          setNotifyReading(data.anchorSettings?.notifyReading ?? true);
          setNotifyIntent(data.anchorSettings?.notifyIntent ?? true);
          
          if (!data.hasCompletedOnboarding) { setIsOnboarding(true); setActiveTab('general'); }
        } else { setIsOnboarding(true); setActiveTab('general'); }
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleLogout = async () => { try { await logout(); navigate('/login'); } catch (error) {
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
      
      await updateProfileData(user.uid, {
        displayName,
        sobrietyDate: sobrietyTimestamp,
        sponsorName,  
        sponsorPhone,
        substanceCost: substanceCost ? parseFloat(substanceCost) : 0,
        costFrequency,
        currencySymbol,
        hasCompletedOnboarding: true
      });

      try {
        if (db) {
            await updateDoc(doc(db, "users", user.uid), {
                "anchorSettings.notifyCheckIn": notifyCheckIn,
                "anchorSettings.notifyReading": notifyReading,
                "anchorSettings.notifyIntent": notifyIntent
            });
        }
      } catch (err) {
        console.warn("Failed to update anchor settings", err);
      }

      try {
          await updateProfile(user, { displayName });
      } catch (authErr) {
          console.warn("Failed to sync auth profile", authErr);
      }

      if (isOnboarding) {
          navigate('/dashboard');
      } else {
          setMessage({ type: 'success', text: 'Profile updated successfully' });
      }
    } catch (error) { console.error(error); setMessage({ type: 'error', text: 'Failed to update profile' }); } finally {
      setSaving(false);
    }
  };

  const handleRotation = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!oldPin || !newPin || !confirmPin) return;
      if (newPin !== confirmPin) return setRotError("New PINs do not match.");
      if (newPin.length < 4) return setRotError("PIN must be at least 4 digits.");
      if (oldPin === newPin) return setRotError("New PIN must be different than your old PIN.");

      setIsRotating(true);
      setRotError(null);
      setRotSuccess(false);
      setRotProgress(0);

      try {
          await changePin(oldPin, newPin, setRotProgress);
          setRotSuccess(true);
          setOldPin('');
          setNewPin('');
          setConfirmPin('');
      } catch (err: unknown) {
          const error = err as Error;
          if (error.message === 'INCORRECT_PIN') {
              setRotError("Current PIN is incorrect.");
          } else if (error.message === 'PARTIAL_ROTATION_FAILURE') {
              setRotError("Your PIN change was interrupted partway through. Don't close the app — tap \"Update PIN\" again with the same PINs below to finish safely.");
          } else {
              setRotError("An error occurred during rotation. Please try again.");
              console.error(error);
          }
      } finally {
          setIsRotating(false);
      }
  };

  const handleHardReset = async () => {
      const confirmText = prompt("CRITICAL WARNING: This permanently deletes ALL encrypted journals and workbooks. They cannot be recovered.\n\nType RESET to confirm.");
      if (confirmText !== "RESET") return;

      setIsRotating(true);
      try {
          await resetVault();
          alert("Vault has been permanently destroyed. You may now generate a new one.");
          window.location.reload();
      } catch (e) { console.error("Hard reset failed", e); alert("Reset failed. Check connection."); setIsRotating(false); } 
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
                    onClick={() => { setActiveTab('security'); setMessage(null); setRotError(null); setRotSuccess(false); }}
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

                    {/* Financial Freedom Settings (PROJ-10 Refactor) */}
                    <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <BanknotesIcon className="h-4 w-4 text-emerald-600" /> Financial Freedom Tracker
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Currency</label>
                                <input 
                                    type="text" 
                                    value={currencySymbol} 
                                    onChange={e => setCurrencySymbol(e.target.value)} 
                                    maxLength={3} 
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" 
                                    placeholder="$" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Usage Cost</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    min="0"
                                    value={substanceCost} 
                                    onChange={e => setSubstanceCost(e.target.value)} 
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" 
                                    placeholder="e.g. 15.00" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Frequency</label>
                                <select 
                                    value={costFrequency} 
                                    onChange={e => setCostFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')} 
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        </div>
                        <p className="mt-2 text-[10px] text-gray-400">Track how much money you save by staying clean on your dashboard.</p>
                    </div>

                    {/* Support Network */}
                    <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <UserGroupIcon className="h-4 w-4 text-purple-600" /> Support Network
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Contact Name</label>
                                <input
                                    type="text"
                                    placeholder="Sponsor, Therapist, etc."
                                    value={sponsorName}
                                    onChange={(e) => setSponsorName(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Phone Number</label>
                                <input
                                    type="tel"
                                    placeholder="+1 555-0199"
                                    value={sponsorPhone}
                                    onChange={(e) => setSponsorPhone(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                                />
                                <p className="mt-1 text-[10px] text-gray-400">Used for quick access in the SOS modal.</p>
                            </div>
                        </div>
                    </div>

                    {/* Anchor Notifications */}
                    <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <IdentificationIcon className="h-4 w-4 text-amber-600" /> Anchor Notifications
                        </h4>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3">
                                <input type="checkbox" checked={notifyCheckIn} onChange={e => setNotifyCheckIn(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                <span className="text-sm font-medium text-gray-700">Daily Check-In Badge</span>
                            </label>
                            <label className="flex items-center gap-3">
                                <input type="checkbox" checked={notifyReading} onChange={e => setNotifyReading(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                <span className="text-sm font-medium text-gray-700">Daily Reading Badge</span>
                            </label>
                            <label className="flex items-center gap-3">
                                <input type="checkbox" checked={notifyIntent} onChange={e => setNotifyIntent(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                <span className="text-sm font-medium text-gray-700">Daily Intent Badge</span>
                            </label>
                        </div>
                        <p className="mt-2 text-[10px] text-gray-400">Toggle whether the red exclamation badges show up on your dashboard anchor.</p>
                    </div>

                    {/* Daily Reading Modalities — PROJ-42 */}
                    <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                            <BookOpenIconOutline className="h-4 w-4 text-sky-500" /> Daily Reading
                        </h4>
                        <p className="text-[10px] text-gray-400 mb-3">Select which reading traditions to rotate through each day.</p>
                        <ModalitySelector />
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
            <div className="space-y-6 animate-fadeIn">
                
                {/* Change PIN Block */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2 mb-5">
                        <KeyIcon className="h-5 w-5 text-blue-600" /> Change Vault PIN
                    </h3>

                    {rotSuccess && (
                        <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl text-sm font-bold border border-green-100 flex items-start gap-3 animate-fadeIn">
                            <CheckCircleIcon className="h-5 w-5 shrink-0" />
                            PIN changed successfully. All data securely re-encrypted.
                        </div>
                    )}

                    {rotError && (
                        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 flex items-start gap-3 animate-fadeIn">
                            <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
                            {rotError}
                        </div>
                    )}

                    <form onSubmit={handleRotation} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Current PIN</label>
                            <input
                                type="password"
                                inputMode="numeric"
                                value={oldPin}
                                onChange={(e) => setOldPin(e.target.value)}
                                disabled={isRotating}
                                className="w-full text-center text-xl tracking-widest p-3 rounded-xl border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">New PIN</label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    value={newPin}
                                    onChange={(e) => setNewPin(e.target.value)}
                                    disabled={isRotating}
                                    className="w-full text-center text-xl tracking-widest p-3 rounded-xl border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Confirm New</label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    value={confirmPin}
                                    onChange={(e) => setConfirmPin(e.target.value)}
                                    disabled={isRotating}
                                    className="w-full text-center text-xl tracking-widest p-3 rounded-xl border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                                    required
                                />
                            </div>
                        </div>

                        {isRotating && (
                            <div className="pt-2 animate-fadeIn">
                                <div className="flex justify-between text-xs font-bold text-blue-600 mb-1">
                                    <span>Re-encrypting Vault...</span>
                                    <span>{rotProgress}%</span>
                                </div>
                                <div className="w-full bg-blue-100 rounded-full h-2.5 overflow-hidden">
                                    <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${rotProgress}%` }}></div>
                                </div>
                                <p className="text-[10px] text-red-500 mt-2 text-center uppercase tracking-widest font-bold animate-pulse">
                                    Do not close the application!
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isRotating || !oldPin || !newPin || !confirmPin}
                            className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md mt-2"
                        >
                            {isRotating ? 'Rotating Keys...' : 'Change PIN'}
                        </button>
                    </form>
                </div>

                {/* Crypto-Shredding Block */}
                <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                    <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                        <TrashIcon className="h-5 w-5" /> Danger Zone: Reset Vault
                    </h3>
                    <p className="text-sm text-red-800 mb-4 leading-relaxed">
                        If you forgot your PIN or want to start fresh, you can permanently wipe your vault. <strong>This instantly destroys all encrypted journals and workbooks.</strong>
                    </p>
                    <button
                        onClick={handleHardReset}
                        disabled={isRotating}
                        className="w-full sm:w-auto px-6 py-3 bg-white text-red-600 border-2 border-red-200 font-bold rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Destroy & Reset Vault
                    </button>
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
