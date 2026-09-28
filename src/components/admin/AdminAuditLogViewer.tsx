import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, limit, getDocs, type Firestore } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { AdminAuditLogEntry } from '../../lib/db';
import { ArrowPathIcon, ClipboardDocumentListIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

async function fetchAuditLog(): Promise<AdminAuditLogEntry[]> {
    if (!db) return [];
    const database: Firestore = db;
    const q = query(collection(database, 'admin_audit_log'), orderBy('timestamp', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminAuditLogEntry));
}

function OutcomeBadge({ outcome }: { outcome: AdminAuditLogEntry['outcome'] }) {
    if (outcome === 'success') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                <CheckCircleIcon className="h-3 w-3" /> Success
            </span>
        );
    }
    if (outcome === 'partial_failure') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                <ExclamationTriangleIcon className="h-3 w-3" /> Partial Failure
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            <XCircleIcon className="h-3 w-3" /> Failure
        </span>
    );
}

export default function AdminAuditLogViewer() {
    const { data: entries = [], isLoading, refetch, isFetching } = useQuery({
        queryKey: ['admin_audit_log'],
        queryFn: fetchAuditLog,
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <ClipboardDocumentListIcon className="h-5 w-5" /> Admin Audit Log
                    </h2>
                    <p className="text-sm text-gray-500">Record of admin-triggered user deletions.</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 text-sm font-bold bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 shadow-sm active:scale-95 transition-all"
                >
                    <ArrowPathIcon className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            {isLoading ? (
                <div className="p-8 text-center text-gray-400">Loading audit log...</div>
            ) : entries.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No admin deletion actions recorded yet.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">When</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scope</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outcome</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {entries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {entry.timestamp?.toDate ? entry.timestamp.toDate().toLocaleString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {entry.performedByEmail || entry.performedByUid.slice(0, 8)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {entry.targetEmail || entry.targetUid.slice(0, 8)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                        {[
                                            entry.scope?.purgedFirestoreData && 'Firestore data',
                                            entry.scope?.deletedAuthRecord && 'Auth record',
                                        ].filter(Boolean).join(' + ') || 'None'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <OutcomeBadge outcome={entry.outcome} />
                                        {entry.detail && (
                                            <p className="text-[11px] text-gray-400 mt-1 max-w-xs truncate" title={entry.detail}>{entry.detail}</p>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
