import { format } from 'date-fns';
import type { ROSCAssessment } from '../../lib/types/rosc';
import { cadenceDateFormat, cadenceSinceLabel, toDateSafe, type ROSCCadence } from '../../lib/roscCadence';
import ROSCPillCapsules from './ROSCPillCapsules';

interface Props {
    latest: ROSCAssessment;
    previous?: ROSCAssessment;
    cadence: ROSCCadence;
    isFirst?: boolean;
}

export default function ROSCLatestCard({ latest, previous, cadence, isFirst = false }: Props) {
    const createdDate = toDateSafe(latest.createdAt) ?? new Date();
    const gain = previous ? latest.totalScore - previous.totalScore : 0;

    return (
        <div className="relative rounded-3xl overflow-hidden p-[1.5px] shadow-lg" style={{ background: 'linear-gradient(145deg, #7C3AED 0%, #EC4899 100%)' }}>
            <div className="relative rounded-[23px] bg-[#0A0418]/60 backdrop-blur-2xl p-5 overflow-hidden">
                {/* Ambient blobs */}
                <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #7C3AED40 0%, transparent 65%)' }} />
                <div className="absolute -bottom-10 -left-5 w-36 h-36 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #EC489930 0%, transparent 65%)' }} />

                <div className="relative z-10">
                    <div className="mb-6 flex justify-between items-start">
                        <div>
                            <div className="text-[10px] tracking-widest text-white/45 uppercase mb-1">
                                {format(createdDate, cadenceDateFormat(cadence))}
                            </div>
                            <div className="text-[13px] text-white/65">Recovery Capital</div>
                            {isFirst && (
                                <div className="text-[10px] text-white/40 mt-1">Your first snapshot</div>
                            )}
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <div className="flex items-baseline gap-1">
                                <div className="text-[42px] font-black text-white leading-none">{latest.totalScore}</div>
                                <div className="text-[11px] text-white/35 pb-1">/ 40</div>
                            </div>
                            {previous && (
                                <div className="text-[11px] text-[#34D399] font-bold mt-1">
                                    {gain >= 0 ? '▲ +' : '▼ '}{gain} {cadenceSinceLabel(cadence)}
                                </div>
                            )}
                        </div>
                    </div>
                    <ROSCPillCapsules current={latest} previous={previous} cadence={cadence} />
                </div>
            </div>
        </div>
    );
}
