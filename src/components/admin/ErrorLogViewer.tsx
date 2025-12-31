/**
 * src/components/admin/ErrorLogViewer.tsx
 * GITHUB COMMENT:
 * [ErrorLogViewer.tsx]
 * FIX: Removed unused 'useEffect' and renamed unused 'index' parameter to '_index'.
 */
import { useState } from 'react';
import { db } from '../../lib/firebase';
import { 
    collection, 
    getDocs, 
    deleteDoc, 
    doc, 
    orderBy, 
    query, 
    limit, 
    type Firestore,
    Timestamp 
} from 'firebase/firestore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analyzeSystemHealth, type SystemHealthAnalysis } from '../../lib/gemini';
import { Virtuoso } from 'react-virtuoso';
import { 
    ExclamationTriangleIcon, 
    TrashIcon, 
    ComputerDesktopIcon,
    SparklesIcon,
    ArrowPathIcon,
    CheckBadgeIcon,
   // WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

interface ErrorLog {
    id: string;
    message: string;
    stack: string;
    url: string;
    timestamp: Timestamp;
    userAgent: string;
}

interface AggregatedError {
    count: number;
    sampleStack: string;
    browsers: Set<string>;
}

export default function ErrorLogViewer() {
    const queryClient = useQueryClient();
    
    // Analysis State
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<SystemHealthAnalysis | null>(null);

    const { data: errors = [], isLoading } = useQuery({
        queryKey: ['client_errors'],
        queryFn: async () => {
            if (!db) return [];
            const database: Firestore = db;
            const q = query(
                collection(database, 'client_errors'),
                orderBy('timestamp', 'desc'),
                limit(100)
            );
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as ErrorLog));
        }
    });

    const handleDelete = async (id: string) => {
        if (!db) return;
        if (!confirm("Delete this log?")) return;
        try {
            await deleteDoc(doc(db, 'client_errors', id));
            queryClient.invalidateQueries({ queryKey: ['client_errors'] });
        } catch (e) {
            console.error("Failed to delete", e);
        }
    };

    const handleAnalyze = async () => {
        if (errors.length === 0) return;
        setAnalyzing(true);
        setAnalysis(null);

        try {
            const aggregated = errors.reduce<Record<string, AggregatedError>>((acc, curr) => {
                const key = curr.message;
                if (!acc[key]) {
                    acc[key] = { count: 0, sampleStack: curr.stack, browsers: new Set() };
                }
                acc[key].count++;
                acc[key].browsers.add(curr.userAgent.split(')')[0]); 
                return acc;
            }, {});

            const logSummary = Object.entries(aggregated).map(([msg, details]) => `
                ERROR: ${msg}
                COUNT: ${details.count}
                BROWSERS: ${Array.from(details.browsers).join(', ')}
                STACK_SNIPPET: ${details.sampleStack.substring(0, 300)}...
            `).join('\n---\n');

            const result = await analyzeSystemHealth(logSummary);
            setAnalysis(result);

        } catch (e) {
            console.error("Analysis failed", e);
            alert("Failed to generate AI analysis.");
        } finally {
            setAnalyzing(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-400">Scanning telemetry...</div>;

    if (errors.length === 0) {
        return (
            <div className="bg-green-50 p-8 rounded-2xl border border-green-200 text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <ComputerDesktopIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-green-900 font-bold">System Healthy</h3>
                <p className="text-green-700 text-sm">No client-side crashes reported.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 h-[600px] flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                    Recent Crashes ({errors.length})
                </h3>
                <button 
                    onClick={handleAnalyze} 
                    disabled={analyzing}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 text-sm font-bold"
                >
                    {analyzing ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-4 w-4" />}
                    Analyze Health
                </button>
            </div>

            {analysis && (
                 <div className="bg-white border border-indigo-100 rounded-2xl shadow-lg overflow-hidden animate-slideUp shrink-0 mb-4">
                    <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                        <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                            <SparklesIcon className="h-5 w-5" /> AI Diagnosis
                        </h4>
                        <span className="text-xs font-bold uppercase bg-white px-2 py-1 rounded text-indigo-600 border border-indigo-200">{analysis.status}</span>
                    </div>
                    
                    <div className="p-4 space-y-4">
                        <p className="text-sm text-gray-700">{analysis.summary}</p>
                        
                        {/* Render Top Issues */}
                        <div className="space-y-2">
                            {analysis.top_issues.map((issue, idx) => (
                                <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs">
                                    <strong className="text-gray-900 block mb-1">{issue.error_signature}</strong>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <p className="text-gray-600"><span className="font-bold">Root Cause:</span> {issue.suspected_root_cause}</p>
                                        <p className="text-blue-700 bg-blue-50 p-1 rounded"><span className="font-bold">Fix:</span> {issue.suggested_fix}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {analysis.environment_patterns && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 p-2 rounded-lg justify-center">
                                <CheckBadgeIcon className="h-4 w-4" />
                                <strong>Pattern:</strong> {analysis.environment_patterns}
                            </div>
                        )}
                    </div>
                 </div>
            )}
            
            {/* RAW LOGS VIRTUALIZED */}
            <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                <Virtuoso 
                    data={errors}
                    itemContent={(_index, err) => (
                        <div className="bg-white p-5 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="text-xs font-bold bg-red-100 text-red-800 px-2 py-1 rounded">
                                        {err.timestamp?.toDate().toLocaleString()}
                                    </span>
                                    <h4 className="font-bold text-gray-900 mt-2 text-sm">{err.message}</h4>
                                </div>
                                <button 
                                    onClick={() => handleDelete(err.id)}
                                    className="text-gray-400 hover:text-red-600 p-1"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                            
                            <div className="bg-gray-100 p-3 rounded-lg text-xs font-mono text-gray-600 overflow-x-auto mb-3">
                                {err.stack ? err.stack.split('\n')[0] : 'No stack trace'}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                <span className="truncate max-w-[200px]">{err.url}</span>
                                <span className="truncate max-w-[200px]">{err.userAgent}</span>
                            </div>
                        </div>
                    )}
                />
            </div>
        </div>
    );
}