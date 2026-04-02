/**
 * src/pages/ToolsHub.tsx
 * PROJ-27: The CBT Engine
 * Central routing directory for all interactive recovery tools.
 * GITHUB COMMENT:
 * [src/pages/ToolsHub.tsx]
 * FEAT: PROJ-28 Integrated 'The Resentment Burner' into the Tools Hub directory.
 */
import { Link } from 'react-router-dom';
import VibrantHeader from '../components/VibrantHeader';
import { PuzzlePieceIcon, ScaleIcon, ShieldExclamationIcon, ArrowPathIcon, BoltIcon, UserCircleIcon, ChartPieIcon, FireIcon } from '@heroicons/react/24/outline';

const TOOLS = [
    {
        id: 'urge-surfer',
        title: 'Urge Surfer',
        description: 'A 5-minute somatic grounding technique to ride out intense cravings.',
        path: '/tools/urge-surfer',
        icon: ShieldExclamationIcon,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        border: 'border-l-indigo-500',
        status: 'active'
    },
    {
        id: 'resentment-burner',
        title: 'The Resentment Burner',
        description: 'An ephemeral, secure space to vent toxic thoughts and literally watch them burn away. No data is ever saved.',
        path: '/tools/resentment-burner',
        icon: FireIcon,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-l-red-500',
        status: 'active'
    },
    {
        id: 'cba',
        title: 'Cost Benefit Analysis',
        description: 'Weigh the short and long-term consequences of acting on an urge versus staying clean.',
        path: '/tools/cba',
        icon: ScaleIcon,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-l-emerald-500',
        status: 'active'
    },
    {
        id: 'abc',
        title: 'ABC Coping',
        description: 'Identify the activating events and irrational beliefs driving your anxiety.',
        path: '/tools/abc',
        icon: ArrowPathIcon,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-l-blue-500',
        status: 'active'
    },
    {
        id: 'dents',
        title: 'D.E.N.T.S. Strategy',
        description: 'Pre-plan your escape and distraction routes for high-risk situations.',
        path: '/tools/dents',
        icon: BoltIcon,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-l-amber-500',
        status: 'active'
    },
    {
        id: 'personify',
        title: 'Personify & Disarm',
        description: 'Separate your true identity from the addictive voice in your head.',
        path: '/tools/personify',
        icon: UserCircleIcon,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-l-purple-500',
        status: 'active'
    },
    {
        id: 'lifestyle-balance',
        title: 'Lifestyle Balance',
        description: 'Identify imbalances in your life that may make you vulnerable to relapse.',
        path: '/tools/lifestyle-balance',
        icon: ChartPieIcon,
        color: 'text-cyan-600',
        bg: 'bg-cyan-50',
        border: 'border-l-cyan-500',
        status: 'active'
    }
];

export default function ToolsHub() {
    return (
        <div className={`pb-24 relative min-h-screen bg-slate-50`}>
            
            <div className="flex-shrink-0 z-10">
                <VibrantHeader 
                    title="Recovery Tools"
                    subtitle="Practical exercises to manage cravings and rewire thoughts."
                    icon={PuzzlePieceIcon}
                    fromColor="from-blue-600"
                    viaColor="via-indigo-600"
                    toColor="to-violet-600"
                />
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-30 space-y-4">
                
                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-blue-100 text-sm text-blue-900 mb-6 shadow-sm">
                    <strong>SMART Recovery & CBT:</strong> These tools are designed to help you interrupt the cycle of addiction by applying logic and planning to emotional urges.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {TOOLS.map((tool) => {
                        const isComingSoon = tool.status === 'coming_soon';
                        
                        const CardContent = (
                            <div className="flex items-start gap-4">
                                <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${tool.bg} ${tool.color}`}>
                                    <tool.icon className="h-7 w-7" />
                                </div>
                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={`text-base font-bold ${isComingSoon ? 'text-slate-500' : 'text-gray-900 group-hover:text-blue-700 transition-colors'}`}>
                                            {tool.title}
                                        </h3>
                                        {isComingSoon && (
                                            <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                                Coming Soon
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-sm ${isComingSoon ? 'text-slate-400' : 'text-gray-600'} leading-relaxed pr-2`}>
                                        {tool.description}
                                    </p>
                                </div>
                            </div>
                        );

                        if (isComingSoon) {
                            return (
                                <div key={tool.id} className={`block relative bg-white rounded-2xl p-5 border border-gray-200 opacity-60 cursor-not-allowed ${tool.border} border-l-[6px]`}>
                                    {CardContent}
                                </div>
                            );
                        }

                        return (
                            <Link 
                                key={tool.id} 
                                to={tool.path}
                                className={`block relative group bg-white rounded-2xl p-5 shadow-sm border border-gray-200 transition-all hover:shadow-md active:scale-95 ${tool.border} border-l-[6px]`}
                            >
                                {CardContent}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
