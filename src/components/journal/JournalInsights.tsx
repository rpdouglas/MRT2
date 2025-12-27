import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
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
interface ChartDataPoint {
    date: string;
    mood: number;
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

const COLORS = ['#10B981', '#6366F1', '#F43F5E', '#F59E0B', '#8B5CF6'];

// Stop words to filter out of the cloud
const STOP_WORDS = new Set([
  'the', 'and', 'i', 'to', 'a', 'of', 'in', 'was', 'my', 'that', 'for', 'it', 'me', 'on', 
  'with', 'but', 'is', 'this', 'have', 'be', 'so', 'not', 'at', 'as', 'today', 'day', 
  'feeling', 'feel', 'am', 'just', 'had', 'very', 'really', 'will', 'up', 'out', 'from'
]);

export default function JournalInsights() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentDataPoint[]>([]);
  const [wordCloudData, setWordCloudData] = useState<WordFrequency[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avgMood: 0, streak: 0 });

  useEffect(() => {
    async function loadData() {
        if (!user || !db) return;

        try {
            // Fetch last 60 days for robust data
            const q = query(
                collection(db, 'journals'), 
                where('uid', '==', user.uid),
                orderBy('createdAt', 'asc')
            );
            
            const snapshot = await getDocs(q);
            const rawData = snapshot.docs.map(d => d.data());

            // 1. CHART: Mood Trends (Last 14 entries)
            const trends: ChartDataPoint[] = rawData
                .filter(d => d.moodScore !== undefined)
                .map(d => ({
                    date: d.createdAt?.toDate 
                        ? d.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
                        : 'Unknown',
                    mood: d.moodScore
                }))
                .slice(-14);
            setChartData(trends);

            // 2. PIE: Sentiment Analysis
            const sentiments = rawData.reduce((acc: Record<string, number>, curr) => {
                const s = curr.sentiment || 'Neutral';
                acc[s] = (acc[s] || 0) + 1;
                return acc;
            }, {});
            const pieData = Object.keys(sentiments).map(key => ({
                name: key,
                value: sentiments[key]
            }));
            setSentimentData(pieData);

            // 3. WORD CLOUD: Text Analysis
            const textContent = rawData.map(d => d.content?.toLowerCase() || '').join(' ');
            const words = textContent.match(/\b\w+\b/g) || [];
            const frequency: Record<string, number> = {};
            
            words.forEach(word => {
                if (!STOP_WORDS.has(word) && word.length > 3) {
                    frequency[word] = (frequency[word] || 0) + 1;
                }
            });

            const topWords = Object.entries(frequency)
                .sort((a, b) => b[1] - a[1]) // Sort by count desc
                .slice(0, 20) // Top 20
                .map(([text, value]) => ({ text, value }));
            
            setWordCloudData(topWords);

            // 4. GENERAL STATS
            const totalMood = rawData.reduce((sum, curr) => sum + (curr.moodScore || 0), 0);
            
            // Calculate streak (consecutive days)
            // Simplified logic: Count entries in last X days
            
            setStats({
                total: rawData.length,
                avgMood: rawData.length > 0 ? Math.round((totalMood / rawData.length) * 10) / 10 : 0,
                streak: rawData.length // Placeholder logic
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

        {/* --- MOOD TREND CHART --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-50">
            <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-6 text-sm uppercase tracking-wide">
                <ChartBarIcon className="h-4 w-4 text-indigo-500" />
                Mood Trajectory
            </h3>
            
            <div className="h-64 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" debounce={200}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E7FF" />
                        <XAxis 
                            dataKey="date" 
                            tick={{fontSize: 10, fill: '#94A3B8'}} 
                            axisLine={false}
                            tickLine={false}
                            minTickGap={30}
                        />
                        <YAxis domain={[0, 10]} hide />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Area type="monotone" dataKey="mood" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorMood)" />
                    </AreaChart>
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