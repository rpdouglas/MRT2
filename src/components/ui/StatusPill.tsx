interface StatusPillProps {
    label: string;
    tone: 'positive' | 'neutral' | 'caution';
    size?: 'sm' | 'md';
}

const TONE_CLASSES: Record<StatusPillProps['tone'], string> = {
    positive: 'bg-emerald-100 text-emerald-700',
    neutral: 'bg-blue-100 text-blue-700',
    caution: 'bg-amber-100 text-amber-700',
};

const SIZE_CLASSES: Record<NonNullable<StatusPillProps['size']>, string> = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
};

export default function StatusPill({ label, tone, size = 'sm' }: StatusPillProps) {
    return (
        <span className={`font-bold rounded-full ${TONE_CLASSES[tone]} ${SIZE_CLASSES[size]}`}>
            {label}
        </span>
    );
}
