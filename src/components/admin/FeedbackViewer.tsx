import { useState } from 'react';
import { db } from '../../lib/firebase';
import { 
    collection, 
    query, 
    orderBy, 
    limit, 
    getDocs, 
    deleteDoc, 
    doc,
    Timestamp,
    type Firestore 
} from 'firebase/firestore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Virtuoso } from 'react-virtuoso';
import { 
    BugAntIcon, 
    LightBulbIcon, 
    DocumentTextIcon, 
    MapPinIcon,
    CpuChipIcon,
    LockClosedIcon,
    LockOpenIcon,
    ChatBubbleLeftRightIcon, 
    ArrowPathIcon, 
    CheckCircleIcon 
} from '@heroicons/react/24/outline';

interface FeedbackReport {
    id: string;
    uid: string;
    email?: string;
    category: 'bug' | 'suggestion' | 'content';
    message: string;
    buildHash: string;
    environment: string;
    route: string;
    vaultUnlocked: boolean;
    timestamp: Timestamp;
}

export default function FeedbackViewer() {
    const queryClient = useQueryClient();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const { data: reports = [], isLoading } = useQuery({
        queryKey: ['feedback_reports'],
        queryFn: async () => {
            if (!db) return [];
            const database: Firestore = db;
            const q = query(
                collection(database, 'feedback'),
                orderBy('timestamp', 'desc'),
                limit(100)
            );
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as FeedbackReport));
        }
    });

    const handleDelete = async (id: string) => {
        if (!db) return;
        if (!confirm("Mark this item as resolved (delete)?")) return;
        
        setLoadingId(id);
        try {
            await deleteDoc(doc(db, 'feedback', id));
            queryClient.invalidateQueries({ queryKey: ['feedback_reports'] });
        } catch (e) {
            console.error("Failed to delete", e);
        } finally {
            setLoadingId(null);
        }
    };

    const getIcon = (cat: string) => {
        switch(cat) {
            case 'bug': return <BugAntIcon className="h-5 w-5 text-red-500" />;
            case 'suggestion': return <LightBulbIcon className="h-5 w-5 text-yellow-500" />;
            default: return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-400">Loading inbox...</div>;

    if (reports.length === 0) {
        return (
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 text-center">
                <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-slate-900 font-bold">Inbox Zero</h3>
                <p className="text-slate-500 text-sm">No feedback reports found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 h-[600px] flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 shrink-0">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
                Feedback Inbox ({reports.length})
            </h3>

            <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <Virtuoso 
                    data={reports}
                    itemContent={(_index, item) => (
                        <div className="bg-white p-5 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-slate-50 border border-slate-100`}>
                                        {getIcon(item.category)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                {item.timestamp?.toDate().toLocaleString()}
                                            </span>
                                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                                                {item.email || 'Anonymous'}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-slate-900 mt-0.5 text-sm uppercase tracking-wide">{item.category}</h4>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDelete(item.id)}
                                    disabled={loadingId === item.id}
                                    className="text-slate-300 hover:text-green-600 p-2 hover:bg-green-50 rounded-full transition-all"
                                    title="Resolve"
                                >
                                    {loadingId === item.id ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
                                </button>
                            </div>
                            
                            <p className="text-sm text-slate-700 leading-relaxed mb-4 pl-12 whitespace-pre-wrap">
                                {item.message}
                            </p>

                            <div className="pl-12 flex flex-wrap gap-3">
                                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                    <CpuChipIcon className="h-3.5 w-3.5" />
                                    <span className="font-mono">{item.buildHash}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                    <MapPinIcon className="h-3.5 w-3.5" />
                                    <span className="font-mono">{item.route}</span>
                                </div>
                                <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded border ${item.vaultUnlocked ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                    {item.vaultUnlocked ? <LockOpenIcon className="h-3.5 w-3.5" /> : <LockClosedIcon className="h-3.5 w-3.5" />}
                                    <span className="font-mono">{item.vaultUnlocked ? 'Vault Open' : 'Vault Locked'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                />
            </div>
        </div>
    );
}
