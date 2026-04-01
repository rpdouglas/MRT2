import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Fixed syntax in {path}")

error_log_viewer = r"""/**
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
    CheckBadgeIcon
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
"""

feedback_viewer = r"""import React, { useState, useEffect, useMemo, type ElementType } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Disclosure, Transition } from '@headlessui/react';
import { 
    Clock, 
    ExternalLink, 
    Github, 
    ClipboardList,
    ChevronUpIcon,
    InboxIcon,
    Search,
    Archive
} from 'lucide-react';

interface FeedbackReport {
  id: string;
  category: 'bug' | 'suggestion' | 'content';
  message: string;
  status: 'new' | 'investigating' | 'resolved';
  buildHash: string;
  environment: string;
  vaultUnlocked: boolean;
  route: string;
  userAgent: string;
  timestamp?: Timestamp;
}

interface SectionHeaderProps {
  title: string;
  count: number;
  color: string;
  icon: ElementType;
  isOpen: boolean;
}

const FeedbackViewer: React.FC = () => {
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    if (!db) {
        setTimeout(() => setLoading(false), 0);
        return;
    }

    // Fetch all feedback, order by newest first
    const q = query(collection(db, 'feedback'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(d => {
            const raw = d.data();
            return {
                id: d.id,
                ...raw,
                message: raw.message || raw.content || '',
                // Ensure status has a default if missing
                status: raw.status || 'new'
            } as FeedbackReport;
        });
        setReports(data);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to listen to feedback:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // --- 2. GROUPING LOGIC ---
  const groupedReports = useMemo(() => {
      return {
          new: reports.filter(r => r.status === 'new'),
          investigating: reports.filter(r => r.status === 'investigating'),
          resolved: reports.filter(r => r.status === 'resolved')
      };
  }, [reports]);

  // --- 3. ACTIONS ---
  const updateStatus = async (id: string, newStatus: FeedbackReport['status']) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'feedback', id), { status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const sendToGitHub = (report: FeedbackReport) => {
    const repoUrl = "https://github.com/rpdouglas/MRT2/issues/new";
    const title = encodeURIComponent(`[${report.category?.toUpperCase() || 'BUG'}] Issue reported on ${report.route || 'unknown'}`);
    
    const bodyMarkdown = `
### User Report
${report.message || 'No content provided.'}

---
### Technical Context
* **Route:** \`${report.route || 'N/A'}\`
* **Environment:** \`${report.environment || 'N/A'}\`
* **Build Hash:** \`${report.buildHash || 'N/A'}\`
* **Vault Unlocked:** \`${report.vaultUnlocked}\`
* **Device/Browser:** \`${report.userAgent || 'N/A'}\`
* **Firestore ID:** \`${report.id}\`
    `.trim();

    const body = encodeURIComponent(bodyMarkdown);
    window.open(`${repoUrl}?title=${title}&body=${body}`, '_blank');
  };

  const generateTriageReport = () => {
    const investigating = groupedReports.investigating;
    
    if (investigating.length === 0) {
      alert("You have no bugs tagged as 'investigating'. Tag some first!");
      return;
    }

    // Group by Route
    const groupedByRoute = investigating.reduce((acc, report) => {
      const route = report.route || 'Global/Unknown';
      if (!acc[route]) acc[route] = [];
      acc[route].push(report);
      return acc;
    }, {} as Record<string, FeedbackReport[]>);

    let markdown = `# 🐛 Bug Bash: Active Triage Report\n`;
    markdown += `**Generated:** ${new Date().toLocaleDateString()}\n`;
    markdown += `**Total Issues:** ${investigating.length}\n\n`;

    Object.entries(groupedByRoute).forEach(([route, bugs], index) => {
      markdown += `## Phase ${index + 1}: ${route} Polish\n`;
      bugs.forEach(bug => {
        const dateStr = bug.timestamp?.toDate ? bug.timestamp.toDate().toLocaleDateString() : 'Unknown Date';
        markdown += `- [ ] **[${bug.category?.toUpperCase() || 'BUG'}]** ${bug.message.split('\n')[0]}\n`;
        markdown += `  - *Details:* \`${bug.environment}\` | Vault Unlocked: \`${bug.vaultUnlocked}\` | Reported: ${dateStr}\n`;
      });
      markdown += `\n`;
    });

    navigator.clipboard.writeText(markdown).then(() => {
      alert("✅ Triage Report copied!");
    });
  };

  if (loading) return <div className="p-4 text-slate-400">Loading inbox...</div>;

  // --- 4. RENDER HELPERS ---
  const SectionHeader = ({ title, count, color, icon: Icon, isOpen }: SectionHeaderProps) => (
      <div className={`flex items-center justify-between w-full px-4 py-3 text-left text-sm font-bold rounded-xl transition-all ${
          isOpen ? `bg-${color}-50 text-${color}-900` : 'bg-white text-slate-500 hover:bg-slate-50'
      }`}>
          <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${isOpen ? `bg-${color}-100` : 'bg-slate-100'}`}>
                  <Icon className="w-4 h-4" />
              </div>
              <span>{title}</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isOpen ? `bg-${color}-200 text-${color}-800` : 'bg-slate-200 text-slate-600'}`}>
                  {count}
              </span>
          </div>
          <ChevronUpIcon className={`${isOpen ? 'transform rotate-180' : ''} w-5 h-5 text-slate-400 transition-transform`} />
      </div>
  );

  const ReportCard = ({ report }: { report: FeedbackReport }) => (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
          <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${
                      report.category === 'bug' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                      report.category === 'suggestion' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                      'bg-slate-50 text-slate-700 border-slate-100'
                  }`}>
                      {report.category}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {report.timestamp?.toDate ? report.timestamp.toDate().toLocaleDateString() : 'N/A'}
                  </span>
              </div>
              
              {/* Quick Status Actions */}
              <select 
                  value={report.status}
                  onChange={(e) => updateStatus(report.id, e.target.value as FeedbackReport['status'])}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
              >
                  <option value="new">New</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
              </select>
          </div>

          <p className="text-sm text-slate-800 mb-3 whitespace-pre-wrap leading-relaxed">{report.message}</p>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="text-[10px] font-mono text-slate-400">
                  {report.route || '/'} • {report.environment}
              </div>
              <button 
                  onClick={() => sendToGitHub(report)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
                  title="Create GitHub Issue"
              >
                  <Github className="w-3 h-3" />
                  <span>Issue</span>
                  <ExternalLink className="w-3 h-3 opacity-50" />
              </button>
          </div>
      </div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      
      {/* ACTION BAR */}
      <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl shadow-lg shrink-0">
        <div>
          <h3 className="text-white font-bold flex items-center gap-2">
              <InboxIcon className="w-5 h-5 text-blue-400" />
              Feedback Inbox
          </h3>
          <p className="text-xs text-slate-400">Manage incoming reports.</p>
        </div>
        <button 
          onClick={generateTriageReport}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-50 text-white px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-md"
        >
          <ClipboardList className="w-4 h-4" />
          Triage Report
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          
          {/* SECTION 1: NEW ISSUES (Default Open) */}
          <Disclosure defaultOpen>
              {({ open }) => (
                  <div className={`rounded-2xl transition-all ${open ? 'bg-blue-50/50 p-2' : ''}`}>
                      <Disclosure.Button className="w-full focus:outline-none mb-2">
                          <SectionHeader title="New Issues" count={groupedReports.new.length} color="blue" icon={InboxIcon} isOpen={open} />
                      </Disclosure.Button>
                      <Transition
                          enter="transition duration-100 ease-out"
                          enterFrom="transform scale-95 opacity-0"
                          enterTo="transform scale-100 opacity-100"
                          leave="transition duration-75 ease-out"
                          leaveFrom="transform scale-100 opacity-100"
                          leaveTo="transform scale-95 opacity-0"
                      >
                          <Disclosure.Panel className="space-y-3 px-1 pb-2">
                              {groupedReports.new.length === 0 ? (
                                  <div className="text-center py-6 text-slate-400 text-sm italic">Inbox Zero! No new reports.</div>
                              ) : (
                                  groupedReports.new.map(report => <ReportCard key={report.id} report={report} />)
                              )}
                          </Disclosure.Panel>
                      </Transition>
                  </div>
              )}
          </Disclosure>

          {/* SECTION 2: INVESTIGATING (Default Open) */}
          <Disclosure defaultOpen>
              {({ open }) => (
                  <div className={`rounded-2xl transition-all ${open ? 'bg-amber-50/50 p-2' : ''}`}>
                      <Disclosure.Button className="w-full focus:outline-none mb-2">
                          <SectionHeader title="Investigating" count={groupedReports.investigating.length} color="amber" icon={Search} isOpen={open} />
                      </Disclosure.Button>
                      <Transition
                          enter="transition duration-100 ease-out"
                          enterFrom="transform scale-95 opacity-0"
                          enterTo="transform scale-100 opacity-100"
                          leave="transition duration-75 ease-out"
                          leaveFrom="transform scale-100 opacity-100"
                          leaveTo="transform scale-95 opacity-0"
                      >
                          <Disclosure.Panel className="space-y-3 px-1 pb-2">
                               {groupedReports.investigating.length === 0 ? (
                                  <div className="text-center py-4 text-slate-400 text-sm italic">No active investigations.</div>
                              ) : (
                                  groupedReports.investigating.map(report => <ReportCard key={report.id} report={report} />)
                              )}
                          </Disclosure.Panel>
                      </Transition>
                  </div>
              )}
          </Disclosure>

          {/* SECTION 3: RESOLVED (Default Closed) */}
          <Disclosure>
              {({ open }) => (
                  <div className={`rounded-2xl transition-all ${open ? 'bg-slate-100 p-2' : ''}`}>
                      <Disclosure.Button className="w-full focus:outline-none mb-2">
                          <SectionHeader title="Resolved / Archive" count={groupedReports.resolved.length} color="slate" icon={Archive} isOpen={open} />
                      </Disclosure.Button>
                      <Transition
                          enter="transition duration-100 ease-out"
                          enterFrom="transform scale-95 opacity-0"
                          enterTo="transform scale-100 opacity-100"
                          leave="transition duration-75 ease-out"
                          leaveFrom="transform scale-100 opacity-100"
                          leaveTo="transform scale-95 opacity-0"
                      >
                          <Disclosure.Panel className="space-y-3 px-1 pb-2">
                              {groupedReports.resolved.map(report => (
                                  <div key={report.id} className="opacity-75 hover:opacity-100 transition-opacity">
                                      <ReportCard report={report} />
                                  </div>
                              ))}
                          </Disclosure.Panel>
                      </Transition>
                  </div>
              )}
          </Disclosure>
          
      </div>
    </div>
  );
};

export default FeedbackViewer;
"""

