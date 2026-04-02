/**
 * src/components/smart_tools/DentsTool.tsx
 * PROJ-27: The CBT Engine
 * Modernized D.E.N.T.S. Strategy tool using an Acronym Vertical Stack.
 */

import React from 'react';
import { SmartToolContainer } from './SmartToolContainer';
import { HandRaisedIcon, ArrowRightOnRectangleIcon, ShieldExclamationIcon, ClipboardDocumentCheckIcon, ArrowPathIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import type { DENTSPayload } from '../../lib/types/smart';

const EXPLANATION = "The D.E.N.T.S. strategy helps you pre-plan for high-risk situations (like a party or a stressful family gathering). Fill this out before you go, so you have a concrete escape and distraction plan if an urge strikes.";

interface StrategyCardProps {
    letter: string;
    title: string;
    description: string;
    value: string;
    onChange: (val: string) => void;
    icon: React.ElementType;
    colorTheme: 'rose' | 'orange' | 'amber' | 'emerald' | 'sky';
    placeholder: string;
}

const StrategyCard: React.FC<StrategyCardProps> = ({ 
    letter, title, description, value, onChange, icon: Icon, colorTheme, placeholder 
}) => {
    const themeStyles = {
        rose: "bg-rose-50 border-rose-200 text-rose-900 ring-rose-400 focus-within:border-rose-400 focus-within:ring-rose-200",
        orange: "bg-orange-50 border-orange-200 text-orange-900 ring-orange-400 focus-within:border-orange-400 focus-within:ring-orange-200",
        amber: "bg-amber-50 border-amber-200 text-amber-900 ring-amber-400 focus-within:border-amber-400 focus-within:ring-amber-200",
        emerald: "bg-emerald-50 border-emerald-200 text-emerald-900 ring-emerald-400 focus-within:border-emerald-400 focus-within:ring-emerald-200",
        sky: "bg-sky-50 border-sky-200 text-sky-900 ring-sky-400 focus-within:border-sky-400 focus-within:ring-sky-200"
    };

    const letterBgStyles = {
        rose: "bg-gradient-to-br from-rose-500 to-rose-700",
        orange: "bg-gradient-to-br from-orange-400 to-orange-600",
        amber: "bg-gradient-to-br from-amber-400 to-amber-600",
        emerald: "bg-gradient-to-br from-emerald-500 to-emerald-700",
        sky: "bg-gradient-to-br from-sky-400 to-sky-600"
    };

    return (
        <div className={`w-full flex flex-col sm:flex-row gap-4 p-5 sm:p-6 rounded-2xl border shadow-sm transition-all duration-300 ${themeStyles[colorTheme]}`}>
            {/* Acronym Letter Badge */}
            <div className={`w-16 h-16 shrink-0 rounded-2xl flex flex-col items-center justify-center text-white shadow-md ${letterBgStyles[colorTheme]}`}>
                <span className="text-3xl font-black leading-none drop-shadow-sm">{letter}</span>
                <Icon className="h-4 w-4 mt-1 opacity-80" />
            </div>
            
            {/* Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="mb-3">
                    <h3 className="font-bold text-lg leading-tight tracking-tight">{title}</h3>
                    <p className="text-xs sm:text-sm opacity-80 mt-0.5">{description}</p>
                </div>
                <textarea
                    rows={2}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-white/70 border border-black/10 rounded-xl p-3 text-sm focus:ring-4 focus:outline-none transition-all resize-y min-h-[80px] placeholder:text-black/30"
                />
            </div>
        </div>
    );
};

export const DentsTool: React.FC = () => { const initialData: DENTSPayload = { deny: '', escape: '', neutralize: '', tasks: '', swap: '' };

    return (
        <SmartToolContainer<DENTSPayload>
            toolType="DENTS"
            toolLabel="D.E.N.T.S. Strategy"
            initialData={initialData}
        >
            {({ data, updateData }) => (
                <div className="space-y-6 pb-12 max-w-3xl mx-auto">
                    
                    {/* Header Explanation */}
                    <div className="bg-amber-50/80 backdrop-blur-md p-6 rounded-3xl border border-amber-100 shadow-sm">
                        <div className="flex items-start gap-3 text-amber-900">
                            <InformationCircleIcon className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-sm sm:text-base leading-relaxed font-medium">
                                {EXPLANATION}
                            </p>
                        </div>
                    </div>

                    {/* The Acronym Vertical Stack */}
                    <div className="flex flex-col gap-4 w-full">
                        <StrategyCard 
                            letter="D"
                            title="Deny / Delay"
                            description="Refuse the urge right now. Tell yourself 'Not today, maybe tomorrow.' How will you delay?"
                            value={data.deny}
                            onChange={(val) => updateData({ deny: val })}
                            icon={HandRaisedIcon}
                            colorTheme="rose"
                            placeholder="e.g., I will promise myself to wait 24 hours before acting on any urge."
                        />
                        
                        <StrategyCard 
                            letter="E"
                            title="Escape"
                            description="Plan your physical exit strategy. If the situation gets too risky, how do you leave?"
                            value={data.escape}
                            onChange={(val) => updateData({ escape: val })}
                            icon={ArrowRightOnRectangleIcon}
                            colorTheme="orange"
                            placeholder="e.g., I'll say I have a family emergency and take an Uber home immediately."
                        />
                        
                        <StrategyCard 
                            letter="N"
                            title="Neutralize"
                            description="Who can you call to talk it out and defuse the craving?"
                            value={data.neutralize}
                            onChange={(val) => updateData({ neutralize: val })}
                            icon={ShieldExclamationIcon}
                            colorTheme="amber"
                            placeholder="e.g., I will step outside and call my sponsor or a supportive friend."
                        />
                        
                        <StrategyCard 
                            letter="T"
                            title="Tasks"
                            description="What specific busy-work can you do to distract your hands and mind?"
                            value={data.tasks}
                            onChange={(val) => updateData({ tasks: val })}
                            icon={ClipboardDocumentCheckIcon}
                            colorTheme="emerald"
                            placeholder="e.g., I will go to the kitchen and help wash the dishes."
                        />
                        
                        <StrategyCard 
                            letter="S"
                            title="Swap"
                            description="Replace the addictive behavior with a healthy alternative you enjoy."
                            value={data.swap}
                            onChange={(val) => updateData({ swap: val })}
                            icon={ArrowPathIcon}
                            colorTheme="sky"
                            placeholder="e.g., I will order a sparkling water with lime instead of alcohol."
                        />
                    </div>
                </div>
            )}
        </SmartToolContainer>
    );
};
