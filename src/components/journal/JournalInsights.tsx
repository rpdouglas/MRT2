/**
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