journal_insights = r"""/**
 * src/components/journal/JournalInsights.tsx
 * GITHUB COMMENT:
 * [JournalInsights.tsx]
 * FEAT: "Emotional Velocity" upgraded to Gradient Area Chart.
 * FEAT: "Weekly Rhythm" upgraded to 'Baseline vs Reality' (Thick Bars + Dotted Line).
 * FEAT: Added smart Stop-Word filtering to Word Cloud.
 * FEAT: Added "Manage Filter" modal for user-defined blocked words (LocalStorage).
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
    AreaChart, 
    Area, 
    Line, 
    Bar, 
    ComposedChart, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Legend
} from 'recharts';
import { 
    ChartBarIcon, 
    CloudIcon, 
    FireIcon, 
    CalendarDaysIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';
import { format, subDays, getDay, startOfDay } from 'date-fns';
import ManageWordCloudModal from './ManageWordCloudModal';

// --- TYPES ---

interface DailyStats {
    date: string; 
    displayDate: string; 
    avgMood: number;
    avgTemp: number;
    entryCount: number;
}

interface WeeklyComparisonStats {
    dayName: string;
    currentAvg: number;
    prevAvg: number;
    currentCount: number;
    prevCount: number;
}

interface WordFrequency {
    text: string;
    value: number;
}

interface JournalEntryRaw {
    moodScore?: number;
    weather?: { temp: number; condition: string } | null;
    createdAt: Timestamp;
    sentiment?: string; 
    content?: string;
}

// EXPANDED STOP WORDS
const RECOVERY_STOP_WORDS = new Set([
    'the', 'and', 'i', 'to', 'a', 'of', 'in', 'was', 'my', 'that', 'for', 'it', 'me', 'on', 
    'with', 'but', 'is', 'this', 'have', 'be', 'so', 'not', 'at', 'as', 'today', 'day', 
    'feeling', 'feel', 'am', 'just', 'had', 'very', 'really', 'will', 'up', 'out', 'from',
    'about', 'what', 'when', 'where', 'how', 'why',
    // MRT Boilerplate
    'morning', 'check-in', 'checkin', 'nightly', 'review', 'urge', 'log', 'meeting', 'reflection',
    'trigger', 'intensity', 'coping', 'strategy', 'topic', 'heard', 'resonated', 'apply',
    'well', 'challenged', 'stay', 'sober', 'focus', 'grateful', 'main', 'thing', 'went'
]);

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STORAGE_KEY_BLOCKLIST = 'mrt_word_cloud_ignore_list';

export default function JournalInsights() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avgMood: 0, streak: 0, trend: 0 });
  
  const [dailyTrendData, setDailyTrendData] = useState<DailyStats[]>([]);
  const [weeklyComparisonData, setWeeklyComparisonData] = useState<WeeklyComparisonStats[]>([]);
  const [wordCloudData, setWordCloudData] = useState<WordFrequency[]>([]);

  // User Blocklist State (Persisted)
  const [userBlockList, setUserBlockList] = useState<string[]>(() => {
      const stored = localStorage.getItem(STORAGE_KEY_BLOCKLIST);
      return stored ? JSON.parse(stored) : [];
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Save blocklist when it changes
  useEffect(() => {
      localStorage.setItem(STORAGE_KEY_BLOCKLIST, JSON.stringify(userBlockList));
  }, [userBlockList]);

  // Load Data Effect
  useEffect(() => {
    async function loadData() {
        if (!user || !db) return;

        try {
            const q = query(
                collection(db, 'journals'), 
                where('uid', '==', user.uid),
                orderBy('createdAt', 'asc')
            );
            
            const snapshot = await getDocs(q);
            const rawData = snapshot.docs.map(d => d.data() as JournalEntryRaw);

            // Containers
            const dailyMap = new Map<string, { moodSum: number; moodCount: number; tempSum: number; tempCount: number, timestamp: Date }>();
            const weeklyBuckets = Array.from({ length: 7 }, (_, i) => ({
                dayName: DAYS_OF_WEEK[i],
                currentTotal: 0, currentCount: 0,
                prevTotal: 0, prevCount: 0
            }));
            const wordFreq: Record<string, number> = {};

            // Dates
            const today = startOfDay(new Date());
            const thirtyDaysAgo = subDays(today, 30);
            const sixtyDaysAgo = subDays(today, 60);

            // Globals
            let totalMoodSum = 0;
            let totalEntries = 0;
            let current30Total = 0; let current30Count = 0;
            let prev30Total = 0; let prev30Count = 0;

            // Combined Block Set for Filtering
            const activeBlockSet = new Set([...Array.from(RECOVERY_STOP_WORDS), ...userBlockList]);

            rawData.forEach(entry => {
                if (!entry.createdAt) return;
                const dateObj = entry.createdAt.toDate(); 
                const dateKey = format(dateObj, 'yyyy-MM-dd'); 

                // 1. Daily Trend
                if (!dailyMap.has(dateKey)) {
                    dailyMap.set(dateKey, { moodSum: 0, moodCount: 0, tempSum: 0, tempCount: 0, timestamp: dateObj });
                }
                const dayStat = dailyMap.get(dateKey)!;

                if (entry.moodScore !== undefined) {
                    dayStat.moodSum += entry.moodScore;
                    dayStat.moodCount += 1;
                    totalMoodSum += entry.moodScore;
                    totalEntries++;

                    // 2. Weekly Comparison
                    const dayIndex = getDay(dateObj); // 0 = Sun
                    
                    if (dateObj >= thirtyDaysAgo) {
                        weeklyBuckets[dayIndex].currentTotal += entry.moodScore;
                        weeklyBuckets[dayIndex].currentCount += 1;
                        current30Total += entry.moodScore;
                        current30Count += 1;
                    } else if (dateObj >= sixtyDaysAgo && dateObj < thirtyDaysAgo) {
                        weeklyBuckets[dayIndex].prevTotal += entry.moodScore;
                        weeklyBuckets[dayIndex].prevCount += 1;
                        prev30Total += entry.moodScore;
                        prev30Count += 1;
                    }
                }

                if (entry.weather?.temp !== undefined) {
                    dayStat.tempSum += entry.weather.temp;
                    dayStat.tempCount += 1;
                }

                // 3. Word Cloud
                if (entry.content) {
                    const cleanContent = entry.content.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
                    const words = cleanContent.split(/\s+/);
                    words.forEach(word => {
                        // Check against the combined active block set
                        if (word.length > 3 && !activeBlockSet.has(word)) {
                            wordFreq[word] = (wordFreq[word] || 0) + 1;
                        }
                    });
                }
            });

            // Finalize Daily Trend
            const dailyStatsArray = Array.from(dailyMap.values()).map(stat => ({
                date: format(stat.timestamp, 'yyyy-MM-dd'),
                displayDate: format(stat.timestamp, 'MMM d'),
                avgMood: stat.moodCount > 0 ? parseFloat((stat.moodSum / stat.moodCount).toFixed(1)) : 0,
                avgTemp: stat.tempCount > 0 ? Math.round(stat.tempSum / stat.tempCount) : 0,
                entryCount: stat.moodCount
            })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            setDailyTrendData(dailyStatsArray.slice(-14));

            // Finalize Weekly (Reorder to Mon-Sun)
            const sunday = weeklyBuckets.shift(); 
            if (sunday) weeklyBuckets.push(sunday);
            
            const finalizedWeekly: WeeklyComparisonStats[] = weeklyBuckets.map(b => ({
                dayName: b.dayName,
                currentAvg: b.currentCount > 0 ? parseFloat((b.currentTotal / b.currentCount).toFixed(1)) : 0,
                prevAvg: b.prevCount > 0 ? parseFloat((b.prevTotal / b.prevCount).toFixed(1)) : 0,
                currentCount: b.currentCount,
                prevCount: b.prevCount
            }));
            setWeeklyComparisonData(finalizedWeekly);

            // Finalize Word Cloud
            const topWords = Object.entries(wordFreq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([text, value]) => ({ text, value }));
            setWordCloudData(topWords);

            // Global Trend
            const current30Avg = current30Count > 0 ? current30Total / current30Count : 0;
            const prev30Avg = prev30Count > 0 ? prev30Total / prev30Count : 0;
            const trend = (prev30Count > 0 && current30Count > 0) ? parseFloat((current30Avg - prev30Avg).toFixed(1)) : 0;

            setStats({
                total: rawData.length,
                avgMood: totalEntries > 0 ? Math.round((totalMoodSum / totalEntries) * 10) / 10 : 0,
                streak: rawData.length,
                trend
            });

        } catch (error) {
            console.error("Error loading insights:", error);
        } finally {
            setLoading(false);
        }
    }

    loadData();
    // Re-run when blocklist changes to filter immediately
  }, [user, userBlockList]);

  // --- Handlers for Blocklist ---
  const handleAddBlockWord = (word: string) => {
      const lower = word.toLowerCase();
      if (!userBlockList.includes(lower)) {
          setUserBlockList(prev => [...prev, lower]);
      }
  };

  const handleRemoveBlockWord = (word: string) => {
      setUserBlockList(prev => prev.filter(w => w !== word));
  };

  if (loading) return <div className="p-10 text-center text-gray-400 animate-pulse">Analyzing patterns...</div>;

  return (
    <div className="space-y-6 pb-20">
        
        {/* --- TOP STATS --- */}
        <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50 flex flex-col items-center justify-center">
                <div className="text-2xl font-black text-indigo-600">{stats.total}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Entries</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-50 flex flex-col items-center justify-center">
                <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black text-purple-600">{stats.avgMood}</span>
                    {stats.trend !== 0 && (
                        <span className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${stats.trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {stats.trend > 0 ? <ArrowTrendingUpIcon className="h-3 w-3 mr-0.5" /> : <ArrowTrendingDownIcon className="h-3 w-3 mr-0.5" />}
                            {Math.abs(stats.trend)}
                        </span>
                    )}
                </div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Avg Mood</div>
            </div>
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-50 flex flex-col items-center justify-center">
                <FireIcon className="h-6 w-6 text-orange-500 mb-1" />
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Active</div>
            </div>
        </div>

        {/* --- 1. WEEKLY RHYTHM (Baseline vs Reality) --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-50">
            <div className="flex items-center justify-between mb-6">
                <h3 className="flex items-center gap-2 font-bold text-gray-900 text-sm uppercase tracking-wide">
                    <CalendarDaysIcon className="h-4 w-4 text-purple-500" />
                    Weekly Rhythm
                </h3>
                <div className="flex gap-3 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-slate-400">
                        <div className="w-4 h-0.5 bg-slate-400 border border-slate-400 border-dashed"></div> Prev 30 Days
                    </span>
                    <span className="flex items-center gap-1 text-purple-600">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div> Last 30 Days
                    </span>
                </div>
            </div>
            
            <div className="h-56 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={weeklyComparisonData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E7FF" />
                        <XAxis 
                            dataKey="dayName" 
                            tick={{fontSize: 10, fill: '#94A3B8'}} 
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis domain={[0, 10]} hide />
                        <Tooltip 
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} 
                            cursor={{fill: '#f8fafc'}}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="prevAvg" 
                            name="Prev 30 Days" 
                            stroke="#94a3b8" 
                            strokeWidth={2} 
                            strokeDasharray="5 5"
                            dot={{r: 3, fill: '#94a3b8'}}
                        />
                        <Bar 
                            dataKey="currentAvg" 
                            name="Last 30 Days" 
                            fill="#8b5cf6" 
                            radius={[6, 6, 0, 0]} 
                            barSize={32} 
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">Avg Mood Score</p>
        </div>

        {/* --- 2. EMOTIONAL VELOCITY (Gradient Area) --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-50">
            <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-6 text-sm uppercase tracking-wide">
                <ChartBarIcon className="h-4 w-4 text-indigo-500" />
                Emotional Velocity
            </h3>
            
            <div className="h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyTrendData} margin={{ top: 20, right: 0, bottom: 0, left: -20 }}>
                        <defs>
                            <linearGradient id="colorMoodArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E7FF" />
                        <XAxis 
                            dataKey="displayDate" 
                            tick={{fontSize: 10, fill: '#94A3B8'}} 
                            axisLine={false}
                            tickLine={false}
                            minTickGap={30}
                        />
                        <YAxis yAxisId="left" domain={[0, 10]} hide />
                        <YAxis yAxisId="right" orientation="right" hide domain={['auto', 'auto']} />

                        <Tooltip 
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} 
                            labelStyle={{fontSize: '12px', fontWeight: 'bold', color: '#475569'}}
                        />
                        <Legend wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} />

                        <Area 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="avgMood" 
                            name="Mood Flow" 
                            stroke="#6366F1" 
                            fillOpacity={1} 
                            fill="url(#colorMoodArea)" 
                            strokeWidth={3} 
                        />
                        <Line 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="avgTemp" 
                            name="Temp (°C)" 
                            stroke="#FDBA74" 
                            strokeWidth={2} 
                            dot={false} 
                            strokeDasharray="5 5" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* --- 3. WORD CLOUD --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-50 relative">
            <div className="flex justify-between items-center mb-6">
                <h3 className="flex items-center gap-2 font-bold text-gray-900 text-sm uppercase tracking-wide">
                    <CloudIcon className="h-4 w-4 text-blue-500" />
                    Recurring Themes
                </h3>
                
                {/* Filter Trigger */}
                <button 
                    onClick={() => setIsFilterModalOpen(true)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Manage Ignored Words"
                >
                    <EyeSlashIcon className="h-5 w-5" />
                </button>
            </div>
            
            {wordCloudData.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Not enough data yet.</div>
            ) : (
                <div className="flex flex-wrap gap-2 justify-center items-center py-4">
                    {wordCloudData.map((word, i) => {
                        const maxVal = wordCloudData[0].value;
                        const sizeClass = 
                            word.value > maxVal * 0.8 ? 'text-2xl font-black text-indigo-600' :
                            word.value > maxVal * 0.6 ? 'text-xl font-bold text-purple-600' :
                            word.value > maxVal * 0.4 ? 'text-lg font-semibold text-pink-500' :
                            'text-sm text-gray-500';

                        return (
                            <button
                                key={i}
                                onClick={() => navigate(`/journal?tab=history&search=${encodeURIComponent(word.text)}`)}
                                className={`${sizeClass} transition-all hover:scale-110 cursor-pointer px-2 py-1 rounded-lg hover:bg-indigo-50 focus:outline-none`}
                                title={`Search for "${word.text}"`}
                            >
                                {word.text}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>

        {/* FILTER MODAL */}
        <ManageWordCloudModal 
            isOpen={isFilterModalOpen} 
            onClose={() => setIsFilterModalOpen(false)}
            blockedWords={userBlockList}
            onAddWord={handleAddBlockWord}
            onRemoveWord={handleRemoveBlockWord}
        />
    </div>
  );
}
"""

