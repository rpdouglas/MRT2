/**
 * src/components/smart_tools/CBATool.tsx
 * PROJ-27: The CBT Engine
 * Modernized Cost Benefit Analysis (CBA) tool with responsive Bento Grid UI.
 */

import React, { useState } from 'react';
import { SmartToolContainer } from './SmartToolContainer';
import { PlusIcon, TrashIcon, InformationCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import type { CBAPayload } from '../../lib/types/smart';

const EXPLANATION = "The Cost Benefit Analysis (CBA) helps you see the 'big picture' of your addictive behavior. By weighing short and long-term pros and cons, you move from 'feeling' you should quit to 'knowing' why you must.";

const WALKTHROUGH = [
    { title: "Define", desc: "Type the specific behavior you are analyzing (e.g., 'Drinking', 'Isolating')." },
    { title: "Fill", desc: "List the Advantages/Disadvantages of both using and stopping." },
    { title: "Review", desc: "Seeing the costs of using pile up reinforces your recovery motivation." }
];

interface QuadrantProps {
    title: string;
    items: string[];
    onAdd: (text: string) => void;
    onRemove: (index: number) => void;
    accentColor: 'emerald' | 'rose' | 'sky' | 'orange';
}

const CBAQuadrant: React.FC<QuadrantProps> = ({ title, items, onAdd, onRemove, accentColor }) => {
    const [input, setInput] = useState('');

    const handleAdd = () => {
        if (input.trim()) {
            onAdd(input.trim());
            setInput('');
        }
    };

    const colorClasses = {
        emerald: "bg-emerald-50/50 border-emerald-100 text-emerald-900 ring-emerald-500",
        rose: "bg-rose-50/50 border-rose-100 text-rose-900 ring-rose-500",
        sky: "bg-sky-50/50 border-sky-100 text-sky-900 ring-sky-500",
        orange: "bg-orange-50/50 border-orange-100 text-orange-900 ring-orange-500"
    };

    const buttonClasses = {
        emerald: "bg-emerald-600 hover:bg-emerald-700",
        rose: "bg-rose-600 hover:bg-rose-700",
        sky: "bg-sky-600 hover:bg-sky-700",
        orange: "bg-orange-600 hover:bg-orange-700"
    };

    return (
        <div className={`p-5 rounded-2xl border backdrop-blur-sm shadow-sm flex flex-col h-full ${colorClasses[accentColor]}`}>
            <h4 className="font-bold text-sm uppercase tracking-tight mb-4 flex items-center gap-2">
                <span className={`w-1.5 h-4 rounded-full ${buttonClasses[accentColor]}`} />
                {title}
            </h4>
            
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Add factor..."
                    className="flex-1 bg-white/80 border-none rounded-xl p-2.5 text-sm focus:ring-2 placeholder-slate-400"
                />
                <button 
                    onClick={handleAdd}
                    className={`p-2.5 rounded-xl text-white transition-all shadow-sm ${buttonClasses[accentColor]}`}
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>

            <ul className="space-y-2 overflow-y-auto max-h-64 pr-1 custom-scrollbar">
                {items.map((item, idx) => (
                    <li key={idx} className="group flex justify-between items-start gap-3 bg-white/60 p-3 rounded-xl border border-white/40 animate-in fade-in slide-in-from-left-2">
                        <span className="text-sm leading-relaxed">{item}</span>
                        <button 
                            onClick={() => onRemove(idx)}
                            className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </li>
                ))}
                {items.length === 0 && (
                    <p className="text-xs italic text-slate-400 text-center py-4">No items added yet</p>
                )}
            </ul>
        </div>
    );
};

export const CBATool: React.FC = () => {
    const initialData: CBAPayload = {
        behavior: '',
        advantagesDoing: [],
        disadvantagesDoing: [],
        advantagesStopping: [],
        disadvantagesStopping: []
    };

    return (
        <SmartToolContainer<CBAPayload>
            toolType="CBA"
            toolLabel="Cost Benefit Analysis"
            initialData={initialData}
        >
            {({ data, updateData }) => (
                <div className="space-y-8 pb-12">
                    {/* Guidance Header */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 bg-white/60 p-6 rounded-3xl border border-white shadow-sm">
                            <div className="flex items-start gap-3 mb-4 text-slate-800">
                                <InformationCircleIcon className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-sm leading-relaxed font-medium">{EXPLANATION}</p>
                            </div>
                            <input
                                type="text"
                                value={data.behavior}
                                onChange={(e) => updateData({ behavior: e.target.value })}
                                placeholder="What behavior are we analyzing? (e.g. Drinking, Isolating)"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-lg font-semibold focus:border-blue-400 focus:ring-0 transition-all placeholder-slate-300"
                            />
                        </div>
                        
                        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
                            <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <LightBulbIcon className="w-4 h-4" /> Quick Steps
                            </h5>
                            <div className="space-y-4">
                                {WALKTHROUGH.map((step, i) => (
                                    <div key={i} className="flex gap-3">
                                        <span className="text-blue-400 font-black text-sm italic">{i + 1}</span>
                                        <div>
                                            <p className="font-bold text-xs">{step.title}</p>
                                            <p className="text-[10px] text-slate-400 leading-tight">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* The Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <CBAQuadrant 
                            title="Advantages of Doing"
                            items={data.advantagesDoing}
                            accentColor="emerald"
                            onAdd={(text) => updateData({ advantagesDoing: [...data.advantagesDoing, text] })}
                            onRemove={(idx) => updateData({ advantagesDoing: data.advantagesDoing.filter((_, i) => i !== idx) })}
                        />
                        <CBAQuadrant 
                            title="Disadvantages of Doing"
                            items={data.disadvantagesDoing}
                            accentColor="rose"
                            onAdd={(text) => updateData({ disadvantagesDoing: [...data.disadvantagesDoing, text] })}
                            onRemove={(idx) => updateData({ disadvantagesDoing: data.disadvantagesDoing.filter((_, i) => i !== idx) })}
                        />
                        <CBAQuadrant 
                            title="Advantages of Stopping"
                            items={data.advantagesStopping}
                            accentColor="sky"
                            onAdd={(text) => updateData({ advantagesStopping: [...data.advantagesStopping, text] })}
                            onRemove={(idx) => updateData({ advantagesStopping: data.advantagesStopping.filter((_, i) => i !== idx) })}
                        />
                        <CBAQuadrant 
                            title="Disadvantages of Stopping"
                            items={data.disadvantagesStopping}
                            accentColor="orange"
                            onAdd={(text) => updateData({ disadvantagesStopping: [...data.disadvantagesStopping, text] })}
                            onRemove={(idx) => updateData({ disadvantagesStopping: data.disadvantagesStopping.filter((_, i) => i !== idx) })}
                        />
                    </div>
                </div>
            )}
        </SmartToolContainer>
    );
};
