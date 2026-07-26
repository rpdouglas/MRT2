import { useState } from 'react';
import VibrantHeader from '../components/VibrantHeader';
import TabBar from '../components/ui/TabBar';
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

            {/* TAB NAVIGATION (Overlaps Header) */}
            <div className="px-4 -mt-10 relative z-30 flex-shrink-0">
                <TabBar
                    tabs={[
                        { id: 'move', label: 'Movement' },
                        { id: 'fuel', label: 'Fuel' },
                        { id: 'breath', label: 'Breath' },
                    ]}
                    activeTab={activeTab}
                    onChange={(id) => setActiveTab(id as VitalityTab)}
                    border={THEME.vitality.tabBar.border}
                    hoverText={THEME.vitality.tabBar.hoverText}
                    activeFrom={THEME.vitality.header.from}
                    activeTo={THEME.vitality.header.to}
                />
            </div>

            {/* SCROLLABLE CONTENT AREA */}
            <div className="flex-1 overflow-y-auto px-4 pt-6 pb-20">
                {activeTab === 'move' && <MoveTab onLog={saveVitalityEntry} saving={isSaving} />}
                {activeTab === 'fuel' && <FuelTab onLog={saveVitalityEntry} saving={isSaving} />}
                {activeTab === 'breath' && <BreathTab onLog={saveVitalityEntry} saving={isSaving} />}
            </div>
        </div>
    );
}
