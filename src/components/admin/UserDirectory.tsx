/**
 * src/components/admin/UserDirectory.tsx
 * GITHUB COMMENT:
 * [UserDirectory.tsx]
 * NEW: Metadata-only User Management table.
 * FEATURES: List users, sort by Last Login, Toggle Admin Role.
 */
import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { 
    collection, 
    getDocs, 
    updateDoc, 
    doc, 
    type Firestore,
    Timestamp 
} from 'firebase/firestore';
import { 
    UserCircleIcon, 
   // ShieldCheckIcon,
    ClockIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface UserMeta {
    uid: string;
    email: string;
    displayName: string;
    role?: 'user' | 'admin';
    lastLogin?: Timestamp;
    createdAt?: Timestamp;
}

export default function UserDirectory() {
    const [users, setUsers] = useState<UserMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        if (!db) return;
        setLoading(true);
        try {
            const database: Firestore = db;
            const snap = await getDocs(collection(database, 'users'));
            const data = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserMeta));
            
            // Sort by Last Login Descending
            data.sort((a, b) => {
                const timeA = a.lastLogin?.toMillis() || 0;
                const timeB = b.lastLogin?.toMillis() || 0;
                return timeB - timeA;
            });

            setUsers(data);
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRole = async (uid: string, currentRole?: string) => {
        if (!db) return;
        if (!confirm(`Are you sure you want to change this user's role?`)) return;

        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            await updateDoc(doc(db, 'users', uid), { role: newRole });
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
        } catch (e) {
            console.error("Failed to update role", e);
            alert("Error updating role.");
        }
    };

    const filteredUsers = users.filter(u => 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-400">Loading directory...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center gap-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <UserCircleIcon className="h-5 w-5 text-indigo-600" />
                    User Directory ({users.length})
                </h3>
                <div className="relative">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Last Active</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map(user => (
                            <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{user.displayName || 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                    <div className="text-[10px] text-gray-400 font-mono mt-0.5 select-all">{user.uid}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                        user.role === 'admin' 
                                            ? 'bg-purple-100 text-purple-700 border-purple-200' 
                                            : 'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                        {user.role === 'admin' ? 'Admin' : 'User'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    <div className="flex items-center gap-1.5">
                                        <ClockIcon className="h-4 w-4 text-gray-400" />
                                        {user.lastLogin 
                                            ? new Date(user.lastLogin.toDate()).toLocaleDateString() 
                                            : 'Never'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => toggleRole(user.uid, user.role)}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                                    >
                                        {user.role === 'admin' ? 'Demote' : 'Promote'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}