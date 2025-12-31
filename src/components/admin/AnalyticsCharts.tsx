/**
 * src/components/admin/AnalyticsCharts.tsx
 * GITHUB COMMENT:
 * [AnalyticsCharts.tsx]
 * REFACTOR: Extracted chart logic from AdminDashboard.
 * PURPOSE: Visualizes AI token usage and model distribution.
 */
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
import { Timestamp } from 'firebase/firestore';

export interface AIUsageLog {
    id: string;
    model: string;
    timestamp: Timestamp;
    usage: {
        totalTokens: number;
        promptTokens: number;
        candidatesTokens: number;
    };
}

interface AnalyticsChartsProps {
    logs: AIUsageLog[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

export default function AnalyticsCharts({ logs }: AnalyticsChartsProps) {
    
    // 1. Process Model Distribution (Pie)
    const modelData = logs.reduce((acc, log) => {
        const existing = acc.find(i => i.name === log.model);
        if (existing) {
            existing.value += 1;
        } else {
            acc.push({ name: log.model, value: 1 });
        }
        return acc;
    }, [] as { name: string; value: number }[]);

    // 2. Process Token Usage (Bar) - Recent 20 logs
    const tokenData = logs.slice(0, 20).reverse().map(log => ({
        // Safe check for timestamp in case of raw data issues
        name: log.timestamp?.toDate 
            ? new Date(log.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            : 'N/A',
        tokens: log.usage.totalTokens,
        model: log.model
    }));

    const totalTokens = logs.reduce((sum, log) => sum + log.usage.totalTokens, 0);

    if (logs.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center text-gray-500">
                No AI usage logs found yet. Use the app to generate some data.
            </div>
        );
    }

    return (
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
    );
}