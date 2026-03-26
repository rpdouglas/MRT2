/**
 * src/components/smart_tools/ABCTool.tsx
 * PROJ-27: The CBT Engine
 * Modernized ABC Coping Tool using a sequential vertical flow.
 */

import React from 'react';
import { SmartToolContainer } from './SmartToolContainer';
import { 
    ArrowDownIcon,
    BoltIcon,
    ChatBubbleBottomCenterTextIcon,
    ExclamationTriangleIcon,
    ShieldExclamationIcon,
    LightBulbIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import type { ABCPayload } from '../../lib/types/smart';

const EXPLANATION = "The ABC model (from REBT) teaches us that an Activating Event doesn't directly cause our Consequences (feelings/actions). Instead, it's our Beliefs about the event that cause our reactions. By Disputing irrational beliefs, we can create an Effective new philosophy.";

interface FlowCardProps {
    title: string;
    description: string;
    value: string;
    onChange: (val: string) => void;
    icon: React.ElementType;
    colorTheme: 'slate' | 'rose' | 'orange' | 'indigo' | 'emerald';
    placeholder: string;
    isLast?: boolean;
}

const FlowCard: React.FC<FlowCardProps> = ({ 
    title, description, value, onChange, icon: Icon, colorTheme, placeholder, isLast = false 
}) => {
    const themeStyles = {
        slate: "bg-slate-50 border-slate-200 text-slate-800 ring-slate-400 focus-within:border-slate-400 focus-within:ring-slate-200",
        rose: "bg-rose-50 border-rose-200 text-rose-900 ring-rose-400 focus-within:border-rose-400 focus-within:ring-rose-200",
        orange: "bg-orange-50 border-orange-200 text-orange-900 ring-orange-400 focus-within:border-orange-400 focus-within:ring-orange-200",
        indigo: "bg-indigo-50 border-indigo-200 text-indigo-900 ring-indigo-400 focus-within:border-indigo-400 focus-within:ring-indigo-200",
        emerald: "bg-emerald-50 border-emerald-200 text-emerald-900 ring-emerald-400 focus-within:border-emerald-400 focus-within:ring-emerald-200"
    };

    const iconBgStyles = {
        slate: "bg-slate-100 text-slate-600",
        rose: "bg-rose-100 text-rose-600",
        orange: "bg-orange-100 text-orange-600",
        indigo: "bg-indigo-100 text-indigo-600",
        emerald: "bg-emerald-100 text-emerald-600"
    };

    return (
        <div className="relative w-full flex flex-col items-center">
            <div className={`w-full p-5 sm:p-6 rounded-2xl border shadow-sm transition-all duration-300 ${themeStyles[colorTheme]}`}>
                <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-xl shrink-0 ${iconBgStyles[colorTheme]}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-tight">{title}</h3>
                        <p className="text-sm opacity-80 mt-1">{description}</p>
                    </div>
                </div>
                <textarea
                    rows={3}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-white/60 border border-black/10 rounded-xl p-4 text-base focus:ring-4 focus:outline-none transition-all resize-y min-h-[100px] placeholder:text-black/30"
                />
            </div>
            
            {!isLast && (
                <div className="my-2 flex justify-center items-center h-10 w-full relative">
                    <div className="absolute top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    <div className="bg-white rounded-full p-1 z-10 shadow-sm border border-gray-200">
                        <ArrowDownIcon className="h-4 w-4 text-gray-400" />
                    </div>
                </div>
            )}
        </div>
    );
};

export const ABCTool: React.FC = () => {
    const initialData: ABCPayload = {
        activatingEvent: '',
        beliefs: '',
        consequences: '',
        dispute: '',
        effectiveBelief: ''
    };

    return (
        <SmartToolContainer<ABCPayload>
            toolType="ABC"
            toolLabel="ABC Coping Tool"
            initialData={initialData}
        >
            {({ data, updateData }) => (
                <div className="space-y-6 pb-12 max-w-3xl mx-auto">
                    
                    {/* Header Explanation */}
                    <div className="bg-blue-50/80 backdrop-blur-md p-6 rounded-3xl border border-blue-100 shadow-sm">
                        <div className="flex items-start gap-3 text-blue-900">
                            <InformationCircleIcon className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-sm sm:text-base leading-relaxed font-medium">
                                {EXPLANATION}
                            </p>
                        </div>
                    </div>

                    {/* Sequential Vertical Flow */}
                    <div className="flex flex-col items-center w-full">
                        <FlowCard 
                            title="A - Activating Event"
                            description="What happened? Stick to the facts like a video camera recording the scene."
                            value={data.activatingEvent}
                            onChange={(val) => updateData({ activatingEvent: val })}
                            icon={BoltIcon}
                            colorTheme="slate"
                            placeholder="e.g., My boss sent a vague email asking to 'talk later'."
                        />
                        
                        <FlowCard 
                            title="B - Beliefs"
                            description="What are you telling yourself about this event? Identify the irrational thoughts."
                            value={data.beliefs}
                            onChange={(val) => updateData({ beliefs: val })}
                            icon={ChatBubbleBottomCenterTextIcon}
                            colorTheme="rose"
                            placeholder="e.g., I'm definitely getting fired. I can never do anything right."
                        />
                        
                        <FlowCard 
                            title="C - Consequences"
                            description="How did you feel, and how did you act based on those beliefs?"
                            value={data.consequences}
                            onChange={(val) => updateData({ consequences: val })}
                            icon={ExclamationTriangleIcon}
                            colorTheme="orange"
                            placeholder="e.g., I felt panicked and my chest tightened. I wanted to drink to numb the anxiety."
                        />
                        
                        <FlowCard 
                            title="D - Dispute"
                            description="Challenge the belief (B). Where is the proof? Is there another explanation?"
                            value={data.dispute}
                            onChange={(val) => updateData({ dispute: val })}
                            icon={ShieldExclamationIcon}
                            colorTheme="indigo"
                            placeholder="e.g., Where is the proof I'm getting fired? We have a standard 1-on-1 scheduled today."
                        />
                        
                        <FlowCard 
                            title="E - Effective New Belief"
                            description="Write a balanced, realistic, and helpful thought to replace the old one."
                            value={data.effectiveBelief}
                            onChange={(val) => updateData({ effectiveBelief: val })}
                            icon={LightBulbIcon}
                            colorTheme="emerald"
                            placeholder="e.g., My boss probably just wants an update on the project. I will wait for facts before assuming the worst."
                            isLast={true}
                        />
                    </div>
                </div>
            )}
        </SmartToolContainer>
    );
};
