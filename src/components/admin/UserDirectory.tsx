import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, doc, updateDoc, orderBy, type Firestore } from 'firebase/firestore';
import type { UserProfile } from '../../lib/db';
import { StarIcon, CheckCircleIcon, UserIcon, ArrowPathIcon, ClockIcon, ShieldCheckIcon, UserMinusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';

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
        } catch (err: unknown) { console.error("Failed to update role", err); alert("Role update failed."); } finally {
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
