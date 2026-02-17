/**
 * src/pages/AdminDashboard.tsx
 * UPDATED: Added Feedback Viewer Tab. Cleaned Syntax.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit, 
} from 'firebase/firestore';
import VibrantHeader from '../components/VibrantHeader';
import { THEME } from '../lib/theme';
import { 
  CommandLineIcon, 
  UserGroupIcon, 
  CpuChipIcon, 
  ServerIcon,
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { Navigate } from 'react-router-dom';

// Sub-components
import UserDirectory from '../components/admin/UserDirectory';
import ErrorLogViewer from '../components/admin/ErrorLogViewer';
import AnalyticsCharts, { type AIUsageLog } from '../components/admin/AnalyticsCharts';
import DeduplicationTool from '../components/admin/DeduplicationTool';
import SchemaMigration from '../components/admin/SchemaMigration';
import FeedbackViewer from '../components/admin/FeedbackViewer';

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'health' | 'feedback' | 'maintenance'>('analytics');
  
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
        <div className="bg-white p-1 rounded-xl shadow-lg border border-gray-200 flex flex-wrap max-w-3xl mx-auto">
            <button 
                onClick={() => setActiveTab('analytics')}
                className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'analytics' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <CpuChipIcon className="h-4 w-4" /> Analytics
            </button>
            <button 
                onClick={() => setActiveTab('users')}
                className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'users' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <UserGroupIcon className="h-4 w-4" /> Users
            </button>
            <button 
                onClick={() => setActiveTab('health')}
                className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'health' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <ServerIcon className="h-4 w-4" /> Health
            </button>
            <button 
                onClick={() => setActiveTab('feedback')}
                className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'feedback' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <ChatBubbleLeftRightIcon className="h-4 w-4" /> Inbox
            </button>
            <button 
                onClick={() => setActiveTab('maintenance')}
                className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'maintenance' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
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
                ) : (
                    <AnalyticsCharts logs={logs} />
                )}
            </section>
        )}

        {/* --- TAB 2: USERS --- */}
        {activeTab === 'users' && <UserDirectory />}

        {/* --- TAB 3: HEALTH --- */}
        {activeTab === 'health' && <ErrorLogViewer />}

        {/* --- TAB 4: FEEDBACK --- */}
        {activeTab === 'feedback' && <FeedbackViewer />}

        {/* --- TAB 5: MAINTENANCE --- */}
        {activeTab === 'maintenance' && user && (
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <WrenchScrewdriverIcon className="h-6 w-6 text-orange-600" /> Data Maintenance
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DeduplicationTool uid={user.uid} />
                    <SchemaMigration uid={user.uid} />
                </div>
            </div>
        )}

      </div>
    </div>
  );
}
