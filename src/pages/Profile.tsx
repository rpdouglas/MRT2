import React, { useState, useEffect, useRef, Fragment } from 'react';
import posthog from 'posthog-js';
import { useAuth } from '../contexts/AuthContext';
import { useEncryption } from '../contexts/EncryptionContext';
import { Timestamp } from 'firebase/firestore';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { Dialog, Transition } from '@headlessui/react';
import { requestNotificationPermission } from '../lib/messaging';
import VibrantHeader from '../components/VibrantHeader';
import DataManagement from '../components/profile/DataManagement';
import { UserCircleIcon, UserGroupIcon, IdentificationIcon, ShieldCheckIcon, CircleStackIcon, KeyIcon, TrashIcon, ExclamationTriangleIcon, CheckCircleIcon, BanknotesIcon, ArrowLeftOnRectangleIcon, SwatchIcon, ArrowPathIcon, XMarkIcon, BookOpenIcon as BookOpenIconOutline } from '@heroicons/react/24/outline';
import { BookOpenIcon } from '@heroicons/react/24/solid';
import ModalitySelector from '../components/readings/ModalitySelector';
import { useNavigate, useParams } from 'react-router-dom';
import { THEME } from '../lib/theme';
import { HERO_COLORS } from '../lib/heroColors';
import { useHeroColor } from '../hooks/useHeroColor';
import { useUserProfile } from '../hooks/useUserProfile';
import AutosaveStatus, { type AutosaveState } from '../components/profile/AutosaveStatus';
import type { HeroColorKey } from '../lib/db';

type TabType = 'general' | 'security' | 'data';

