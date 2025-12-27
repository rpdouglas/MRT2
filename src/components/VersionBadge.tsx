import { useState } from 'react';
import { useBuildInfo, usePageVersion, getEnvColor } from '../lib/versioning';
import { 
    CpuChipIcon, 
    CodeBracketIcon, 
    ClockIcon,
    ServerIcon
} from '@heroicons/react/24/outline';

interface VersionBadgeProps {
    pageName?: string; // Optional: Pass the current page name to get granular versioning
    className?: string;
}

export default function VersionBadge({ pageName, className = '' }: VersionBadgeProps) {
    const meta = useBuildInfo();
    const pageHash = usePageVersion(pageName || '');
    const [isExpanded, setIsExpanded] = useState(false);

    const envColor = getEnvColor(meta.env);
    const shortTime = new Date(meta.buildTime).toLocaleDateString();

    if (!isExpanded) {
        return (
            <button 
                onClick={() => setIsExpanded(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm text-[10px] font-mono font-bold text-white hover:opacity-90 transition-all ${envColor} ${className}`}
                title="Click for Build Details"
            >
                <ServerIcon className="h-3 w-3" />
                <span>{meta.env}</span>
                <span className="opacity-75">v.{meta.globalHash}</span>
            </button>
        );
    }

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setIsExpanded(false)}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 max-w-sm w-full animate-fadeIn"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                        <CpuChipIcon className="h-5 w-5 text-gray-500" />
                        System Status
                    </h3>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${envColor}`}>
                        {meta.env}
                    </div>
                </div>

                <div className="space-y-3 text-xs text-gray-600 font-mono">
                    <div className="flex justify-between">
                        <span className="flex items-center gap-2"><CodeBracketIcon className="h-4 w-4 text-gray-400" /> Global Build</span>
                        <span className="font-bold text-gray-900">{meta.globalHash}</span>
                    </div>
                    
                    <div className="flex justify-between">
                        <span className="flex items-center gap-2"><ServerIcon className="h-4 w-4 text-gray-400" /> Core Lib Hash</span>
                        <span className="text-gray-900">{meta.coreHash}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="flex items-center gap-2"><ClockIcon className="h-4 w-4 text-gray-400" /> Built On</span>
                        <span className="text-gray-900">{shortTime}</span>
                    </div>

                    {pageName && (
                        <div className="mt-4 pt-3 border-t border-gray-100 bg-gray-50 p-2 rounded-lg">
                            <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Current Page Version</div>
                            <div className="flex justify-between">
                                <span>{pageName}</span>
                                <span className="font-bold text-indigo-600">{pageHash}</span>
                            </div>
                        </div>
                    )}
                </div>

                <button 
                    onClick={() => setIsExpanded(false)}
                    className="w-full mt-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
}