journal_ts = r"""import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import { db } from "./firebase";
import type { WeatherData } from "./weather";

export interface JournalEntry {
  id?: string;
  uid: string;
  content: string;
  tags: string[];
  moodScore: number;
  weather?: WeatherData | null;
  createdAt: Date;
}

const COLLECTION = 'journals';

// 1. CREATE
export async function addJournalEntry(
  uid: string, 
  content: string, 
  moodScore: number, 
  tags: string[],
  weather: WeatherData | null
) {
  if (!db) throw new Error("Database not initialized");
  
  await addDoc(collection(db, COLLECTION), {
    uid,
    content,
    tags,
    moodScore,
    weather: weather || null, 
    createdAt: Timestamp.now()
  });
}

// 2. READ
export async function getUserJournals(uid: string) {
  if (!db) throw new Error("Database not initialized");

  const q = query(
    collection(db, COLLECTION),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate()
  })) as JournalEntry[];
}

// 3. UPDATE (New)
export async function updateJournalEntry(
  id: string,
  content: string, 
  moodScore: number, 
  tags: string[]
) {
  if (!db) throw new Error("Database not initialized");
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    content,
    moodScore,
    tags,
    // We do NOT update createdAt or weather, as those are historical facts
  });
}

// 4. DELETE
export async function deleteJournalEntry(id: string) {
  if (!db) throw new Error("Database not initialized");
  await deleteDoc(doc(db, COLLECTION, id));
}
"""

