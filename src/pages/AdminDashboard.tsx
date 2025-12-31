/**
 * src/pages/AdminDashboard.tsx
 * GITHUB COMMENT:
 * [AdminDashboard.tsx]
 * MERGE: Consolidated existing Deduplication tools with new Admin features.
 * STRUCTURE: 4 Tabs -> Analytics (Gemini), Users (Directory), Health (Errors), Maintenance (Dedupe).
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  doc, 
  orderBy,
  limit,
  Timestamp,
  type Firestore 
} from 'firebase/firestore';
import VibrantHeader from '../components/VibrantHeader';
import { THEME } from '../lib/theme';
import { 
  CommandLineIcon, 
  DocumentDuplicateIcon, 
  ShieldCheckIcon, 
  UserGroupIcon, 
  ArrowPathIcon, 
  CheckCircleIcon,
  CpuChipIcon,
  ServerIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { Navigate } from 'react-router-dom';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell, 
    Legend
} from 'recharts';
import UserDirectory from '../components/admin/UserDirectory';
import ErrorLogViewer from '../components/admin/ErrorLogViewer';

// Types for Analytics
interface AIUsageLog {
    id: string;
    model: string;
    timestamp: Timestamp;
    usage: {
        totalTokens: number;
        promptTokens: number;
        candidatesTokens: number;
    };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'health' | 'maintenance'>('analytics');
  
  // Operation State (Dedupe, etc.)
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  
  // Analytics Data State
  const [logs, setLogs] = useState<AIUsageLog[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // --- 1. AUTH CHECK & INITIAL LOAD ---
  useEffect(() => {
      if (isAdmin && user && db) {
          loadAnalytics();
      }
  }, [isAdmin, user]);

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  // --- 2. DATA FETCHING (ANALYTICS) ---
  const loadAnalytics = async () => {
      if (!db) return;
      try {
          const q = query(
              collection(db, 'ai_logs'), 
              orderBy('timestamp', 'desc'), 
              limit(100)
          );
          const snap = await getDocs(q);
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as AIUsageLog));
          setLogs(data);
      } catch (e) {
          console.error("Failed to load analytics", e);
      } finally {
          setMetricsLoading(false);
      }
  };

  // --- 3. CHART DATA PREP ---
  const modelData = logs.reduce((acc, log) => {
      const existing = acc.find(i => i.name === log.model);
      if (existing) {
          existing.value += 1;
      } else {
          acc.push({ name: log.model, value: 1 });
      }
      return acc;
  }, [] as { name: string; value: number }[]);

  const tokenData = logs.slice(0, 20).reverse().map(log => ({
      name: new Date(log.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      tokens: log.usage.totalTokens,
      model: log.model
  }));

  const totalTokens = logs.reduce((sum, log) => sum + log.usage.totalTokens, 0);

  // --- 4. MAINTENANCE TOOLS (DEDUPLICATION) ---
  // Restored from previous version
  const runDeduplication = async () => {
    if (!user || !db) return;
    if (!confirm("This will permanently delete duplicate journal entries. Continue?")) return;

    setLoading(true);
    setStatus("Scanning for duplicates...");
    const database: Firestore = db;

    try {
      const q = query(collection(database, 'journals'), where('uid', '==', user.uid));
      const snapshot = await getDocs(q);
      
      const seen = new Map<string, string>(); // key: content+timestamp, value: docId
      const duplicates: string[] = [];

      snapshot.docs.forEach(d => {
        const data = d.data();
        const content = data.content as string;
        const time = data.createdAt?.toMillis?.() || 0;
        const key = `${content.trim()}_${time}`;

        if (seen.has(key)) {
          duplicates.push(d.id);
        } else {
          seen.set(key, d.id);
        }
      });

      if (duplicates.length === 0) {
        setStatus("No duplicates found.");
        setLoading(false);
        return;
      }

      setStatus(`Found ${duplicates.length} duplicates. Deleting in batches...`);

      // Firestore Batch limit is 500
      let batch = writeBatch(database);
      let count = 0;

      for (const id of duplicates) {
        batch.delete(doc(database, 'journals', id));
        count++;
        if (count >= 400) {
          await batch.commit();
          batch = writeBatch(database);
          count = 0;
        }
      }
      
      if (count > 0) await batch.commit();

      setStatus(`Success! Removed ${duplicates.length} duplicate entries.`);
    } catch (e) {
      console.error(e);
      setStatus("Error running deduplication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`h-[100dvh] flex flex-col ${THEME.profile.page}`}>
      <VibrantHeader 
        title="Admin Tools"
        subtitle="Operational governance and system telemetry."
        icon={CommandLineIcon}
        fromColor="from-slate-800"
        viaColor="via-gray-900"
        toColor="to-black"
      />

      {/* --- TAB NAVIGATION --- */}
      <div className="px-4 -mt-10 relative z-30">
        <div className="bg-white p-1 rounded-xl shadow-lg border border-gray-200 flex flex-wrap max-w-2xl mx-auto">
            <button 
                onClick={() => setActiveTab('analytics')}
                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'analytics' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <CpuChipIcon className="h-4 w-4" /> Analytics
            </button>
            <button 
                onClick={() => setActiveTab('users')}
                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'users' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <UserGroupIcon className="h-4 w-4" /> Users
            </button>
            <button 
                onClick={() => setActiveTab('health')}
                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'health' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <ServerIcon className="h-4 w-4" /> Health
            </button>
            <button 
                onClick={() => setActiveTab('maintenance')}
                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'maintenance' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <WrenchScrewdriverIcon className="h-4 w-4" /> Tools
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-8 max-w-5xl mx-auto w-full animate-fadeIn">
        
        {/* --- TAB 1: ANALYTICS --- */}
        {activeTab === 'analytics' && (
            <section className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <CpuChipIcon className="h-6 w-6 text-purple-600" /> Gemini API Metrics
                </h2>
                
                {metricsLoading ? (
                    <div className="p-10 text-center text-gray-400">Loading metrics...</div>
                ) : logs.length === 0 ? (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center text-gray-500">
                        No AI usage logs found yet. Use the app to generate some data.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* CARD 1: Model Distribution */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 h-80">
                            <h4 className="text-sm font-bold text-gray-500 uppercase mb-4">Request Distribution</h4>
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie 
                                        data={modelData} 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={60} 
                                        outerRadius={80} 
                                        paddingAngle={5} 
                                        dataKey="value"
                                    >
                                        {modelData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* CARD 2: Token Usage Stream */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 h-80 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-bold text-gray-500 uppercase">Recent Token Usage</h4>
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md font-bold">Total: {totalTokens.toLocaleString()}</span>
                            </div>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={tokenData}>
                                        <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis hide />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} 
                                            cursor={{fill: '#f3f4f6'}} 
                                        />
                                        <Bar dataKey="tokens" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        )}

        {/* --- TAB 2: USERS --- */}
        {activeTab === 'users' && <UserDirectory />}

        {/* --- TAB 3: HEALTH --- */}
        {activeTab === 'health' && <ErrorLogViewer />}

        {/* --- TAB 4: MAINTENANCE (Restored Tools) --- */}
        {activeTab === 'maintenance' && (
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <WrenchScrewdriverIcon className="h-6 w-6 text-orange-600" /> Data Maintenance
                </h2>

                {status && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-3 text-blue-800 text-sm font-medium animate-fadeIn">
                        {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
                        {status}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* TOOL: DEDUPLICATION */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-50 rounded-lg text-red-600">
                                <DocumentDuplicateIcon className="h-6 w-6" />
                            </div>
                            <h3 className="font-bold text-gray-900">Journal Deduplicator</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Scans your journals for entries with identical content and timestamps created by multiple imports. Keeps the original and removes clones.
                        </p>
                        <button 
                            onClick={runDeduplication} 
                            disabled={loading}
                            className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all active:scale-95"
                        >
                            Run Clean Up
                        </button>
                    </div>

                    {/* TOOL: ENCRYPTION AUDIT */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 opacity-50">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <ShieldCheckIcon className="h-6 w-6" />
                            </div>
                            <h3 className="font-bold text-gray-900">Security Audit</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Identifies unencrypted entries in the cloud that need re-saving to be secured by your new PIN.
                        </p>
                        <button disabled className="w-full py-3 bg-gray-100 text-gray-400 font-bold rounded-xl cursor-not-allowed">
                            Coming Soon
                        </button>
                    </div>

                    {/* TOOL: TEAM MANAGEMENT */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 opacity-50">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                <UserGroupIcon className="h-6 w-6" />
                            </div>
                            <h3 className="font-bold text-gray-900">Manage Admins</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Grant developer access to other emails to help troubleshoot data issues.
                        </p>
                        <button disabled className="w-full py-3 bg-gray-100 text-gray-400 font-bold rounded-xl cursor-not-allowed">
                            Coming Soon
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}