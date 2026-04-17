import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend 
} from 'recharts';

export interface AILogEntry {
    id?: string;
    uid: string;
    tier: 'free' | 'premium';
    model: string;
    tokensUsed: number;
    context: string;
    timestamp: Timestamp;
}

interface DailyTokenUsage {
    date: string;
    flash: number;
    pro: number;
    total: number;
}

interface ModelDistribution {
    name: string;
    value: number;
}

const COLORS = ['#8b5cf6', '#0ea5e9', '#f43f5e', '#10b981'];

export default function TelemetryDashboard() {
    const [logs, setLogs] = useState<AILogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                // 30-Day Bounded Query to strictly limit Firestore Read Costs
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                
                const q = query(
                    collection(db!, 'ai_logs'), 
                    where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo))
                );
                
                const snap = await getDocs(q);
                const data = snap.docs.map(doc => doc.data() as AILogEntry);
                setLogs(data);
            } catch (err) {
                console.error('Failed to fetch telemetry', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const chartData = useMemo(() => {
        const dailyMap = new Map<string, DailyTokenUsage>();
        let flashCount = 0;
        let proCount = 0;

        logs.forEach(log => {
            // Safe Date Normalization
            const dateStr = log.timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            if (!dailyMap.has(dateStr)) {
                dailyMap.set(dateStr, { date: dateStr, flash: 0, pro: 0, total: 0 });
            }
            const entry = dailyMap.get(dateStr)!;
            
            if (log.model.includes('flash')) {
                entry.flash += log.tokensUsed;
                flashCount += log.tokensUsed;
            } else {
                entry.pro += log.tokensUsed;
                proCount += log.tokensUsed;
            }
            entry.total += log.tokensUsed;
        });

        // Sort chronologically
        const daily = Array.from(dailyMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const distribution: ModelDistribution[] = [
            { name: 'Flash (Speed)', value: flashCount },
            { name: 'Pro (Reasoning)', value: proCount }
        ];

        return { daily, distribution, totalTokens: flashCount + proCount };
    }, [logs]);

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500 animate-pulse font-medium">Aggregating AI Telemetry...</div>;
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Command Center: AI Telemetry</h2>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">30-Day Bounded Scope</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-1">Total Token Burn</p>
                    <p className="text-4xl font-black text-slate-800">{chartData.totalTokens.toLocaleString()}</p>
                </div>
                {/* Future placeholders for Cost Est and Active Users */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Daily Token Velocity</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.daily}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="flash" name="Flash Tokens" stackId="a" fill="#0ea5e9" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="pro" name="Pro Tokens" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Model Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={chartData.distribution} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                                    {chartData.distribution.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
