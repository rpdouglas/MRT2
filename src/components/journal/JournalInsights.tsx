/**
 * src/components/journal/JournalInsights.tsx
 * GITHUB COMMENT:
 * [JournalInsights.tsx]
 * CHORE: Removed Sentiment Flow chart and logic per backlog decision.
 * MAINTAINED: Weekly Rhythm, Daily Trends (Mood/Weather), and Word Cloud.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { 
  ComposedChart, 
  Line, 
  Bar, 
  BarChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { 
    ChartBarIcon, 
    CloudIcon, 
    FireIcon,
    CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { format, getDay } from 'date-fns';

// --- TYPES ---

// 1. Daily Stats (Mood vs Weather)
interface DailyStats {
    date: string; // YYYY-MM-DD
    displayDate: string; // "Oct 12"
    avgMood: number;
    avgTemp: number;
    entryCount: number;
}

// 2. Weekly Rhythm (Cyclic Patterns)
interface WeeklyRhythmStats {
    dayName: string; // "Mon", "Tue"
    totalMood: number;
    count: number;
    average: number;
}

interface WordFrequency {
    text: string;
    value: number;
}

interface JournalEntryRaw {
    moodScore?: number;
    weather?: { temp: number; condition: string } | null;
    createdAt: Timestamp;
    sentiment?: string; // Kept in type for compatibility, but ignored in logic
    content?: string;
}

// Stop words to filter out of the cloud
const STOP_WORDS = new Set([
  'the', 'and', 'i', 'to', 'a', 'of', 'in', 'was', 'my', 'that', 'for', 'it', 'me', 'on', 
  'with', 'but', 'is', 'this', 'have', 'be', 'so', 'not', 'at', 'as', 'today', 'day', 
  'feeling', 'feel', 'am', 'just', 'had', 'very', 'really', 'will', 'up', 'out', 'from'
]);

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function JournalInsights() {
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avgMood: 0, streak: 0 });
  
  // Chart Data States
  const [dailyTrendData, setDailyTrendData] = useState<DailyStats[]>([]);
  const [weeklyRhythmData, setWeeklyRhythmData] = useState<WeeklyRhythmStats[]>([]);
  const [wordCloudData, setWordCloudData] = useState<WordFrequency[]>([]);

  useEffect(() => {
    async function loadData() {
        if (!user || !db) return;

        try {
            // Fetch last 90 days for robust analysis
            const q = query(
                collection(db, 'journals'), 
                where('uid', '==', user.uid),
                orderBy('createdAt', 'asc')
            );
            
            const snapshot = await getDocs(q);
            const rawData = snapshot.docs.map(d => d.data() as JournalEntryRaw);

            // --- AGGREGATION ENGINE ---

            // 1. Initialize Containers
            const dailyMap = new Map<string, { moodSum: number; moodCount: number; tempSum: number; tempCount: number, timestamp: Date }>();
            
            // Initialize 7 days for Weekly Rhythm (0=Sun -> 6=Sat)
            const weeklyBuckets = Array.from({ length: 7 }, (_, i) => ({
                dayName: DAYS_OF_WEEK[i],
                totalMood: 0,
                count: 0,
                average: 0
            }));

            // Word Cloud Container
            const wordFreq: Record<string, number> = {};

            // 2. Single Pass Processing
            let totalMoodSum = 0;
            let totalEntries = 0;

            rawData.forEach(entry => {
                if (!entry.createdAt) return;
                const dateObj = entry.createdAt.toDate();
                const dateKey = format(dateObj, 'yyyy-MM-dd');

                // --- A. Daily Trend Aggregation ---
                if (!dailyMap.has(dateKey)) {
                    dailyMap.set(dateKey, { moodSum: 0, moodCount: 0, tempSum: 0, tempCount: 0, timestamp: dateObj });
                }
                const dayStat = dailyMap.get(dateKey)!;

                if (entry.moodScore !== undefined) {
                    dayStat.moodSum += entry.moodScore;
                    dayStat.moodCount += 1;
                    
                    // Global Stats
                    totalMoodSum += entry.moodScore;
                    totalEntries++;

                    // --- B. Weekly Rhythm Aggregation ---
                    const dayIndex = getDay(dateObj); // 0 = Sun
                    weeklyBuckets[dayIndex].totalMood += entry.moodScore;
                    weeklyBuckets[dayIndex].count += 1;
                }

                if (entry.weather && entry.weather.temp !== undefined) {
                    dayStat.tempSum += entry.weather.temp;
                    dayStat.tempCount += 1;
                }

                // --- C. Word Cloud Processing ---
                if (entry.content) {
                    const words = entry.content.toLowerCase().match(/\b\w+\b/g) || [];
                    words.forEach(word => {
                        if (!STOP_WORDS.has(word) && word.length > 3) {
                            wordFreq[word] = (wordFreq[word] || 0) + 1;
                        }
                    });
                }
            });

            // 3. Finalize Data Structures

            // Daily Trend (Last 14 Active Days)
            const dailyStatsArray = Array.from(dailyMap.values()).map(stat => ({
                date: format(stat.timestamp, 'yyyy-MM-dd'),
                displayDate: format(stat.timestamp, 'MMM d'),
                avgMood: stat.moodCount > 0 ? parseFloat((stat.moodSum / stat.moodCount).toFixed(1)) : 0,
                avgTemp: stat.tempCount > 0 ? Math.round(stat.tempSum / stat.tempCount) : 0,
                entryCount: stat.moodCount
            })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            setDailyTrendData(dailyStatsArray.slice(-14));

            // Weekly Rhythm (Reorder to start Monday)
            // Shift Sunday (0) to end
            const sunday = weeklyBuckets.shift(); 
            if (sunday) weeklyBuckets.push(sunday);
            
            const finalizedWeekly = weeklyBuckets.map(b => ({
                ...b,
                average: b.count > 0 ? parseFloat((b.totalMood / b.count).toFixed(1)) : 0
            }));
            setWeeklyRhythmData(finalizedWeekly);

            // Word Cloud
            const topWords = Object.entries(wordFreq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([text, value]) => ({ text, value }));
            setWordCloudData(topWords);

            // Global Stats
            setStats({
                total: rawData.length,
                avgMood: totalEntries > 0 ? Math.round((totalMoodSum / totalEntries) * 10) / 10 : 0,
                streak: rawData.length // Placeholder
            });

        } catch (error) {
            console.error("Error loading insights:", error);
        } finally {
            setLoading(false);
        }
    }

    loadData();
  }, [user]);

  if (loading) return <div className="p-10 text-center text-gray-400 animate-pulse">Analyzing patterns...</div>;

  return (
    <div className="space-y-6 pb-20">
        
        {/* --- TOP STATS CARDS --- */}
        <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50 flex flex-col items-center justify-center">
                <div className="text-2xl font-black text-indigo-600">{stats.total}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Entries</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-50 flex flex-col items-center justify-center">
                <div className="text-2xl font-black text-purple-600">{stats.avgMood}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Avg Mood</div>
            </div>
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-50 flex flex-col items-center justify-center">
                <FireIcon className="h-6 w-6 text-orange-500 mb-1" />
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active</div>
            </div>
        </div>

        {/* --- 1. WEEKLY RHYTHM (Simple Bar) --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-50">
            <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-6 text-sm uppercase tracking-wide">
                <CalendarDaysIcon className="h-4 w-4 text-purple-500" />
                Weekly Rhythm
            </h3>
            
            <div className="h-48 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" debounce={200}>
                    <BarChart data={weeklyRhythmData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
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
                            // Fix: Use 'any' type for value to satisfy Recharts strict typing while we know it's a number
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any) => [value, 'Avg Mood']}
                        />
                        <Bar dataKey="average" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={24}>
                            {weeklyRhythmData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fillOpacity={entry.count > 0 ? 1 : 0.3} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">Average Mood Score by Day of Week</p>
        </div>

        {/* --- 2. MOOD vs WEATHER (Composed) --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-50">
            <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-6 text-sm uppercase tracking-wide">
                <ChartBarIcon className="h-4 w-4 text-indigo-500" />
                Daily Trends (Mood vs Weather)
            </h3>
            
            <div className="h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" debounce={200}>
                    <ComposedChart data={dailyTrendData} margin={{ top: 20, right: 0, bottom: 0, left: -20 }}>
                        <defs>
                            <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
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

                        <Bar yAxisId="right" dataKey="avgTemp" name="Temp (°C)" fill="#FDBA74" radius={[4, 4, 0, 0]} barSize={20} />
                        <Line yAxisId="left" type="monotone" dataKey="avgMood" name="Mood" stroke="#6366F1" strokeWidth={3} dot={{r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#fff'}} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* --- 3. WORD CLOUD --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-50">
            <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-6 text-sm uppercase tracking-wide">
                <CloudIcon className="h-4 w-4 text-blue-500" />
                Recurring Themes
            </h3>
            
            {wordCloudData.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Not enough data yet.</div>
            ) : (
                <div className="flex flex-wrap gap-2 justify-center items-center py-4">
                    {wordCloudData.map((word, i) => {
                        // Dynamic sizing based on frequency relative to max
                        const maxVal = wordCloudData[0].value;
                        const sizeClass = 
                            word.value > maxVal * 0.8 ? 'text-2xl font-black text-indigo-600' :
                            word.value > maxVal * 0.6 ? 'text-xl font-bold text-purple-600' :
                            word.value > maxVal * 0.4 ? 'text-lg font-semibold text-pink-500' :
                            'text-sm text-gray-500';

                        return (
                            <span key={i} className={`${sizeClass} transition-all hover:scale-110 cursor-default px-1`}>
                                {word.text}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
  );
}