function isTabType(value: string | undefined): value is TabType {
  return value === 'general' || value === 'security' || value === 'data';
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { changePin, resetVault } = useEncryption();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();

  const appVersion = import.meta.env.VITE_APP_VERSION || 'Dev-Local';

  // Client-side bounds only (no schema change) — a sobriety date can't be in the
  // future, and 100 years back is a generous floor for a implausibly-old date.
  const todayStr = new Date().toISOString().split('T')[0];
  const minSobrietyDateStr = new Date(new Date().setFullYear(new Date().getFullYear() - 100))
    .toISOString().split('T')[0];

  // Tab is derived from the URL (Project 58 Phase 4) so Security/Data are
  // deep-linkable and the browser back/forward stack steps between them —
  // /profile with no segment, or an unrecognized segment, falls back to General.
  const activeTab: TabType = isTabType(tab) ? tab : 'general';

  // Form State (General)
  const [displayName, setDisplayName] = useState('');
  const [sobrietyDate, setSobrietyDate] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorPhone, setSponsorPhone] = useState('');
  
  // Form State (Financial)
  const [substanceCost, setSubstanceCost] = useState('');
  const [costFrequency, setCostFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [currencySymbol, setCurrencySymbol] = useState('$');

  // Form State (Dashboard Badges — formerly "Anchor Notifications")
  const [notifyCheckIn, setNotifyCheckIn] = useState(true);
  const [notifyReading, setNotifyReading] = useState(true);

  // Form State (Push Notifications) — separate from the badge toggles above; this is
  // the only control that actually gates server-sent push (see dailyBeacon).
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [pushStatus, setPushStatus] = useState<AutosaveState>('idle');

  // Form State (Hero Appearance)
  const [heroColor, setHeroColor] = useState<HeroColorKey>('amber');
  const { updateHeroColor } = useHeroColor();
  const { profile, isLoading, updateProfile, patchFields } = useUserProfile();
  const populatedRef = useRef(false);

  // Autosave status per section — every field below saves on change/blur once
  // onboarding is complete; these only drive the "Saving… / Saved" indicator,
  // not the write itself (see commitIdentity/commitFinancial/commitSponsor/commitBadges).
  const [identityStatus, setIdentityStatus] = useState<AutosaveState>('idle');
  const [financialStatus, setFinancialStatus] = useState<AutosaveState>('idle');
  const [sponsorStatus, setSponsorStatus] = useState<AutosaveState>('idle');
  const [badgesStatus, setBadgesStatus] = useState<AutosaveState>('idle');

  const [completingSetup, setCompletingSetup] = useState(false);
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

  // Danger Zone: Reset Vault modal — replaces the old window.prompt()/alert() pair
  // with the same styled Headless UI Dialog pattern DataManagement's account-deletion
  // flow already uses, so the app's two most destructive actions look consistent.
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<'confirm' | 'typing' | 'resetting'>('confirm');
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);

  // Populates local form state from the profile query exactly once per mount —
  // deliberately not re-synced on every `profile` change, since useQuery may
  // background-refetch (e.g. on window focus) and we don't want that to
  // clobber a field the user is actively editing.
  useEffect(() => {
    if (populatedRef.current || isLoading || !user) return;

    if (profile) {
      setDisplayName(profile.displayName || user.displayName || '');
      if (profile.sobrietyDate) {
        setSobrietyDate(profile.sobrietyDate.toDate().toISOString().split('T')[0]);
      }
      setSponsorName(profile.sponsorName || '');
      setSponsorPhone(profile.sponsorPhone || '');

      setSubstanceCost(profile.substanceCost ? profile.substanceCost.toString() : '');
      setCostFrequency(profile.costFrequency || 'daily');
      setCurrencySymbol(profile.currencySymbol || '$');

      setNotifyCheckIn(profile.anchorSettings?.notifyCheckIn ?? true);
      setNotifyReading(profile.anchorSettings?.notifyReading ?? true);
      setPushNotificationsEnabled(profile.pushNotificationsEnabled ?? true);

      setHeroColor(profile.heroColor ?? 'amber');

      if (!profile.hasCompletedOnboarding) { setIsOnboarding(true); }
    } else {
      setIsOnboarding(true);
    }
    populatedRef.current = true;
  }, [profile, isLoading, user]);

  // A deep link straight to /profile/security or /profile/data before onboarding
  // is complete must not render a blank/broken tab — redirect to General instead.
  useEffect(() => {
    if (isOnboarding && activeTab !== 'general') {
      navigate('/profile/general', { replace: true });
    }
  }, [isOnboarding, activeTab, navigate]);

  const handleSelectHeroColor = (key: HeroColorKey) => {
    setHeroColor(key);
    updateHeroColor.mutate(key);
  };

  // Shared "flash then fade" transition for every autosave indicator below —
  // 'saved'/'error' show briefly, then the section returns to 'idle'.
  function flashStatus(setStatus: (s: AutosaveState) => void, ok: boolean) {
    setStatus(ok ? 'saved' : 'error');
    window.setTimeout(() => setStatus('idle'), ok ? 1800 : 3000);
  }

  // Applies immediately rather than waiting for a Save button, since it also has to
  // touch browser Notification permission and Firestore token state, not just a
  // profile field. Uses the same AutosaveStatus indicator as every other field below.
  const handleTogglePushNotifications = async (enabled: boolean) => {
    if (!user) return;
    const previous = pushNotificationsEnabled;
    setPushNotificationsEnabled(enabled);
    setPushStatus('saving');
    try {
      if (enabled) {
        await patchFields.mutateAsync({ pushNotificationsEnabled: true });
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          await requestNotificationPermission(user.uid);
        }
      } else {
        // Clearing fcmTokens is what actually excludes this user from dailyBeacon's
        // `fcmTokens != []` query — pushNotificationsEnabled is UI state for the toggle itself.
        await patchFields.mutateAsync({ pushNotificationsEnabled: false, fcmTokens: [] });
      }
      flashStatus(setPushStatus, true);
    } catch (err) {
      console.warn("Failed to update push notification preference", err);
      setPushNotificationsEnabled(previous);
      flashStatus(setPushStatus, false);
    }
  };

  const handleLogout = async () => { try { await logout(); navigate('/login'); } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Identity autosaves once onboarding is complete (no-ops during onboarding,
  // where displayName/sobrietyDate instead wait for handleCompleteSetup below).
  // Accepts an override for controls whose onChange fires once with the final
  // value (the date input) so the commit doesn't read stale state from before
  // the same-tick setSobrietyDate call has been applied.
  const commitIdentity = async (overrides?: { displayName?: string; sobrietyDate?: string }) => {
    if (!user || isOnboarding) return;
    const nextName = overrides?.displayName ?? displayName;
    const nextDateStr = overrides?.sobrietyDate ?? sobrietyDate;

    setIdentityStatus('saving');
    try {
      let sobrietyTimestamp: Timestamp | null = null;
      if (nextDateStr) {
        const [y, m, d] = nextDateStr.split('-').map(Number);
        sobrietyTimestamp = Timestamp.fromDate(new Date(y, m - 1, d));
      }
      await updateProfile.mutateAsync({ displayName: nextName, sobrietyDate: sobrietyTimestamp });

      // The Firestore write above is the field of record — if only this auth-profile
      // mirror fails, the field did save, so this reports 'partial', not 'error'.
      try {
        await updateAuthProfile(user, { displayName: nextName });
        flashStatus(setIdentityStatus, true);
      } catch (authErr) {
        console.warn("Failed to sync auth profile", authErr);
        setIdentityStatus('partial');
        window.setTimeout(() => setIdentityStatus('idle'), 3000);
      }
    } catch (err) {
      console.error(err);
      flashStatus(setIdentityStatus, false);
    }
  };

  const commitFinancial = async (overrides?: { costFrequency?: 'daily' | 'weekly' | 'monthly' }) => {
    if (!user) return;
    const nextFrequency = overrides?.costFrequency ?? costFrequency;

    setFinancialStatus('saving');
    try {
      await updateProfile.mutateAsync({
        substanceCost: substanceCost ? parseFloat(substanceCost) : 0,
        costFrequency: nextFrequency,
        currencySymbol,
      });
      flashStatus(setFinancialStatus, true);
    } catch (err) {
      console.error(err);
      flashStatus(setFinancialStatus, false);
    }
  };

  const commitSponsor = async () => {
    if (!user) return;
    setSponsorStatus('saving');
    try {
      await updateProfile.mutateAsync({ sponsorName, sponsorPhone });
      flashStatus(setSponsorStatus, true);
    } catch (err) {
      console.error(err);
      flashStatus(setSponsorStatus, false);
    }
  };

  // Uses patchFields (dot-path updateDoc), not updateProfile's top-level merge —
  // anchorSettings also holds lastReadingDate/defaultFellowship written by
  // useReadingPreferences, and a raw `anchorSettings: {...}` merge here would
  // silently overwrite those sibling keys.
  const commitBadges = async (next: { notifyCheckIn: boolean; notifyReading: boolean }) => {
    if (!user) return;
    setBadgesStatus('saving');
    try {
      await patchFields.mutateAsync({
        "anchorSettings.notifyCheckIn": next.notifyCheckIn,
        "anchorSettings.notifyReading": next.notifyReading,
      });
      flashStatus(setBadgesStatus, true);
    } catch (err) {
      console.error(err);
      flashStatus(setBadgesStatus, false);
    }
  };

  // Onboarding-only: identity fields wait for this explicit submit (which also
  // marks hasCompletedOnboarding and navigates to the Dashboard). Once onboarding
  // is complete, displayName/sobrietyDate switch to commitIdentity's autosave above.
  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isOnboarding) return;

    setCompletingSetup(true);
    setMessage(null);

    try {
      let sobrietyTimestamp: Timestamp | null = null;
      if (sobrietyDate) {
          const [y, m, d] = sobrietyDate.split('-').map(Number);
          const dateObj = new Date(y, m - 1, d);
          sobrietyTimestamp = Timestamp.fromDate(dateObj);
      }

      await updateProfile.mutateAsync({
        displayName,
        sobrietyDate: sobrietyTimestamp,
        hasCompletedOnboarding: true
      });

      try {
          await updateAuthProfile(user, { displayName });
      } catch (authErr) {
          console.warn("Failed to sync auth profile", authErr);
      }

      posthog.capture('profile_saved', { is_onboarding: isOnboarding, has_sobriety_date: !!sobrietyDate });
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to complete setup. Please try again.' });
    } finally {
      setCompletingSetup(false);
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

  const handleInitiateReset = () => {
      setResetStep('confirm');
      setResetConfirmText('');
      setResetError(null);
      setIsResetModalOpen(true);
  };

  const handleConfirmReset = async () => {
      if (resetConfirmText !== "RESET") return;

      setResetStep('resetting');
      setResetError(null);
      try {
          await resetVault();
          window.location.reload();
      } catch (e) {
          console.error("Hard reset failed", e);
          setResetError("Reset failed. Check your connection and try again.");
          setResetStep('typing');
      }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

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
                    onClick={() => { navigate('/profile/general'); setMessage(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'general' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <IdentificationIcon className="h-4 w-4" /> General
                </button>
                <button
                    onClick={() => { navigate('/profile/security'); setMessage(null); setRotError(null); setRotSuccess(false); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'security' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <ShieldCheckIcon className="h-4 w-4" /> Security
                </button>
                <button
                    onClick={() => { navigate('/profile/data'); setMessage(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'data' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <CircleStackIcon className="h-4 w-4" /> Data
                </button>
            </div>
        )}

        {/* TAB 1: GENERAL */}
        {activeTab === 'general' && (
            <div className="space-y-6 animate-fadeIn">
                <form onSubmit={handleCompleteSetup} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                            {isOnboarding ? 'Required Setup' : 'Identity'}
                        </h3>
                        {!isOnboarding && <AutosaveStatus state={identityStatus} />}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Display Name {isOnboarding && <span className="text-red-500">*</span>}</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            onBlur={() => commitIdentity()}
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
                            min={minSobrietyDateStr}
                            max={todayStr}
                            onChange={(e) => {
                                const next = e.target.value;
                                setSobrietyDate(next);
                                commitIdentity({ sobrietyDate: next });
                            }}
                            required={isOnboarding}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                        <p className="mt-1 text-xs text-gray-500">Used to calculate your recovery stats on the dashboard.</p>
                    </div>

                    {/* Financial Freedom Settings (PROJ-10 Refactor) */}
                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <BanknotesIcon className="h-4 w-4 text-emerald-600" /> Financial Freedom Tracker
                            </h4>
                            <AutosaveStatus state={financialStatus} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Currency</label>
                                <input
                                    type="text"
                                    value={currencySymbol}
                                    onChange={e => setCurrencySymbol(e.target.value)}
                                    onBlur={() => commitFinancial()}
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
                                    onBlur={() => commitFinancial()}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                    placeholder="e.g. 15.00"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Frequency</label>
                                <select
                                    value={costFrequency}
                                    onChange={e => {
                                        const next = e.target.value as 'daily' | 'weekly' | 'monthly';
                                        setCostFrequency(next);
                                        commitFinancial({ costFrequency: next });
                                    }}
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
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <UserGroupIcon className="h-4 w-4 text-purple-600" /> Support Network
                            </h4>
                            <AutosaveStatus state={sponsorStatus} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Contact Name</label>
                                <input
                                    type="text"
                                    placeholder="Sponsor, Therapist, etc."
                                    value={sponsorName}
                                    onChange={(e) => setSponsorName(e.target.value)}
                                    onBlur={commitSponsor}
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
                                    onBlur={commitSponsor}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                                />
                                <p className="mt-1 text-[10px] text-gray-400">Used for quick access in the SOS modal.</p>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Badges (formerly "Anchor Notifications") — in-app only, does not affect push */}
                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <IdentificationIcon className="h-4 w-4 text-amber-600" /> Dashboard Badges
                            </h4>
                            <AutosaveStatus state={badgesStatus} />
                        </div>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={notifyCheckIn}
                                    onChange={e => {
                                        const next = e.target.checked;
                                        setNotifyCheckIn(next);
                                        commitBadges({ notifyCheckIn: next, notifyReading });
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">Daily Check-In Badge</span>
                            </label>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={notifyReading}
                                    onChange={e => {
                                        const next = e.target.checked;
                                        setNotifyReading(next);
                                        commitBadges({ notifyCheckIn, notifyReading: next });
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">Daily Reading Badge</span>
                            </label>
                        </div>
                        <p className="mt-2 text-[10px] text-gray-400">Toggle whether the red exclamation badges show up on your dashboard anchor. This does not affect push notifications below.</p>
                    </div>

                    {/* Push Notifications — the only control that actually gates server-sent push (dailyBeacon) */}
                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <IdentificationIcon className="h-4 w-4 text-amber-600" /> Push Notifications
                            </h4>
                            <AutosaveStatus state={pushStatus} />
                        </div>
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={pushNotificationsEnabled}
                                disabled={pushStatus === 'saving'}
                                onChange={e => handleTogglePushNotifications(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">Milestone &amp; habit reminders on this device</span>
                        </label>
                        <p className="mt-2 text-[10px] text-gray-400">Turning this off stops all push notifications to this device. You can re-enable it any time.</p>
                    </div>

                    {/* Hero Appearance — PROJ-56 */}
                    <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                            <SwatchIcon className="h-4 w-4 text-rose-500" /> Hero Appearance
                        </h4>
                        <p className="text-[10px] text-gray-400 mb-3">Choose the color scheme for your dashboard sobriety hero.</p>
                        <div className="flex gap-3">
                            {(Object.keys(HERO_COLORS) as HeroColorKey[]).map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleSelectHeroColor(key)}
                                    title={HERO_COLORS[key].label}
                                    aria-label={`Use ${HERO_COLORS[key].label} theme`}
                                    className={`h-11 w-11 rounded-full ${HERO_COLORS[key].swatchClass} shadow-sm transition-transform hover:scale-110 ${
                                        heroColor === key ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Daily Reading Modalities — PROJ-42 */}
                    <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                            <BookOpenIconOutline className="h-4 w-4 text-sky-500" /> Daily Reading
                        </h4>
                        <p className="text-[10px] text-gray-400 mb-3">Select which reading traditions to rotate through each day.</p>
                        <ModalitySelector />
                    </div>

                    {isOnboarding && message && (
                    <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                    )}

                    {isOnboarding && (
                    <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={completingSetup || !displayName || !sobrietyDate}
                        className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md active:scale-95"
                    >
                        {completingSetup ? 'Saving...' : 'Complete Setup'}
                    </button>
                    </div>
                    )}
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
                        onClick={handleInitiateReset}
                        disabled={isRotating}
                        className="w-full sm:w-auto px-6 py-3 bg-white text-red-600 border-2 border-red-200 font-bold rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Destroy & Reset Vault
                    </button>
                </div>

            </div>
        )}

        {/* RESET VAULT MODAL — mirrors DataManagement's account-deletion Dialog pattern */}
        <Transition appear show={isResetModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => (resetStep === 'resetting' ? null : setIsResetModalOpen(false))}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-4"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all border-t-8 border-red-600">

                                {resetStep !== 'resetting' && (
                                    <button
                                        onClick={() => setIsResetModalOpen(false)}
                                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                )}

                                <div className="flex items-center gap-3 text-red-600 mb-4">
                                    <ExclamationTriangleIcon className="h-8 w-8" />
                                    <Dialog.Title as="h3" className="text-xl font-bold">
                                        Reset Vault
                                    </Dialog.Title>
                                </div>

                                {resetError && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg">
                                        {resetError}
                                    </div>
                                )}

                                {resetStep === 'confirm' && (
                                    <div className="animate-fadeIn">
                                        <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                            This permanently destroys all encrypted journals and workbooks. They cannot be recovered. Are you absolutely sure?
                                        </p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setIsResetModalOpen(false)}
                                                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => setResetStep('typing')}
                                                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
                                            >
                                                Yes, Proceed
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {resetStep === 'typing' && (
                                    <form
                                        onSubmit={(e) => { e.preventDefault(); handleConfirmReset(); }}
                                        className="animate-fadeIn space-y-4"
                                    >
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            Type <strong>RESET</strong> below to confirm you want to permanently wipe your vault.
                                        </p>
                                        <input
                                            type="text"
                                            autoFocus
                                            value={resetConfirmText}
                                            onChange={(e) => setResetConfirmText(e.target.value)}
                                            placeholder="Type RESET to confirm"
                                            className="w-full text-sm rounded-xl border-gray-300 focus:border-red-500 focus:ring-red-500 p-3"
                                        />
                                        <button
                                            type="submit"
                                            disabled={resetConfirmText !== 'RESET'}
                                            className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
                                        >
                                            Destroy & Reset Vault
                                        </button>
                                    </form>
                                )}

                                {resetStep === 'resetting' && (
                                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn">
                                        <ArrowPathIcon className="h-12 w-12 text-red-500 animate-spin" />
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 mb-2">Destroying Vault</h4>
                                            <p className="text-sm font-mono text-gray-500 animate-pulse">Wiping encrypted journals and workbooks…</p>
                                        </div>
                                        <p className="text-xs font-bold text-red-600 uppercase tracking-widest mt-4">
                                            Do not close this window!
                                        </p>
                                    </div>
                                )}

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>

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
