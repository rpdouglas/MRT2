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
    ChartBarIcon
} from '@heroicons/react/24/outline';

// Define strict shape for data processing
interface ChartDataPoint {
    date: string;
    mood: number;
}

// FIX: Added index signature to satisfy Recharts strict typing
interface SentimentDataPoint {
    name: string;
    value: number;
    [key: string]: unknown; 
}

const COLORS = ['#10B981', '#6366F1', '#F43F5E']; // Green, Indigo, Rose

export default function JournalInsights() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avgMood: 0 });

  useEffect(() => {
    async function loadData() {
        if (!user || !db) return;

        try {
            // Fetch last 30 days of entries
            const q = query(
                collection(db, 'journals'), 
                where('uid', '==', user.uid),
                orderBy('createdAt', 'asc') // Oldest first for the chart X-Axis
            );
            
            const snapshot = await getDocs(q);
            const rawData = snapshot.docs.map(d => d.data());

            // 1. Process Mood Trends
            const trends: ChartDataPoint[] = rawData
                .filter(d => d.moodScore !== undefined)
                .map(d => ({
                    date: d.createdAt?.toDate 
                        ? d.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
                        : 'Unknown',
                    mood: d.moodScore
                }))
                .slice(-14); // Last 14 entries for cleaner chart
            
            setChartData(trends);

            // 2. Process Sentiment Pie
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

            // 3. Stats
            const totalMood = rawData.reduce((sum, curr) => sum + (curr.moodScore || 0), 0);
            setStats({
                total: rawData.length,
                avgMood: rawData.length > 0 ? Math.round((totalMood / rawData.length) * 10) / 10 : 0
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
        
        {/* --- STATS ROW --- */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50 flex flex-col items-center justify-center">
                <div className="text-3xl font-black text-indigo-600">{stats.total}</div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Entries</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-50 flex flex-col items-center justify-center">
                <div className="text-3xl font-black text-purple-600">{stats.avgMood}</div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Avg Mood</div>
            </div>
        </div>

        {/* --- MOOD TREND CHART --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-50">
            <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-6 text-sm uppercase tracking-wide">
                <ChartBarIcon className="h-4 w-4 text-indigo-500" />
                Mood Trajectory (Last 14)
            </h3>
            
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
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
                        <YAxis 
                            domain={[0, 10]} 
                            hide 
                        />
                        <Tooltip 
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="mood" 
                            stroke="#6366F1" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorMood)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* --- SENTIMENT PIE --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-50">
            <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-6 text-sm uppercase tracking-wide">
                <FaceSmileIcon className="h-4 w-4 text-emerald-500" />
                Emotional Balance
            </h3>

            <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
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
                            {/* FIX: Replaced unused 'entry' var with '_' */}
                            {sentimentData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                
                {/* Center Label Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="text-center">
                         <div className="text-xs text-gray-400 font-bold uppercase">Total</div>
                         <div className="text-xl font-black text-gray-800">{stats.total}</div>
                     </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-4">
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