/**
 * src/components/journal/JournalInsights.tsx
 * GITHUB COMMENT:
 * [JournalInsights.tsx]
 * REFACTOR: Implemented Client-Side Aggregation for Daily Averages.
 * FEATURE: Added Dual-Axis ComposedChart (Mood Line + Weather Bar).
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
    FaceSmileIcon, 
    ChartBarIcon, 
    CloudIcon, 
    FireIcon 
} from '@heroicons/react/24/outline';

// --- TYPES ---

// Aggregated Daily Data
interface DailyStats {
    date: string; // YYYY-MM-DD
    displayDate: string; // "Oct 12"
    avgMood: number;
    avgTemp: number;
    entryCount: number;
}

interface SentimentDataPoint {
    name: string;
    value: number;
    [key: string]: unknown; 
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

const COLORS = ['#10B981', '#6366F1', '#F43F5E', '#F59E0B', '#8B5CF6'];

// Stop words to filter out of the cloud
const STOP_WORDS = new Set([
  'the', 'and', 'i', 'to', 'a', 'of', 'in', 'was', 'my', 'that', 'for', 'it', 'me', 'on', 
  'with', 'but', 'is', 'this', 'have', 'be', 'so', 'not', 'at', 'as', 'today', 'day', 
  'feeling', 'feel', 'am', 'just', 'had', 'very', 'really', 'will', 'up', 'out', 'from'
]);

export default function JournalInsights() {
  const { user } = useAuth();
  
  // State
  const [chartData, setChartData] = useState<DailyStats[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentDataPoint[]>([]);
  const [wordCloudData, setWordCloudData] = useState<WordFrequency[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avgMood: 0, streak: 0 });

  useEffect(() => {
    async function loadData() {
        if (!user || !db) return;

        try {
            // Fetch last 60 days
            const q = query(
                collection(db, 'journals'), 
                where('uid', '==', user.uid),
                orderBy('createdAt', 'asc') // Oldest first for chronological aggregation
            );
            
            const snapshot = await getDocs(q);
            const rawData = snapshot.docs.map(d => d.data() as JournalEntryRaw);

            // --- 1. AGGREGATION ENGINE (Daily Averages) ---
            const groupedData = new Map<string, { moodSum: number; moodCount: number; tempSum: number; tempCount: number, timestamp: Date }>();

            rawData.forEach(entry => {
                if (!entry.createdAt) return;
                
                const dateObj = entry.createdAt.toDate();
                // Format YYYY-MM-DD using local time to keep daily buckets correct
                const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

                if (!groupedData.has(dateKey)) {
                    groupedData.set(dateKey, { moodSum: 0, moodCount: 0, tempSum: 0, tempCount: 0, timestamp: dateObj });
                }

                const dayStat = groupedData.get(dateKey)!;

                // Aggregate Mood
                if (entry.moodScore !== undefined) {
                    dayStat.moodSum += entry.moodScore;
                    dayStat.moodCount += 1;
                }

                // Aggregate Weather
                if (entry.weather && entry.weather.temp !== undefined) {
                    dayStat.tempSum += entry.weather.temp;
                    dayStat.tempCount += 1;
                }
            });

            // Flatten Map to Array for Recharts
            const dailyStats: DailyStats[] = Array.from(groupedData.entries()).map(([key, stat]) => {
                const avgMood = stat.moodCount > 0 ? parseFloat((stat.moodSum / stat.moodCount).toFixed(1)) : 0;
                const avgTemp = stat.tempCount > 0 ? Math.round(stat.tempSum / stat.tempCount) : 0;
                
                return {
                    date: key,
                    displayDate: stat.timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    avgMood,
                    avgTemp,
                    entryCount: stat.moodCount
                };
            });

            // Slice last 14 active days for the chart
            setChartData(dailyStats.slice(-14));

            // --- 2. SENTIMENT ANALYSIS (PIE) ---
            const sentiments = rawData.reduce((acc: Record<string, number>, curr) => {
                const s = curr.sentiment || 'Neutral';
                acc[s] = (acc[s] || 0) + 1;
                return acc;
            }, {});
            
            setSentimentData(Object.keys(sentiments).map(key => ({
                name: key,
                value: sentiments[key]
            })));

            // --- 3. WORD CLOUD ---
            const textContent = rawData.map(d => d.content?.toLowerCase() || '').join(' ');
            const words = textContent.match(/\b\w+\b/g) || [];
            const frequency: Record<string, number> = {};
            
            words.forEach(word => {
                if (!STOP_WORDS.has(word) && word.length > 3) {
                    frequency[word] = (frequency[word] || 0) + 1;
                }
            });

            const topWords = Object.entries(frequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([text, value]) => ({ text, value }));
            
            setWordCloudData(topWords);

            // --- 4. GENERAL STATS ---
            const totalMood = rawData.reduce((sum, curr) => sum + (curr.moodScore || 0), 0);
            
            setStats({
                total: rawData.length,
                avgMood: rawData.length > 0 ? Math.round((totalMood / rawData.length) * 10) / 10 : 0,
                streak: rawData.length // Placeholder for simple count
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

        {/* --- DUAL AXIS CHART: MOOD vs WEATHER --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-50">
            <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-6 text-sm uppercase tracking-wide">
                <ChartBarIcon className="h-4 w-4 text-indigo-500" />
                Mood vs. Weather
            </h3>
            
            <div className="h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" debounce={200}>
                    <ComposedChart data={chartData} margin={{ top: 20, right: 0, bottom: 0, left: -20 }}>
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
                        
                        {/* LEFT AXIS: Mood (1-10) */}
                        <YAxis yAxisId="left" domain={[0, 10]} hide />
                        
                        {/* RIGHT AXIS: Temperature (-10 to 40) */}
                        <YAxis yAxisId="right" orientation="right" hide domain={['auto', 'auto']} />

                        <Tooltip 
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} 
                            labelStyle={{fontSize: '12px', fontWeight: 'bold', color: '#475569'}}
                        />
                        <Legend wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} />

                        {/* Bar: Temperature */}
                        <Bar yAxisId="right" dataKey="avgTemp" name="Temp (°C)" fill="#FDBA74" radius={[4, 4, 0, 0]} barSize={20} />

                        {/* Line: Mood */}
                        <Line yAxisId="left" type="monotone" dataKey="avgMood" name="Mood" stroke="#6366F1" strokeWidth={3} dot={{r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#fff'}} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* --- WORD CLOUD (Recurring Themes) --- */}
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

        {/* --- SENTIMENT PIE --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-50">
            <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-6 text-sm uppercase tracking-wide">
                <FaceSmileIcon className="h-4 w-4 text-emerald-500" />
                Emotional Balance
            </h3>

            <div className="h-64 w-full relative min-w-0">
                <ResponsiveContainer width="100%" height="100%" debounce={200}>
                    <PieChart>
                        <Pie
                            data={sentimentData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {sentimentData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                
                {/* Center Label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                          <div className="text-xs text-gray-400 font-bold uppercase">Total</div>
                          <div className="text-xl font-black text-gray-800">{stats.total}</div>
                      </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
                {sentimentData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-xs font-medium text-gray-600">{entry.name}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}