urge_surfer = r"""import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useJournalOperations } from '../hooks/useJournalOperations';
import { useEncryption } from '../contexts/EncryptionContext';
import { useWakeLock } from '../hooks/useWakeLock';
import { useQueryClient } from '@tanstack/react-query';
import VibrantHeader from '../components/VibrantHeader';
import { 
    PuzzlePieceIcon, 
    PlayIcon, 
    ArrowPathIcon,
    CheckCircleIcon,
    ShieldExclamationIcon,
    EyeIcon,
    HandRaisedIcon,
    SpeakerWaveIcon,
    SparklesIcon,
    FaceSmileIcon
} from '@heroicons/react/24/outline';

const SURF_DURATION_SECONDS = 300; // 5 minutes

export default function UrgeSurfer() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addJournal } = useJournalOperations();
    const { encrypt, isVaultUnlocked } = useEncryption();
    const { requestWakeLock, releaseWakeLock } = useWakeLock();
    const queryClient = useQueryClient();

    const [status, setStatus] = useState<'idle' | 'surfing' | 'completed'>('idle');
    const [timeLeft, setTimeLeft] = useState(SURF_DURATION_SECONDS);
    const [reflection, setReflection] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // --- SMART MOOD INFERENCE ---
    const getSmartMood = () => {
        if (!user) return 5;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cache = queryClient.getQueryData<any[]>(['journals', user.uid]);
        if (!cache || cache.length === 0) return 5;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recent = cache.filter((e: any) => typeof e.moodScore === 'number' && e.moodScore > 0).slice(0, 7);
        if (recent.length === 0) return 5;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sum = recent.reduce((acc: number, curr: any) => acc + (curr.moodScore || 0), 0);
        return Math.round(sum / recent.length);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            releaseWakeLock();
        };
    }, [releaseWakeLock]);

    const startSurfing = () => {
        setStatus('surfing');
        setTimeLeft(SURF_DURATION_SECONDS);
        requestWakeLock();

        if (timerRef.current) clearInterval(timerRef.current);
        
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setStatus('completed');
                    releaseWakeLock();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        
        const plainContent = `**Urge Surfing Completed**\n\n*Reflection:*\n${reflection || "No reflection provided. But I rode the wave."}`;
        
        let contentToSave = plainContent;
        let isEncrypted = false;
        
        // Security Fallback: If David uses this during a crisis while locked, we save in plain text 
        // to prioritize his mental health recording over strict encryption.
        if (isVaultUnlocked) {
            try {
                contentToSave = await encrypt(plainContent);
                isEncrypted = true;
            } catch (err) {
                console.warn("Failed to encrypt during crisis log", err);
                contentToSave = `[Saved unencrypted during crisis]\n${plainContent}`;
            }
        } else {
            contentToSave = `[Saved unencrypted during crisis]\n${plainContent}`;
        }

        try {
            await addJournal({
                content: contentToSave,
                moodScore: getSmartMood(),
                sentiment: 'Pending',
                weather: null,
                tags: ['Urge Surfer', 'Crisis Avoided', 'Vitality'],
                isEncrypted
            });
            navigate('/dashboard');
        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save log.");
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate dynamic phase
    const getPhase = () => {
        if (timeLeft > 240) return { title: 'Find 5 things you can see', desc: 'Look around you. Notice the colors, shadows, and shapes.', icon: EyeIcon, color: 'text-sky-400' };
        if (timeLeft > 180) return { title: 'Find 4 things you can touch', desc: 'Notice the texture of your clothes, the chair, or the floor.', icon: HandRaisedIcon, color: 'text-indigo-400' };
        if (timeLeft > 120) return { title: 'Find 3 things you can hear', desc: 'Listen closely. Traffic? A hum? Your own breath?', icon: SpeakerWaveIcon, color: 'text-violet-400' };
        if (timeLeft > 60) return { title: 'Find 2 things you can smell', desc: 'Take a deep breath through your nose. What do you notice?', icon: SparklesIcon, color: 'text-purple-400' };
        return { title: 'Find 1 thing you can taste', desc: 'Focus on the physical sensation in your mouth right now.', icon: FaceSmileIcon, color: 'text-fuchsia-400' };
    };

    const phase = getPhase();
    const progressPercent = ((SURF_DURATION_SECONDS - timeLeft) / SURF_DURATION_SECONDS) * 100;

    return (
        <div className="min-h-screen flex flex-col bg-slate-900 text-white font-sans selection:bg-indigo-500/30 relative overflow-hidden">
            
            {/* Background Atmosphere */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            
            <div className="flex-shrink-0 z-10">
                <VibrantHeader 
                    title="Urge Surfer" 
                    subtitle="5-4-3-2-1 Grounding" 
                    icon={PuzzlePieceIcon}
                    fromColor="from-slate-800/50"
                    viaColor="via-indigo-900/50"
                    toColor="to-slate-900/50"
                    backLink="/dashboard"
                />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-20 w-full max-w-md mx-auto -mt-12">
                
                {status === 'idle' && (
                    <div className="text-center animate-fadeIn space-y-8">
                        <div className="bg-indigo-500/20 p-6 rounded-full inline-block border border-indigo-400/30 shadow-lg shadow-indigo-500/20">
                            <ShieldExclamationIcon className="h-16 w-16 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black mb-3 text-white tracking-tight">Ride the Wave</h2>
                            <p className="text-indigo-200 text-sm leading-relaxed px-4">
                                Cravings are like ocean waves. They build, peak, and inevitably crash. They do not last forever. Let's ride this one out together for 5 minutes using the 5-4-3-2-1 grounding technique.
                            </p>
                        </div>
                        <button 
                            onClick={startSurfing}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <PlayIcon className="h-6 w-6" /> Begin Surfing
                        </button>
                    </div>
                )}

                {status === 'surfing' && (
                    <div className="w-full text-center animate-fadeIn flex flex-col items-center justify-center h-full space-y-12">
                        
                        <div className="relative flex items-center justify-center">
                            {/* Glowing Ring */}
                            <svg className="w-64 h-64 transform -rotate-90">
                                <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-700" />
                                <circle 
                                    cx="128" cy="128" r="120" 
                                    stroke="currentColor" strokeWidth="6" fill="transparent" 
                                    className="text-indigo-500 transition-all duration-1000 ease-linear"
                                    strokeDasharray={2 * Math.PI * 120}
                                    strokeDashoffset={(2 * Math.PI * 120) * (1 - progressPercent / 100)}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <div className="text-5xl font-black text-white tabular-nums tracking-tighter">
                                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                </div>
                            </div>
                        </div>

                        <div className="h-32 flex flex-col items-center justify-center transition-all duration-500">
                            <phase.icon className={`h-10 w-10 ${phase.color} mb-4 animate-bounce`} />
                            <h3 className="text-xl font-bold text-white mb-2">{phase.title}</h3>
                            <p className="text-sm text-indigo-200">{phase.desc}</p>
                        </div>

                    </div>
                )}

                {status === 'completed' && (
                    <div className="w-full animate-slideUp space-y-6">
                        <div className="text-center">
                            <div className="bg-emerald-500/20 p-4 rounded-full inline-block border border-emerald-400/30 mb-4 shadow-lg shadow-emerald-500/20">
                                <CheckCircleIcon className="h-12 w-12 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2">The wave has passed.</h2>
                            <p className="text-emerald-100 text-sm">You stayed safe. Take a moment to reflect on how you feel now.</p>
                        </div>

                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                            <textarea 
                                value={reflection}
                                onChange={(e) => setReflection(e.target.value)}
                                placeholder="My craving intensity right now is..."
                                rows={4}
                                className="w-full bg-transparent border-none text-white placeholder:text-slate-500 focus:ring-0 resize-none text-sm"
                            />
                        </div>

                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? <ArrowPathIcon className="h-6 w-6 animate-spin" /> : <CheckCircleIcon className="h-6 w-6" />}
                            Log Victory & Save
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
"""

write_file("src/components/admin/ErrorLogViewer.tsx", error_log_viewer)
write_file("src/components/admin/FeedbackViewer.tsx", feedback_viewer)
write_file("src/components/journal/JournalInsights.tsx", journal_insights)
write_file("src/lib/journal.ts", journal_ts)
write_file("src/pages/UrgeSurfer.tsx", urge_surfer)