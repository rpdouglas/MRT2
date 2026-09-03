import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface PersonaBioCardProps {
  backstory: string;
  currentStage: string;
  sponsorStatus: string;
  keyChallenge: string;
  className?: string;
}

const FIELDS: { key: keyof Omit<PersonaBioCardProps, 'className'>; label: string }[] = [
  { key: 'backstory', label: 'Backstory' },
  { key: 'currentStage', label: 'Current Stage' },
  { key: 'sponsorStatus', label: 'Sponsor Status' },
  { key: 'keyChallenge', label: 'Key Challenge' },
];

export default function PersonaBioCard({ className = '', ...bio }: PersonaBioCardProps) {
  return (
    <details className={`group ${className}`}>
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-1 text-sm font-bold text-slate-900 transition-colors hover:text-blue-600">
        Read their story
        <ChevronDownIcon className="w-4 h-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 grid grid-cols-2 gap-4 rounded-2xl bg-white/70 p-4 text-sm">
        {FIELDS.map(({ key, label }) => (
          <div key={key}>
            <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</h4>
            <p className="leading-snug text-slate-600">{bio[key]}</p>
          </div>
        ))}
      </div>
    </details>
  );
}
