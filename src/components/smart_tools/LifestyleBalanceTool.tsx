/**
 * src/components/smart_tools/LifestyleBalanceTool.tsx
 * PROJ-27: The CBT Engine
 * Interactive Wheel of Life chart mapped to the LifestyleBalancePayload.
 */

import React from 'react';
import { SmartToolContainer } from './SmartToolContainer';
import { InformationCircleIcon, ChartPieIcon } from '@heroicons/react/24/outline';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import type { LifestyleBalancePayload } from '../../lib/types/smart';

const EXPLANATION = "The Lifestyle Balance Pie (Wheel of Life) helps identify areas of neglect. Imagine your life as a tire: if one section is a '1' and another is a '10', the tire is flat and the ride is bumpy. A bumpy ride creates stress, making you vulnerable to relapse. Aim for a well-rounded shape rather than a jagged one.";

interface CategoryDef { key: keyof LifestyleBalancePayload; label: string; description: string; color: string; }

const CATEGORIES: CategoryDef[] = [
    { key: 'physical', label: 'Physical', description: 'Exercise, sleep, diet, medical care.', color: 'text-rose-500' },
    { key: 'mental', label: 'Mental', description: 'Stress management, emotional regulation.', color: 'text-indigo-500' },
    { key: 'relationships', label: 'Relationships', description: 'Family, friends, community support.', color: 'text-emerald-500' },
    { key: 'work', label: 'Work/Purpose', description: 'Career, education, meaningful duties.', color: 'text-amber-500' },
    { key: 'spiritual', label: 'Spiritual', description: 'Values, connection to a higher purpose.', color: 'text-purple-500' },
    { key: 'leisure', label: 'Leisure', description: 'Hobbies, fun, relaxation without substances.', color: 'text-sky-500' }
];

export const LifestyleBalanceTool: React.FC = () => {
    // Defaulting to 5 gives a perfect, albeit small, circle to start.
    const initialData: LifestyleBalancePayload = {
        physical: 5,
        mental: 5,
        relationships: 5,
        work: 5,
        spiritual: 5,
        leisure: 5
    };

    const formatChartData = (data: LifestyleBalancePayload) => { return CATEGORIES.map(cat => ({ subject: cat.label, score: data[cat.key], fullMark: 10 }));
    };

    return (
        <SmartToolContainer<LifestyleBalancePayload>
            toolType="LIFESTYLE_BALANCE"
            toolLabel="Lifestyle Balance"
            initialData={initialData}
            resumeSession={true} // Fetch the user's last saved pie chart
        >
            {({ data, updateData }) => (
                <div className="space-y-6 pb-12 max-w-5xl mx-auto">
                    
                    {/* Header Explanation */}
                    <div className="bg-cyan-50/80 backdrop-blur-md p-6 rounded-3xl border border-cyan-100 shadow-sm flex items-start gap-3 text-cyan-900">
                        <InformationCircleIcon className="w-6 h-6 text-cyan-600 shrink-0 mt-0.5" />
                        <p className="text-sm sm:text-base leading-relaxed font-medium">
                            {EXPLANATION}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        
                        {/* CHART VISUALIZATION */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center aspect-square lg:aspect-auto lg:h-full min-h-[350px]">
                            <div className="flex items-center gap-2 mb-4 w-full">
                                <ChartPieIcon className="h-6 w-6 text-cyan-500" />
                                <h3 className="font-bold text-slate-800 text-lg">The Wheel of Life</h3>
                            </div>
                            <div className="flex-1 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={formatChartData(data)}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis 
                                            dataKey="subject" 
                                            tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} 
                                        />
                                        <PolarRadiusAxis 
                                            angle={30} 
                                            domain={[0, 10]} 
                                            tick={{ fill: '#94a3b8', fontSize: 10 }} 
                                            tickCount={6}
                                        />
                                        <Radar 
                                            name="Balance" 
                                            dataKey="score" 
                                            stroke="#06b6d4" 
                                            fill="#06b6d4" 
                                            fillOpacity={0.5} 
                                            activeDot={{ r: 6, fill: '#0891b2', stroke: '#fff', strokeWidth: 2 }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* SLIDER INPUTS */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg mb-1">Adjust Your Balance</h3>
                                <p className="text-xs text-slate-500 mb-6">Rate your current satisfaction in each area from 1 to 10.</p>
                            </div>

                            <div className="space-y-5">
                                {CATEGORIES.map(cat => (
                                    <div key={cat.key} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <label className={`text-sm font-bold ${cat.color}`}>{cat.label}</label>
                                                <p className="text-[10px] text-slate-400 font-medium">{cat.description}</p>
                                            </div>
                                            <span className="text-lg font-black text-slate-700 w-6 text-right">
                                                {data[cat.key]}
                                            </span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="1" 
                                            max="10" 
                                            value={data[cat.key]} 
                                            onChange={(e) => updateData({ [cat.key]: parseInt(e.target.value, 10) })}
                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-600 transition-all"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </SmartToolContainer>
    );
};
