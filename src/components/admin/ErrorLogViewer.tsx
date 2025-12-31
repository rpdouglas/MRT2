/**
 * src/components/admin/ErrorLogViewer.tsx
 * GITHUB COMMENT:
 * [ErrorLogViewer.tsx]
 * UPDATED: Integrated 'Analyze with AI' feature.
 * FEATURE: Aggregates client errors and uses Gemini to diagnose system health and suggest fixes.
 */
import { useState, useEffect } from 'react';
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
import { analyzeSystemHealth, type SystemHealthAnalysis } from '../../lib/gemini';
import { 
    ExclamationTriangleIcon, 
    TrashIcon,
    ComputerDesktopIcon,
    SparklesIcon,
    ArrowPathIcon,
    CheckBadgeIcon,
    WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

interface ErrorLog {
    id: string;
    message: string;
    stack: string;
    url: string;
    timestamp: Timestamp;
    userAgent: string;
}

export default function ErrorLogViewer() {
    const [errors, setErrors] = useState<ErrorLog[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Analysis State
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<SystemHealthAnalysis | null>(null);

    useEffect(() => {
        loadErrors();
    }, []);

    const loadErrors = async () => {
        if (!db) return;
        setLoading(true);
        try {
            const database: Firestore = db;
            const q = query(
                collection(database, 'client_errors'),
                orderBy('timestamp', 'desc'),
                limit(50)
            );
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ErrorLog));
            setErrors(data);
        } catch (error) {
            console.error("Failed to load errors", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!db) return;
        if (!confirm("Delete this log?")) return;
        try {
            await deleteDoc(doc(db, 'client_errors', id));
            setErrors(prev => prev.filter(e => e.id !== id));
        } catch (e) {
            console.error("Failed to delete", e);
        }
    };

    const handleAnalyze = async () => {
        if (errors.length === 0) return;
        setAnalyzing(true);
        setAnalysis(null);

        try {
            // 1. Prepare Data (Aggregation to save tokens)
            // Group by error message to avoid sending 50 identical logs
            const aggregated = errors.reduce((acc, curr) => {
                const key = curr.message;
                if (!acc[key]) {
                    acc[key] = { count: 0, sampleStack: curr.stack, browsers: new Set() };
                }
                acc[key].count++;
                acc[key].browsers.add(curr.userAgent.split(')')[0]); // Simple user agent trunc
                return acc;
            }, {} as Record<string, { count: number; sampleStack: string; browsers: Set<string> }>);

            // Format for prompt
            const logSummary = Object.entries(aggregated).map(([msg, details]) => `
                ERROR: ${msg}
                COUNT: ${details.count}
                BROWSERS: ${Array.from(details.browsers).join(', ')}
                STACK_SNIPPET: ${details.sampleStack.substring(0, 300)}...
            `).join('\n---\n');

            // 2. Call Gemini
            const result = await analyzeSystemHealth(logSummary);
            setAnalysis(result);

        } catch (e) {
            console.error("Analysis failed", e);
            alert("Failed to generate AI analysis.");
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Scanning telemetry...</div>;

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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
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

            {/* AI DIAGNOSIS PANEL */}
            {analysis && (
                <div className="bg-white border border-indigo-100 rounded-2xl shadow-lg overflow-hidden animate-slideUp">
                    <div className={`px-6 py-4 flex justify-between items-center ${
                        analysis.status === 'Critical' ? 'bg-red-50 border-b border-red-100' :
                        analysis.status === 'Warning' ? 'bg-orange-50 border-b border-orange-100' :
                        'bg-green-50 border-b border-green-100'
                    }`}>
                        <div className="flex items-center gap-3">
                            <SparklesIcon className="h-6 w-6 text-indigo-600" />
                            <h4 className="font-bold text-gray-900">AI Diagnosis</h4>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${
                            analysis.status === 'Critical' ? 'bg-red-100 text-red-700 border-red-200' :
                            analysis.status === 'Warning' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                            'bg-green-100 text-green-700 border-green-200'
                        }`}>
                            System Status: {analysis.status}
                        </span>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <p className="text-gray-700 font-medium">{analysis.summary}</p>
                        
                        <div className="grid gap-4">
                            {analysis.top_issues.map((issue, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <div className="flex justify-between items-start mb-2">
                                        <h5 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px]">#{idx + 1}</span>
                                            {issue.error_signature}
                                        </h5>
                                        <span className="text-xs text-gray-500 font-mono">Count: ~{issue.occurrence_count}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Root Cause</div>
                                            <p className="text-xs text-gray-700 leading-relaxed">{issue.suspected_root_cause}</p>
                                        </div>
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                <WrenchScrewdriverIcon className="h-3 w-3" /> Fix
                                            </div>
                                            <p className="text-xs text-blue-900 font-mono">{issue.suggested_fix}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {analysis.environment_patterns && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 p-2 rounded-lg justify-center">
                                <CheckBadgeIcon className="h-4 w-4" />
                                <strong>Pattern Detected:</strong> {analysis.environment_patterns}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* RAW LOGS */}
            <div className="grid gap-4">
                {errors.map(err => (
                    <div key={err.id} className="bg-white p-5 rounded-xl border border-red-100 shadow-sm hover:shadow-md transition-shadow">
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
                        
                        <div className="bg-gray-50 p-3 rounded-lg text-xs font-mono text-gray-600 overflow-x-auto mb-3">
                            {err.stack ? err.stack.split('\n')[0] : 'No stack trace'}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="truncate max-w-[200px]">{err.url}</span>
                            <span className="truncate max-w-[200px]">{err.userAgent}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}