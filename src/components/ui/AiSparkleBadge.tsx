import { SparklesIcon } from '@heroicons/react/24/outline';

interface AiSparkleBadgeProps {
    mode?: 'dark' | 'light';
    label?: string;
    title?: string;
    className?: string;
}

const ICON_TONE: Record<'dark' | 'light', string> = {
    light: 'text-purple-400',
    dark: 'text-fuchsia-400',
};

export default function AiSparkleBadge({ mode = 'light', label, title = 'AI Suggested', className = '' }: AiSparkleBadgeProps) {
    if (!label) {
        return (
            <SparklesIcon className={`h-3.5 w-3.5 shrink-0 ${ICON_TONE[mode]} ${className}`} title={title} />
        );
    }

    if (mode === 'dark') {
        return (
            <span className={`inline-flex items-center gap-1.5 ${className}`} title={title}>
                <SparklesIcon className={`h-3.5 w-3.5 ${ICON_TONE[mode]}`} />
                <span className="text-[10px] font-bold uppercase tracking-wide text-fuchsia-300">{label}</span>
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center gap-1 px-1 py-0.5 rounded-[4px] font-bold text-[10px] bg-purple-50 text-purple-600 border border-purple-100 ${className}`}
            title={title}
        >
            <SparklesIcon className="h-3 w-3 text-purple-400" />
            {label}
        </span>
    );
}
