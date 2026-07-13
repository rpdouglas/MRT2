import { useState } from 'react';
import VibrantHeader from '../components/VibrantHeader';
import { THEME } from '../lib/theme';
import { useVitalityEntries } from '../hooks/useVitalityEntries';
import MoveTab from '../components/vitality/MoveTab';
import FuelTab from '../components/vitality/FuelTab';
import BreathTab from '../components/vitality/BreathTab';
import { HeartIcon } from '@heroicons/react/24/outline';

type VitalityTab = 'move' | 'fuel' | 'breath';

export default function Vitality() {
    const [activeTab, setActiveTab] = useState<VitalityTab>('move');
    const { bioBalance, saveVitalityEntry, isSaving } = useVitalityEntries();

    return (
        <div className={`h-[100dvh] flex flex-col ${THEME.vitality.page}`}>

            <div className="flex-shrink-0 z-10">
                <VibrantHeader
                    title="My Vitality"
                    subtitle={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    icon={HeartIcon}
                    fromColor={THEME.vitality.header.from}
                    viaColor={THEME.vitality.header.via}
                    toColor={THEME.vitality.header.to}
                    percentage={bioBalance}
                    percentageColor={THEME.vitality.ring}
                />
            </div>

            {/* TAB NAVIGATION */}
            <div className="px-4 py-4 z-20">
                <div className="flex p-1 bg-white/80 backdrop-blur-sm rounded-xl border border-orange-200 shadow-sm">
                    <button onClick={() => setActiveTab('move')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'move' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-500'}`}>
                        Movement
                    </button>
                    <button onClick={() => setActiveTab('fuel')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'fuel' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-gray-500'}`}>
                        Fuel
                    </button>
                    <button onClick={() => setActiveTab('breath')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'breath' ? 'bg-sky-100 text-sky-700 shadow-sm' : 'text-gray-500'}`}>
                        Breath
                    </button>
                </div>
            </div>

            {/* SCROLLABLE CONTENT AREA */}
            <div className="flex-1 overflow-y-auto px-4 pb-20">
                {activeTab === 'move' && <MoveTab onLog={saveVitalityEntry} saving={isSaving} />}
                {activeTab === 'fuel' && <FuelTab onLog={saveVitalityEntry} saving={isSaving} />}
                {activeTab === 'breath' && <BreathTab onLog={saveVitalityEntry} saving={isSaving} />}
            </div>
        </div>
    );
}
