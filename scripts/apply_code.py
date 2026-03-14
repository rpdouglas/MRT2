import os

FENCE = chr(96) * 3

FILES = {
    "firebase.json": r"""{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "headers": [
      {
        "source": "/index.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      }
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
""",

    "src/components/ErrorBoundary.tsx": r"""import { Component, type ErrorInfo, type ReactNode } from "react";
import { ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { db } from "../lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // Triage Bug Fix: Catch Vite PWA Chunk Loading Errors
    const msg = error.message.toLowerCase();
    if (msg.includes('dynamically imported module') || msg.includes('failed to fetch')) {
        console.warn("Chunk load error detected. Reloading to fetch latest assets...");
        window.location.reload();
        return;
    }
    
    // Attempt to log to Firestore (Telemetry)
    if (db) {
        try {
            addDoc(collection(db, 'client_errors'), {
                message: error.message,
                stack: error.stack || 'No stack trace',
                componentStack: errorInfo.componentStack,
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: Timestamp.now()
            });
        } catch (e) {
            console.error("Failed to log error telemetry", e);
        }
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            </div>
            
            <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 text-sm mb-6">
              We encountered an unexpected issue. Don't worry, your data is safe.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Reload Application
            </button>
            
            <details className="mt-6 text-left">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Technical Details</summary>
              <pre className="mt-2 text-[10px] text-red-800 bg-red-50 p-2 rounded overflow-auto max-h-32">
                {this.state.error?.message}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
""",

    "src/components/SobrietyHero.tsx": r"""import { useMemo, useRef } from 'react';
import { Timestamp } from 'firebase/firestore';
import { CalendarDaysIcon, ShareIcon } from '@heroicons/react/24/outline';
import { calculateSobrietyDuration } from '../lib/dateUtils';
import { toPng } from 'html-to-image';

interface SobrietyHeroProps {
    date?: Timestamp | Date | null;
    levelData?: {
        level: number;
        currentXP: number;
        nextLevelXP: number;
        progressPercent: number;
    };
    archetype?: string;
}

export default function SobrietyHero({ date, levelData, archetype }: SobrietyHeroProps) {
    const heroRef = useRef<HTMLDivElement>(null);

    // Calculate Time Stats
    const stats = useMemo(() => {
        if (!date) return null;
        const startDate = date instanceof Date ? date : date.toDate();
        return calculateSobrietyDuration(startDate);
    }, [date]);

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!heroRef.current) return;
        try {
            const dataUrl = await toPng(heroRef.current, { cacheBust: true, pixelRatio: 2 });
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], 'mrt-milestone.png', { type: 'image/png' });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'My Recovery Milestone',
                    text: 'Tracking my journey with My Recovery Toolkit. 🛡️',
                    files: [file]
                });
            } else {
                const link = document.createElement('a');
                link.download = 'mrt-milestone.png';
                link.href = dataUrl;
                link.click();
            }
        } catch (err) {
            console.error('Failed to share image', err);
        }
    };

    if (!stats) {
        return (
            <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 rounded-3xl p-4 text-center text-white shadow-xl shadow-orange-500/20 border border-white/20">
                <div className="opacity-90 mb-1.5 font-bold uppercase tracking-widest text-xs drop-shadow-sm">Begin the Journey</div>
                <p className="text-sm font-medium drop-shadow-sm">Set your sobriety date in Profile to track your freedom.</p>
            </div>
        );
    }

    return (
        <div ref={heroRef} className="bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 rounded-3xl p-4 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group border border-white/20">
            {/* Share Button (Hidden during image export natively by html-to-image if we wanted, but leaving it looks fine) */}
            <button
                onClick={handleShare}
                className="absolute top-3 right-3 z-20 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                title="Share Milestone"
            >
                <ShareIcon className="h-4 w-4 text-white" />
            </button>

            {/* Dynamic Background Texture */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            {/* Decorative Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-300 opacity-20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                
                {/* Main Counters (Squeezed Margins & Padding) */}
                <div className="grid grid-cols-3 gap-1 text-center divide-x divide-white/30">
                    <div className="px-1">
                        <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md leading-none">{stats.years}</div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase opacity-90 mt-0.5 drop-shadow-sm">Years</div>
                    </div>
                    <div className="px-1">
                        <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md leading-none">{stats.months}</div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase opacity-90 mt-0.5 drop-shadow-sm">Months</div>
                    </div>
                    <div className="px-1">
                        <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md leading-none">{stats.days}</div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase opacity-90 mt-0.5 drop-shadow-sm">Days</div>
                    </div>
                </div>

                {/* Unified Footer: Gamification & Total Days (Squeezed Separator) */}
                {levelData && archetype && (
                    <div className="mt-2 pt-2 border-t border-white/20 space-y-2">
                        
                        {/* Gamification Stats (Single Row - SCALED UP) */}
                        <div className="flex justify-between items-end text-xs sm:text-sm font-bold uppercase tracking-widest drop-shadow-sm opacity-95 gap-2">
                            {/* Left: Rank & Level */}
                            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                                <span className="truncate">Rank: {archetype}</span>
                                <span className="opacity-50">|</span>
                                <span>LVL: {levelData.level}</span>
                            </div>
                            
                            {/* Right: Progress & XP */}
                            <div className="text-right shrink-0">
                                <span className="hidden sm:inline opacity-80 mr-1.5">Progress</span>
                                <span className="font-mono tracking-normal">{levelData.currentXP.toLocaleString()} / {levelData.nextLevelXP.toLocaleString()} XP</span>
                            </div>
                        </div>
                            
                        {/* Shimmer Progress Bar */}
                        <div className="relative h-2 w-full bg-black/20 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className="h-full bg-white transition-all duration-1000 ease-out relative"
                                style={{ width: `${levelData.progressPercent}%` }}
                            >
                                <div className="absolute inset-0 bg-white/50 w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>

                        {/* Total Days (SCALED UP & MIRRORED ICONS) */}
                        <div className="pt-1 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium drop-shadow-sm opacity-90">
                            <CalendarDaysIcon className="h-4 w-4" />
                            <span>Total Days: <span className="font-mono font-bold text-white ml-1">{stats.totalDays.toLocaleString()}</span></span>
                            <CalendarDaysIcon className="h-4 w-4" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
""",

    "src/components/admin/UserDirectory.tsx": r"""import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, doc, updateDoc, orderBy, type Firestore } from 'firebase/firestore';
import type { UserProfile } from '../../lib/db';
import { 
    StarIcon, 
    CheckCircleIcon, 
    UserIcon,
    ArrowPathIcon,
    ClockIcon,
    ShieldCheckIcon,
    UserMinusIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/solid';

export default function UserDirectory() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchUsers = async () => {
        if (!db) return;
        setLoading(true);
        const database: Firestore = db;
        try {
            const usersRef = collection(database, 'users');
            const q = query(usersRef, orderBy('lastLogin', 'desc'));
            const snapshot = await getDocs(q);
            const loadedUsers = snapshot.docs.map(d => d.data() as UserProfile);
            setUsers(loadedUsers);
        } catch (err: unknown) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUpdateRole = async (uid: string, newRole: 'admin' | 'user') => {
        if (!db) return;
        const confirmMsg = newRole === 'admin' 
            ? "CRITICAL: Promote this user to Admin? They will have full access to system metadata." 
            : "Demote this user? They will lose all administrative dashboard access.";
        
        if (!window.confirm(confirmMsg)) return;

        setActionLoading(uid);
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, { role: newRole });
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
        } catch (err: unknown) {
            console.error("Failed to update role", err);
            alert("Role update failed.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleGrantVIP = async (uid: string) => {
        if (!db) return;
        setActionLoading(uid);
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, { tier: 'premium', tierSource: 'manual' });
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, tier: 'premium', tierSource: 'manual' } : u));
        } catch (err: unknown) {
            console.error("Failed to grant VIP", err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRevokeVIP = async (uid: string) => {
        if (!db) return;
        if (!window.confirm("Revoke VIP access?")) return;
        setActionLoading(uid);
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, { tier: 'free', tierSource: null });
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, tier: 'free', tierSource: undefined } : u));
        } catch (err: unknown) {
            console.error("Failed to revoke VIP", err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleExportCSV = () => {
        let csv = 'UID,Email,DisplayName,Role,Tier,Joined,LastActive\n';
        users.forEach(u => {
            const joined = u.createdAt?.toDate ? u.createdAt.toDate().toISOString() : '';
            const active = u.lastLogin?.toDate ? u.lastLogin.toDate().toISOString() : '';
            csv += `${u.uid},${u.email || ''},${u.displayName || ''},${u.role || 'user'},${u.tier || 'free'},${joined},${active}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'mrt_users.csv'; a.click();
    };

    const renderTierBadge = (user: UserProfile) => {
        if (user.tier === 'premium') {
            if (user.tierSource === 'manual') {
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        <StarIcon className="h-3 w-3" /> VIP
                    </span>
                );
            }
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    <CheckCircleIcon className="h-3 w-3" /> Supporter
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                <UserIcon className="h-3 w-3 text-gray-400" /> Free
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading user directory...</p>
            </div>
        );
    }

    // Calculate Analytics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const newSignups = users.filter(u => u.createdAt?.toDate && u.createdAt.toDate() > thirtyDaysAgo).length;
    const dau = users.filter(u => u.lastLogin?.toDate && u.lastLogin.toDate() > oneDayAgo).length;

    return (
        <div className="space-y-6">
            
            {/* USER ANALYTICS HERO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
                    <span className="text-2xl font-black text-blue-600">{users.length}</span>
                    <span className="text-xs font-bold text-gray-500 uppercase">Total Users</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
                    <span className="text-2xl font-black text-emerald-600">{dau}</span>
                    <span className="text-xs font-bold text-gray-500 uppercase">Daily Active (24h)</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
                    <span className="text-2xl font-black text-purple-600">{newSignups}</span>
                    <span className="text-xs font-bold text-gray-500 uppercase">New (30 Days)</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">User Directory</h2>
                        <p className="text-sm text-gray-500">Manage account access, roles, and monetization.</p>
                    </div>
                    <button onClick={handleExportCSV} className="flex items-center gap-2 text-sm font-bold bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 shadow-sm active:scale-95 transition-all">
                        <ArrowDownTrayIcon className="h-4 w-4" /> Export CSV
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((u) => (
                                <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900">{u.displayName || 'Anonymous'}</span>
                                                {u.role === 'admin' && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase border border-blue-200">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-500">{u.email || u.uid.slice(0, 8)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                            <ClockIcon className="h-4 w-4 text-gray-400" />
                                            {u.lastLogin?.toDate ? u.lastLogin.toDate().toLocaleDateString() : 'Never'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {renderTierBadge(u)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {actionLoading === u.uid ? (
                                            <ArrowPathIcon className="h-5 w-5 text-gray-400 animate-spin ml-auto" />
                                        ) : (
                                            <div className="flex justify-end gap-3">
                                                {/* Tier Management Actions */}
                                                {u.tier === 'premium' && u.tierSource === 'manual' ? (
                                                    <button 
                                                        onClick={() => handleRevokeVIP(u.uid)} 
                                                        className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md text-xs font-bold transition-colors"
                                                    >
                                                        Revoke VIP
                                                    </button>
                                                ) : u.tier !== 'premium' ? (
                                                    <button 
                                                        onClick={() => handleGrantVIP(u.uid)} 
                                                        className="text-purple-700 hover:text-purple-900 bg-purple-50 px-3 py-1 rounded-md text-xs font-bold transition-colors"
                                                    >
                                                        Grant VIP
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400 italic py-1">Stripe-Managed</span>
                                                )}

                                                {/* Unified Role Management Icons */}
                                                {u.role === 'admin' ? (
                                                    <button 
                                                        onClick={() => handleUpdateRole(u.uid, 'user')} 
                                                        className="text-gray-400 hover:text-red-600 transition-colors" 
                                                        title="Demote to User"
                                                    >
                                                        <UserMinusIcon className="h-5 w-5" />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleUpdateRole(u.uid, 'admin')} 
                                                        className="text-gray-400 hover:text-blue-600 transition-colors" 
                                                        title="Promote to Admin"
                                                    >
                                                        <ShieldCheckIcon className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
""",

    "src/pages/PremiumUpgrade.tsx": r"""import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import VibrantHeader from '../components/VibrantHeader';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
    SparklesIcon, 
    CheckCircleIcon, 
    ShieldCheckIcon,
    DocumentChartBarIcon,
    UserGroupIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function PremiumUpgrade() {
    const { user, userTier } = useAuth();
    const navigate = useNavigate();
    
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [isManaging, setIsManaging] = useState(false);

    const handleSubscribe = async () => {
        if (!user || !db) return;
        setIsSubscribing(true);
        try {
            const priceId = import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID;
            if (!priceId) {
                throw new Error("Missing VITE_STRIPE_PREMIUM_PRICE_ID. Check GitHub Secrets.");
            }

            const sessionsRef = collection(db, 'users', user.uid, 'checkout_sessions');
            const docRef = await addDoc(sessionsRef, {
                price: priceId,
                success_url: window.location.origin + '/dashboard',
                cancel_url: window.location.origin + '/premium',
            });

            let isResolved = false;
            const timeoutId = setTimeout(() => {
                if (!isResolved) {
                    unsubscribe();
                    setIsSubscribing(false);
                    alert("Checkout session timeout. Please try again.");
                }
            }, 10000);

            const unsubscribe = onSnapshot(docRef, (snap) => {
                const data = snap.data();
                if (data?.error) {
                    isResolved = true;
                    unsubscribe();
                    clearTimeout(timeoutId);
                    setIsSubscribing(false);
                    alert(`Stripe Error: ${data.error.message}`);
                }
                if (data?.url) {
                    isResolved = true;
                    unsubscribe();
                    clearTimeout(timeoutId);
                    window.location.assign(data.url);
                }
            });

        } catch (err: unknown) {
            setIsSubscribing(false);
            alert(`Failed to initialize checkout: ${(err as Error).message}`);
        }
    };

    const handleManageSubscription = async () => {
        setIsManaging(true);
        try {
            const functions = getFunctions(undefined, 'northamerica-northeast1');
            const createPortalLink = httpsCallable(functions, 'ext-firestore-stripe-payments-createPortalLink');
            
            const { data } = await createPortalLink({
                returnUrl: window.location.origin + '/profile'
            });

            const responseData = data as { url?: string };
            if (responseData?.url) {
                window.location.assign(responseData.url);
            } else {
                throw new Error("No portal URL returned.");
            }
        } catch (err: unknown) {
            setIsManaging(false);
            console.error("Portal Error Detail:", err);
            alert("Billing Portal Error: If you haven't subscribed yet, please use 'Become a Supporter' first to create your Stripe customer record.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pb-24 font-sans">
            <div className="flex-shrink-0 z-10">
                <VibrantHeader 
                    title="Supporter Tier" 
                    subtitle="Deepen your recovery. Support our mission." 
                    icon={SparklesIcon}
                    fromColor="from-amber-500"
                    viaColor="via-orange-500"
                    toColor="to-rose-500"
                    backLink="/profile"
                />
            </div>

            <div className="flex-1 max-w-4xl mx-auto px-4 -mt-8 relative z-20 w-full animate-fadeIn">
                {userTier === 'premium' && (
                    <div className="bg-green-600 text-white p-4 rounded-xl shadow-lg mb-6 flex items-center justify-center gap-2">
                        <CheckCircleIcon className="h-6 w-6" />
                        <span className="font-bold">You are an active Supporter. Thank you!</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col">
                        <div className="mb-6">
                            <span className="text-gray-500 font-bold tracking-widest uppercase text-xs">Standard</span>
                            <h3 className="text-3xl font-black text-gray-900 mt-1">Free Forever</h3>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-700">
                            <li className="flex items-start gap-3"><CheckCircleIcon className="h-5 w-5 text-gray-400 shrink-0" /><span>Zero-Knowledge Journaling</span></li>
                            <li className="flex items-start gap-3"><CheckCircleIcon className="h-5 w-5 text-gray-400 shrink-0" /><span>Task & Habit Tracking</span></li>
                            <li className="flex items-start gap-3"><CheckCircleIcon className="h-5 w-5 text-gray-400 shrink-0" /><span>Somatic Engine</span></li>
                        </ul>
                        <button onClick={() => navigate('/dashboard')} className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                            Return to Dashboard
                        </button>
                    </div>

                    <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700 flex flex-col relative overflow-hidden transform md:-translate-y-4">
                        <div className="relative z-10 mb-6">
                            <span className="text-amber-400 font-bold tracking-widest uppercase text-xs">Supporter</span>
                            <h3 className="text-3xl font-black text-white mt-1">$3.99 <span className="text-lg text-slate-400 font-medium">/mo</span></h3>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1 relative z-10 text-sm text-slate-200">
                            <li className="flex items-start gap-3"><SparklesIcon className="h-5 w-5 text-amber-500 shrink-0" /><span><strong>Unlimited AI Deep Dives</strong></span></li>
                            <li className="flex items-start gap-3"><DocumentChartBarIcon className="h-5 w-5 text-amber-500 shrink-0" /><span><strong>PDF Report Generation</strong></span></li>
                            <li className="flex items-start gap-3"><UserGroupIcon className="h-5 w-5 text-amber-500 shrink-0" /><span><strong>Service Network Access</strong></span></li>
                            <li className="flex items-start gap-3"><ShieldCheckIcon className="h-5 w-5 text-amber-500 shrink-0" /><span><strong>Keep MRT Free for Others</strong></span></li>
                        </ul>
                        
                        {userTier === 'premium' ? (
                            <button 
                                onClick={handleManageSubscription}
                                disabled={isManaging}
                                className="w-full py-4 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isManaging ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : 'Manage Subscription'}
                            </button>
                        ) : (
                            <button 
                                onClick={handleSubscribe}
                                disabled={isSubscribing}
                                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-75"
                            >
                                {isSubscribing ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : 'Become a Supporter'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
""",

    "src/components/journal/JournalEditor.tsx": r"""import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../contexts/EncryptionContext';
import { useJournalOperations } from '../../hooks/useJournalOperations';
import { db } from '../../lib/firebase';
import { collection, Timestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { 
    CheckIcon,
    Cog6ToothIcon,
    MapPinIcon,
    ArrowPathIcon,
    TagIcon,
    XMarkIcon,
    MicrophoneIcon,
    FaceSmileIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';
import { getUserTemplates, type JournalTemplate } from '../../lib/db';
import { DEFAULT_TEMPLATES } from '../../data/journalTemplates';
import { getCurrentWeather } from '../../lib/weather';
import { useNavigate } from 'react-router-dom';
import AudioRecorder from './AudioRecorder';
import type { AudioAnalysisResult } from '../../lib/gemini';

interface JournalDocData {
    tags?: string[];
    [key: string]: unknown;
}

export interface JournalEntry {
  id: string;
  content: string;
  moodScore: number;
  sentiment?: string;
  createdAt: Timestamp; 
  tags?: string[];
  weather?: { temp: number; condition: string } | null;
  isEncrypted?: boolean; 
}

interface ExtendedJournalTemplate extends JournalTemplate {
    content?: string;
}

interface JournalEditorProps {
  initialEntry: JournalEntry | null;
  initialTemplateId?: string | null;
  onSaveComplete: () => void;
}

export default function JournalEditor({ initialEntry, initialTemplateId, onSaveComplete }: JournalEditorProps) {
  const { user, userTier } = useAuth();
  const { encrypt } = useEncryption();
  const { addJournal, updateJournal } = useJournalOperations();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getSmartMood = () => {
      if (initialEntry) return initialEntry.moodScore;
      const cache = queryClient.getQueryData<JournalEntry[]>(['journals']);
      if (!cache || cache.length === 0) return 5;

      const recent = cache
        .filter((e: JournalEntry) => typeof e.moodScore === 'number' && e.moodScore > 0)
        .slice(0, 7);
      
      if (recent.length === 0) return 5;
      const sum = recent.reduce((acc: number, curr: JournalEntry) => acc + curr.moodScore, 0);
      return Math.round(sum / recent.length);
  };

  const [newEntry, setNewEntry] = useState('');
  const [mood, setMood] = useState(getSmartMood); 
  const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);
  
  const [saving, setSaving] = useState(false); 
  const [weatherLoading, setWeatherLoading] = useState(false);
  
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [customTemplates, setCustomTemplates] = useState<JournalTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<JournalTemplate | null>(null);
  const [formAnswers, setFormAnswers] = useState<string[]>([]);
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const fetchLocalWeather = useCallback(async () => {
    setWeatherLoading(true);
    try {
      const data = await getCurrentWeather();
      if (data) {
        setWeather({ temp: Math.round(data.temp), condition: data.condition });
      }
    } catch (e) {
      console.warn("Failed to auto-load weather", e);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const loadCustomTemplates = useCallback(async () => {
    if (!user) return;
    try {
        const t = await getUserTemplates(user.uid);
        setCustomTemplates(t);
    } catch (e) {
        console.error("Failed to load templates", e);
    }
  }, [user]);

  const loadUserTags = useCallback(async () => {
    if (!user || !db) return;
    try {
        const q = query(collection(db, 'journals'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        const tagSet = new Set<string>();
        snapshot.docs.forEach(doc => {
            const data = doc.data() as JournalDocData; 
            if (data.tags && Array.isArray(data.tags)) {
                data.tags.forEach((t: string) => tagSet.add(t));
            }
        });
        setAvailableTags(Array.from(tagSet).sort());
    } catch (e) {
        console.warn("Failed to load user tags", e);
    }
  }, [user]);

  const handleTemplateSelect = useCallback((tId: string) => {
    const defTemplate = DEFAULT_TEMPLATES.find(t => t.id === tId);
    if (defTemplate) {
        setNewEntry(defTemplate.content); 
        setTags(prev => [...new Set([...prev, ...defTemplate.tags])]);
        setActiveTemplate(null);
        return;
    }

    const custTemplate = customTemplates.find(t => t.id === tId) as ExtendedJournalTemplate | undefined;
    if (custTemplate) {
        if (custTemplate.content) {
            setNewEntry(custTemplate.content);
            setTags(prev => [...new Set([...prev, ...(custTemplate.defaultTags || [])])]);
            setActiveTemplate(null); 
        } 
        else if (custTemplate.prompts) {
            setActiveTemplate(custTemplate);
            setFormAnswers(new Array(custTemplate.prompts.length).fill(''));
            setNewEntry('');
            setTags(prev => [...new Set([...prev, ...(custTemplate.defaultTags || [])])]);
        }
    } else {
        setActiveTemplate(null);
        setNewEntry('');
        setTags([]);
    }
  }, [customTemplates]); 

  useEffect(() => {
    if (!user) return;
    loadCustomTemplates();
    loadUserTags();
    if (!initialEntry) fetchLocalWeather(); 
  }, [user, initialEntry, loadCustomTemplates, loadUserTags, fetchLocalWeather]);

  useEffect(() => {
    if (initialEntry) {
      setNewEntry(initialEntry.content);
      setMood(initialEntry.moodScore);
      setTags(initialEntry.tags || []);
      if (initialEntry.weather) setWeather(initialEntry.weather);
      setActiveTemplate(null);
    } else {
      setNewEntry('');
      setTags([]);
      setActiveTemplate(null);
      setFormAnswers([]);
      setWeather(null);
      fetchLocalWeather(); 
      if (initialTemplateId) handleTemplateSelect(initialTemplateId);
    }
  }, [initialEntry, initialTemplateId, handleTemplateSelect, fetchLocalWeather]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
        setTags(prev => prev.slice(0, -1));
    }
  };

  const addTag = (tagName: string) => {
    const cleanTag = tagName.trim().replace(/^#/, '');
    if (cleanTag && !tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
    }
    setTagInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => setTags(tags.filter(t => t !== tagToRemove));

  const filteredSuggestions = availableTags.filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t));

  const handleAudioComplete = (result: AudioAnalysisResult) => {
      setNewEntry(prev => (prev ? prev + "\n\n" + result.transcription : result.transcription));
      setMood(result.mood_score);
      setTags(prev => [...new Set([...prev, ...result.tags, "Voice Note"])]);
      setIsVoiceMode(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    const isFormValid = activeTemplate && formAnswers.some(a => a.trim() !== '');
    const isTextValid = !activeTemplate && newEntry.trim() !== '';
    if (!isFormValid && !isTextValid) return;

    setSaving(true);
    let plainContent = newEntry;
    if (activeTemplate) {
        plainContent = `**${activeTemplate.name}**\n\n`;
        activeTemplate.prompts.forEach((prompt, idx) => {
            plainContent += `**${prompt}**\n${formAnswers[idx] || '-(Skipped)-'}\n\n`;
        });
    }

    try {
      let contentToSave = plainContent;
      let isEncrypted = false;
      try {
        contentToSave = await encrypt(plainContent);
        isEncrypted = true;
      } catch (err) {
        console.error("Encryption failed", err);
        alert("Security Error: Could not encrypt. Save aborted.");
        setSaving(false);
        return;
      }

      if (initialEntry) {
        await updateJournal({ id: initialEntry.id, content: contentToSave, moodScore: mood, tags: tags, isEncrypted: isEncrypted });
      } else {
        await addJournal({ content: contentToSave, moodScore: mood, sentiment: 'Pending', weather: weather, tags: tags, isEncrypted: isEncrypted });
      }

      setNewEntry('');
      setFormAnswers([]);
      setActiveTemplate(null);
      setMood(getSmartMood());
      setTags([]);
      onSaveComplete();
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-180px)] md:h-[600px] relative">
        <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center gap-3 shrink-0">
             <div>
                 {weather ? (
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                      <span>{weather.condition}</span>
                      <span className="font-bold">{weather.temp}°C</span>
                      {!initialEntry && (
                          <button type="button" onClick={fetchLocalWeather} disabled={weatherLoading} className="ml-1 text-blue-400 hover:text-blue-600">
                              <ArrowPathIcon className={`h-3 w-3 ${weatherLoading ? 'animate-spin' : ''}`} />
                          </button>
                      )}
                    </div>
                ) : (
                    !initialEntry && (
                        <button type="button" onClick={fetchLocalWeather} disabled={weatherLoading} className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 bg-white hover:bg-blue-50 px-2 py-1.5 rounded-lg border border-gray-200 transition-colors shadow-sm">
                            {weatherLoading ? <ArrowPathIcon className="h-3 w-3 animate-spin" /> : <MapPinIcon className="h-3 w-3" />}
                            <span>Add Weather</span>
                        </button>
                    )
                )}
             </div>

             <div className="flex items-center gap-2">
                 <div className="relative">
                     <select 
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                        className="pl-3 pr-8 py-1.5 text-xs sm:text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white w-48 text-ellipsis overflow-hidden"
                        defaultValue=""
                        disabled={!!initialEntry} 
                    >
                        <option value="" disabled>Choose Template...</option>
                        <option value="none">Free Write</option>
                        <optgroup label="Standard">
                            {DEFAULT_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </optgroup>
                        {customTemplates.length > 0 && (
                            <optgroup label="My Templates">
                                {customTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </optgroup>
                        )}
                    </select>
                 </div>

                 <button 
                    onClick={() => userTier === 'premium' ? navigate('/templates') : navigate('/premium')}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition"
                    title={userTier === 'premium' ? "Manage Templates" : "Premium Feature: Custom Templates"}
                 >
                    {userTier === 'premium' ? <Cog6ToothIcon className="h-5 w-5" /> : <LockClosedIcon className="h-5 w-5 text-amber-500" />}
                 </button>
             </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
            {isVoiceMode ? (
                <div className="h-full flex items-center justify-center">
                    <AudioRecorder onAnalysisComplete={handleAudioComplete} onCancel={() => setIsVoiceMode(false)} />
                </div>
            ) : activeTemplate ? (
                <div className="space-y-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100 min-h-full">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-blue-900">{activeTemplate.name}</h3>
                        <button type="button" onClick={() => setActiveTemplate(null)} className="text-xs text-blue-500 hover:text-blue-700 underline">Switch to Text Mode</button>
                    </div>
                    {activeTemplate.prompts.map((prompt, idx) => (
                        <div key={idx}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{prompt}</label>
                            <textarea
                                rows={3} 
                                value={formAnswers[idx] || ''}
                                onChange={(e) => {
                                    const newAns = [...formAnswers];
                                    newAns[idx] = e.target.value;
                                    setFormAnswers(newAns);
                                }}
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                placeholder="Type your answer..."
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <textarea
                    ref={textareaRef}
                    value={newEntry}
                    onChange={(e) => setNewEntry(e.target.value)}
                    placeholder="How are you feeling today?"
                    className="w-full h-full p-2 rounded-xl border-none focus:ring-0 shadow-none resize-none text-gray-700 leading-relaxed font-mono text-base placeholder:text-gray-300"
                />
            )}
        </div>

        <div className="border-t border-gray-200 bg-gray-50/95 backdrop-blur-sm p-3 shrink-0 flex flex-col gap-3">
            <div className="flex items-center gap-3 px-2">
                <FaceSmileIcon className={`h-5 w-5 ${mood >= 7 ? 'text-green-600' : mood <= 4 ? 'text-red-500' : 'text-yellow-600'}`} />
                <input 
                    type="range" min="1" max="10" value={mood}
                    onChange={(e) => setMood(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className={`text-xs font-bold w-6 text-center ${mood >= 7 ? 'text-green-700' : mood <= 4 ? 'text-red-700' : 'text-yellow-700'}`}>
                    {mood}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0 group">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                        <TagIcon className="h-4 w-4 text-gray-400 shrink-0" />
                        <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar items-center">
                            {tags.map(tag => (
                                <span key={tag} className="flex-shrink-0 flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-full border border-blue-100 whitespace-nowrap">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900"><XMarkIcon className="h-3 w-3" /></button>
                                </span>
                            ))}
                            <input 
                                type="text" value={tagInput}
                                onChange={(e) => { setTagInput(e.target.value); setShowSuggestions(true); }}
                                onKeyDown={handleAddTag}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                placeholder={tags.length === 0 ? "Add tags..." : ""}
                                className="min-w-[60px] text-xs border-none focus:ring-0 p-0 text-gray-700 placeholder:text-gray-400 bg-transparent"
                            />
                        </div>
                    </div>
                    {showSuggestions && tagInput && filteredSuggestions.length > 0 && (
                        <div className="absolute bottom-full left-0 mb-2 w-full max-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 max-h-32 overflow-y-auto z-50">
                            {filteredSuggestions.map(tag => (
                                <button key={tag} type="button" className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors" onClick={() => addTag(tag)}>{tag}</button>
                            ))}
                        </div>
                    )}
                </div>

                <button type="button" onClick={() => setIsVoiceMode(true)} className="p-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors flex-shrink-0" title="Voice Note">
                    <MicrophoneIcon className="h-5 w-5" />
                </button>

                <button onClick={handleSave} disabled={saving} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50 flex-shrink-0 flex items-center gap-1">
                    {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}
                    <span className="hidden sm:inline">{initialEntry ? 'Update' : 'Save'}</span>
                </button>
            </div>
        </div>
    </div>
  );
}
""",

    "src/pages/TemplateEditor.tsx": r"""import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, getDocs, Timestamp } from 'firebase/firestore';
import { 
    ArrowLeftIcon, 
    PlusIcon, 
    TrashIcon, 
    PencilSquareIcon,
    XMarkIcon,
    ListBulletIcon,
    HashtagIcon, 
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import PremiumGate from '../components/PremiumGate';

interface JournalTemplate {
    id: string;
    uid: string;
    name: string;
    content?: string; 
    prompts?: string[]; 
    defaultTags: string[];
    createdAt: Timestamp;
}

export default function TemplateEditor() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [templates, setTemplates] = useState<JournalTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [saving, setSaving] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const loadTemplates = useCallback(async () => {
        if (!user || !db) return;
        setLoading(true);
        try {
            const q = query(collection(db, 'users', user.uid, 'templates'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JournalTemplate));
            setTemplates(data);
        } catch (error) {
            console.error("Failed to load templates", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        loadTemplates();
    }, [user, loadTemplates]); 

    const insertText = (before: string, after: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const previousText = textarea.value;
        const selection = previousText.substring(start, end);
        
        const newText = previousText.substring(0, start) + 
                        before + selection + after + 
                        previousText.substring(end);
        
        setContent(newText);
        
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + before.length + selection.length + after.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const clean = tagInput.trim().replace(/^#/, '');
            if (clean && !tags.includes(clean)) {
                setTags([...tags, clean]);
                setTagInput('');
            }
        }
    };

    const removeTag = (t: string) => setTags(tags.filter(tag => tag !== t));

    const handleEdit = (t: JournalTemplate) => {
        setEditId(t.id);
        setName(t.name);
        const textContent = t.content || (t.prompts ? t.prompts.map(p => `**${p}**\n\n`).join('') : '');
        setContent(textContent);
        setTags(t.defaultTags || []);
        setIsEditing(true);
    };

    const handleCreate = () => {
        setEditId('');
        setName('');
        setContent('');
        setTags([]);
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this template?")) return;
        if (!user || !db) return;
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'templates', id));
            setTemplates(templates.filter(t => t.id !== id));
        } catch (e) {
            console.error("Error deleting", e);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !db) return;

        const cleanTags = tags.map(t => t.trim()).filter(t => t !== '').map(t => t.startsWith('#') ? t : `#${t}`);

        if (!name || content.trim() === '') {
            alert("Please provide a name and template content.");
            return;
        }

        setSaving(true);
        const templateData = {
            uid: user.uid,
            name,
            content, 
            defaultTags: cleanTags,
            updatedAt: Timestamp.now()
        };

        try {
            if (editId) {
                await updateDoc(doc(db, 'users', user.uid, 'templates', editId), templateData);
                setTemplates(prev => prev.map(t => t.id === editId ? { ...t, ...templateData } as JournalTemplate : t));
            } else {
                const docRef = await addDoc(collection(db, 'users', user.uid, 'templates'), {
                    ...templateData,
                    createdAt: Timestamp.now()
                });
                setTemplates([...templates, { 
                    id: docRef.id, 
                    ...templateData, 
                    createdAt: Timestamp.now() 
                } as JournalTemplate]);
            }
            setIsEditing(false);
            resetForm();
        } catch (error) {
            console.error("Error saving template", error);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setEditId(null);
        setName('');
        setContent('');
        setTags([]);
    };

    if (loading) return <div className="p-8">Loading templates...</div>;

    if (isEditing) {
        return (
            <div className="max-w-4xl mx-auto p-4 space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/journal')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {editId ? 'Edit Template' : 'New Free-Text Template'}
                    </h1>
                </div>

                <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Daily Gratitude List"
                            className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 p-2"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">Template Structure</label>
                            <span className="text-xs text-gray-400">Markdown Supported</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <button type="button" onClick={() => insertText('### ')} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600" title="Heading"><HashtagIcon className="h-4 w-4" /></button>
                            <button type="button" onClick={() => insertText('**', '**')} className="px-2 py-1 text-sm font-bold hover:bg-white hover:shadow-sm rounded text-gray-600" title="Bold">B</button>
                            <div className="w-px h-4 bg-gray-300 mx-1"></div>
                            <button type="button" onClick={() => insertText('- [ ] ')} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600" title="Checkbox"><CheckCircleIcon className="h-4 w-4" /></button>
                            <button type="button" onClick={() => insertText('1. ')} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600" title="Ordered List"><ListBulletIcon className="h-4 w-4" /></button>
                        </div>

                        <textarea 
                            ref={textareaRef}
                            rows={12}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Design your template here using Markdown...&#10;- [ ] Checklist item&#10;**Bold text**"
                            className="w-full font-mono text-sm rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 leading-relaxed p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Auto-Tags</label>
                        <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                            {tags.map(tag => (
                                <span key={tag} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full border border-blue-100">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900"><XMarkIcon className="h-3 w-3" /></button>
                                </span>
                            ))}
                            <input 
                                type="text" 
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                placeholder={tags.length === 0 ? "Add tags (press Enter)..." : ""}
                                className="flex-1 min-w-[150px] text-sm border-none focus:ring-0 p-0 text-gray-700"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => { setIsEditing(false); resetForm(); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
                        <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save Template'}</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <PremiumGate fallbackMode="lock_overlay" customMessage="Custom templates are a Supporter Tier feature. Upgrade to customize your journal experience.">
            <div className="max-w-3xl mx-auto space-y-6 p-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/journal')} className="text-gray-500 hover:text-gray-900 lg:hidden">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Templates</h1>
                  </div>
                  <button onClick={handleCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                     <PlusIcon className="h-5 w-5" /> Create New
                  </button>
               </div>

               <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                  {templates.length === 0 ? (
                     <div className="p-8 text-center text-gray-500">You haven't created any custom templates yet.</div>
                  ) : (
                     <ul className="divide-y divide-gray-100">
                        {templates.map((t) => (
                           <li key={t.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition">
                              <div>
                                 <h3 className="font-semibold text-gray-900">{t.name}</h3>
                                 <p className="text-sm text-gray-500 mt-1">{t.defaultTags.length > 0 ? t.defaultTags.join(', ') : 'No default tags'}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                 <button onClick={() => handleEdit(t)} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition" title="Edit">
                                    <PencilSquareIcon className="h-5 w-5" />
                                 </button>
                                 <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition" title="Delete">
                                    <TrashIcon className="h-5 w-5" />
                                 </button>
                              </div>
                           </li>
                        ))}
                     </ul>
                  )}
               </div>
            </div>
        </PremiumGate>
    );
}
""",

    "src/components/profile/DataManagement.tsx": r"""import React, { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../contexts/EncryptionContext';
import { db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc, type Firestore } from 'firebase/firestore';
import { fetchAllUserData } from '../../lib/db';
import { prepareDataForExport, generateJSON, generatePDF } from '../../lib/exporter';
import { importLegacyJournals } from '../../lib/importer';
import { executeTotalAccountAnnihilation } from '../../lib/deletion';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import PremiumGate from '../PremiumGate';
import VaultGate from '../VaultGate';
import { 
    ArrowDownTrayIcon, 
    ArrowUpTrayIcon, 
    DocumentTextIcon, 
    CodeBracketSquareIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    CloudArrowUpIcon,
    TrashIcon,
    ArrowPathIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

export default function DataManagement() {
    const { user, driveAccessToken, reauthenticateWithEmail, reauthenticateWithGoogle, deleteAccount } = useAuth();
    const { isVaultUnlocked } = useEncryption();
    const navigate = useNavigate();
    
    const [exporting, setExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [exportError, setExportError] = useState<string | null>(null);
    const [lastExportStr, setLastExportStr] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const [importStatus, setImportStatus] = useState<string | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteStep, setDeleteStep] = useState<'confirm' | 'reauth' | 'shredding'>('confirm');
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteProgressMsg, setDeleteProgressMsg] = useState('');
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const isGoogleUser = user?.providerData.some(p => p.providerId === 'google.com');

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

    const handleInitiateDelete = () => {
        setDeleteStep('confirm');
        setDeleteError(null);
        setDeletePassword('');
        setIsDeleteModalOpen(true);
    };

    const handleReAuthAndDelete = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user) return;
        
        setDeleteError(null);
        setDeleteStep('shredding');
        setDeleteProgressMsg('Verifying secure session...');

        try {
            if (isGoogleUser) {
                await reauthenticateWithGoogle();
            } else {
                if (!deletePassword) {
                    setDeleteError("Password is required.");
                    setDeleteStep('reauth');
                    return;
                }
                await reauthenticateWithEmail(deletePassword);
            }

            setDeleteProgressMsg('Locating and destroying all database records...');
            await executeTotalAccountAnnihilation(user.uid, (msg) => setDeleteProgressMsg(msg));

            setDeleteProgressMsg('Removing authentication profile...');
            await deleteAccount();

            setIsDeleteModalOpen(false);
            navigate('/login');
        } catch (err: unknown) {
            const error = err as { code?: string; message?: string };
            console.error("Deletion failed", error);
            
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                setDeleteError('Incorrect password. Please try again.');
            } else if (error.code === 'auth/requires-recent-login') {
                setDeleteError('Session expired. Please close this modal, log out, and log back in to try again.');
            } else if (error.code === 'auth/popup-closed-by-user') {
                setDeleteError('Google verification cancelled.');
            } else {
                setDeleteError(error.message || 'An error occurred during deletion.');
            }
            setDeleteStep('reauth');
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

                <VaultGate>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                            onClick={() => handleExport('json')}
                            disabled={exporting}
                            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group w-full"
                        >
                            <CodeBracketSquareIcon className="h-8 w-8 text-gray-400 group-hover:text-blue-600 mb-2" />
                            <span className="font-bold text-gray-700 group-hover:text-blue-700">JSON Backup</span>
                            <span className="text-xs text-gray-400">Machine-readable format</span>
                        </button>

                        <PremiumGate fallbackMode="button_swap" customMessage="Unlock PDF Exports">
                            <button 
                                onClick={() => handleExport('pdf')}
                                disabled={exporting}
                                className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all group w-full"
                            >
                                <DocumentTextIcon className="h-8 w-8 text-gray-400 group-hover:text-red-600 mb-2" />
                                <span className="font-bold text-gray-700 group-hover:text-red-700">PDF Document</span>
                                <span className="text-xs text-gray-400">Readable format</span>
                            </button>
                        </PremiumGate>
                    </div>
                </VaultGate>

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

            {/* DANGER ZONE: ACCOUNT DELETION */}
            <div className="bg-red-50 p-6 rounded-xl border border-red-200 mt-8">
                <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                    <TrashIcon className="h-5 w-5" /> Danger Zone: Delete Account
                </h3>
                <p className="text-sm text-red-800 mb-4 leading-relaxed">
                    This action is permanent and cannot be undone. We will execute a cryptographic shredding of all your journals, workbooks, tasks, AI logs, and metadata before deleting your authentication profile. <strong>You will lose everything.</strong>
                </p>
                <button
                    onClick={handleInitiateDelete}
                    className="w-full sm:w-auto px-6 py-3 bg-white text-red-600 border-2 border-red-200 font-bold rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95"
                >
                    Request Account Deletion
                </button>
            </div>

            {/* ACCOUNT DELETION MODAL */}
            <Transition appear show={isDeleteModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => deleteStep === 'shredding' ? null : setIsDeleteModalOpen(false)}>
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
                                    
                                    {deleteStep !== 'shredding' && (
                                        <button 
                                            onClick={() => setIsDeleteModalOpen(false)}
                                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                                        >
                                            <XMarkIcon className="h-6 w-6" />
                                        </button>
                                    )}

                                    <div className="flex items-center gap-3 text-red-600 mb-4">
                                        <ExclamationTriangleIcon className="h-8 w-8" />
                                        <Dialog.Title as="h3" className="text-xl font-bold">
                                            Permanent Deletion
                                        </Dialog.Title>
                                    </div>

                                    {deleteError && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg">
                                            {deleteError}
                                        </div>
                                    )}

                                    {deleteStep === 'confirm' && (
                                        <div className="animate-fadeIn">
                                            <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                                Are you absolutely sure? This will wipe your account, journals, insights, and all settings from our servers instantly. There is no recovery.
                                            </p>
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={() => setIsDeleteModalOpen(false)}
                                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={() => setDeleteStep('reauth')}
                                                    className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
                                                >
                                                    Yes, Proceed
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {deleteStep === 'reauth' && (
                                        <div className="animate-fadeIn">
                                            <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                                To prevent unauthorized deletion, please verify your identity to proceed with the data wipe.
                                            </p>
                                            
                                            {isGoogleUser ? (
                                                <button
                                                    onClick={() => handleReAuthAndDelete()}
                                                    className="w-full flex items-center justify-center px-4 py-4 border border-gray-300 shadow-sm text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all"
                                                >
                                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5 mr-3" />
                                                    Re-verify with Google
                                                </button>
                                            ) : (
                                                <form onSubmit={handleReAuthAndDelete} className="space-y-4">
                                                    <input 
                                                        type="password" 
                                                        required
                                                        autoFocus
                                                        placeholder="Enter your account password" 
                                                        value={deletePassword}
                                                        onChange={(e) => setDeletePassword(e.target.value)}
                                                        className="w-full text-sm rounded-xl border-gray-300 focus:border-red-500 focus:ring-red-500 p-3"
                                                    />
                                                    <button 
                                                        type="submit"
                                                        disabled={!deletePassword}
                                                        className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                    >
                                                        Verify & Delete
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    )}

                                    {deleteStep === 'shredding' && (
                                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn">
                                            <ArrowPathIcon className="h-12 w-12 text-red-500 animate-spin" />
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-900 mb-2">Executing Annihilation Protocol</h4>
                                                <p className="text-sm font-mono text-gray-500 animate-pulse">{deleteProgressMsg}</p>
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

        </div>
    );
}
"""
}

def apply_fixes():
    # Ensure script is run from project root
    if not os.path.exists("package.json"):
        print("⚠️  Warning: Make sure you are running this from the project root directory.")
        
    for filepath, raw_content in FILES.items():
        content = raw_content.replace('__FENCE__', FENCE)
        
        # FIX: Check if a directory path actually exists before trying to create it
        dir_path = os.path.dirname(filepath)
        if dir_path:
            os.makedirs(dir_path, exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Surgically patched: {filepath}")

if __name__ == "__main__":
    print("🚀 Initiating Bulk Triage Patch...")
    apply_fixes()
    print("✨ All bugs and suggestions resolved. Proceed to testing.")