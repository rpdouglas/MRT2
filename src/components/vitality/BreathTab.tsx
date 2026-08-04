import { useState } from 'react';
import { useBreathEngine } from '../../hooks/useBreathEngine';
import { BoltIcon, PlayIcon, PauseIcon, SparklesIcon, ArrowPathIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { trackBreathworkCompleted } from '../../lib/telemetry';

interface BreathTabProps {
    onLog: (category: string, title: string, contentDetails: string, note: string, tags: string[]) => Promise<void>;
    saving: boolean;
}

export default function BreathTab({ onLog, saving }: BreathTabProps) {
    const engine = useBreathEngine();
    const [breathNote, setBreathNote] = useState('');

    const handleLogBreath = async () => {
        const mins = Math.floor(engine.breathTime / 60);
        const secs = engine.breathTime % 60;
        const techniqueName = engine.breathPattern === '4-7-8' ? 'Relax (4-7-8)' : engine.breathPattern === '4-4-4-4' ? 'Box Breathing (4-4-4-4)' : `Custom (${engine.customPattern.join('-')})`;
        const details = `*Session Duration:* ${mins}m ${secs}s\n*Technique:* ${techniqueName}`;

        trackBreathworkCompleted(engine.breathPattern, engine.breathTime);
        engine.stopEngine();
        await onLog('Mindfulness', 'Breathwork Session 🌬️', details, breathNote, ['Somatic', 'Breathing', 'Regulation', 'Meditation']);

        setBreathNote('');
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative animate-fadeIn">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-sky-400 to-blue-600"></div>
            <div className="p-6">

                {/* Dynamic Organic Halo Styles */}
                <style>{`
                    @keyframes organicMorph {
                        0% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
                        34% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; }
                        67% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; }
                        100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
                    }
                    .organic-halo {
                        animation: organicMorph 8s ease-in-out infinite;
                        transition-property: transform;
                        transition-timing-function: ease-in-out;
                    }
                `}</style>

                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-sky-50 rounded-lg text-sky-600"><BoltIcon className="h-6 w-6" /></div>
                    <h3 className="text-lg font-bold text-gray-900">Somatic Anchor</h3>
                </div>

                {/* SETTINGS MENU (Hidden when active) */}
                {!engine.breathActive && (
                    <div className="mb-6 flex flex-col items-center">
                        <button onClick={() => engine.setShowSettings(!engine.showSettings)} className="text-xs font-bold text-sky-600 flex items-center gap-1.5 mb-2 hover:text-sky-800 transition-colors">
                            <AdjustmentsHorizontalIcon className="h-4 w-4" />
                            Pattern: {engine.breathPattern === 'custom' ? 'Custom' : engine.breathPattern === '4-7-8' ? 'Relax (4-7-8)' : 'Box Breathing (4-4-4-4)'}
                        </button>

                        {engine.showSettings && (
                             <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 w-full max-w-sm animate-fadeIn text-left mt-2">
                                  <label htmlFor="breath-rhythm" className="block text-[10px] font-bold text-sky-800 uppercase tracking-widest mb-2">Select Rhythm</label>
                                  <select
                                      id="breath-rhythm"
                                      value={engine.breathPattern}
                                      onChange={(e) => engine.setBreathPattern(e.target.value as typeof engine.breathPattern)}
                                      className="w-full text-sm rounded-lg border-sky-200 bg-white mb-4 focus:ring-sky-500 text-sky-900 font-medium"
                                  >
                                      <option value="4-7-8">Relax (4-7-8)</option>
                                      <option value="4-4-4-4">Box Breathing (4-4-4-4)</option>
                                      <option value="custom">Custom Configuration</option>
                                  </select>

                                  {engine.breathPattern === 'custom' && (
                                      <div className="grid grid-cols-4 gap-2 text-center">
                                          <div>
                                              <label htmlFor="breath-custom-in" className="block text-[10px] font-bold text-sky-700 mb-1">In</label>
                                              <input id="breath-custom-in" type="number" min="0" value={engine.customPattern[0]} onChange={(e) => engine.handleCustomChange(0, parseInt(e.target.value) || 0)} className="w-full text-center text-xs rounded border-sky-200 p-1" />
                                          </div>
                                          <div>
                                              <label htmlFor="breath-custom-hold-1" className="block text-[10px] font-bold text-sky-700 mb-1">Hold</label>
                                              <input id="breath-custom-hold-1" type="number" min="0" value={engine.customPattern[1]} onChange={(e) => engine.handleCustomChange(1, parseInt(e.target.value) || 0)} className="w-full text-center text-xs rounded border-sky-200 p-1" />
                                          </div>
                                          <div>
                                              <label htmlFor="breath-custom-out" className="block text-[10px] font-bold text-sky-700 mb-1">Out</label>
                                              <input id="breath-custom-out" type="number" min="0" value={engine.customPattern[2]} onChange={(e) => engine.handleCustomChange(2, parseInt(e.target.value) || 0)} className="w-full text-center text-xs rounded border-sky-200 p-1" />
                                          </div>
                                          <div>
                                              <label htmlFor="breath-custom-hold-2" className="block text-[10px] font-bold text-sky-700 mb-1">Hold</label>
                                              <input id="breath-custom-hold-2" type="number" min="0" value={engine.customPattern[3]} onChange={(e) => engine.handleCustomChange(3, parseInt(e.target.value) || 0)} className="w-full text-center text-xs rounded border-sky-200 p-1" />
                                          </div>
                                      </div>
                                  )}
                             </div>
                        )}
                    </div>
                )}

                {/* THE ORGANIC HALO ENGINE */}
                <div className="flex flex-col items-center gap-8">
                    <div className="relative flex items-center justify-center w-56 h-56 flex-shrink-0 mt-4 mb-4">
                         {/* Base layer glow */}
                         <div
                             className="absolute inset-0 bg-sky-200/40 organic-halo shadow-[0_0_40px_rgba(56,189,248,0.3)]"
                             style={{
                                 transform: `scale(${engine.visualState.scale})`,
                                 transitionDuration: `${engine.visualState.duration}s`
                             }}
                         ></div>
                         {/* Inner core layer */}
                         <div
                             className="absolute inset-6 bg-sky-300/30 organic-halo"
                             style={{
                                 transform: `scale(${engine.visualState.scale})`,
                                 transitionDuration: `${engine.visualState.duration}s`,
                                 animationDirection: 'reverse',
                                 animationDuration: '11s' // Desync the organic wobbles
                             }}
                         ></div>

                         {/* Center Readout */}
                         <div className="relative z-10 text-center bg-white/80 backdrop-blur-sm rounded-full w-28 h-28 flex flex-col items-center justify-center shadow-lg border border-white/50">
                             <div className="text-3xl font-bold text-sky-900 tabular-nums">
                                 {Math.floor(engine.breathTime / 60)}:{(engine.breathTime % 60).toString().padStart(2, '0')}
                             </div>
                             <div className="text-[10px] font-bold text-sky-600 uppercase tracking-widest mt-1 min-h-[16px]">
                                 {engine.breathPhase !== 'Idle' ? `${engine.breathPhase} (${engine.phaseTimeLeft}s)` : 'Ready'}
                             </div>
                         </div>
                    </div>

                    <div className="w-full space-y-4 relative z-20">
                        <div className="flex gap-4">
                            {engine.breathActive ? (
                                <button onClick={engine.stopEngine} className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 bg-amber-100 text-amber-800 hover:bg-amber-200">
                                    <PauseIcon className="h-6 w-6" /> Stop
                                </button>
                            ) : (
                                <button onClick={engine.startEngine} className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 bg-sky-600 text-white hover:bg-sky-700">
                                    <PlayIcon className="h-6 w-6" /> Start Focus
                                </button>
                            )}
                        </div>
                        <textarea rows={2} placeholder="Reflection on session..." value={breathNote} onChange={(e) => setBreathNote(e.target.value)} className="w-full text-sm rounded-xl border-gray-200 bg-gray-50 resize-none focus:ring-sky-500 focus:border-sky-500" />
                        <button onClick={handleLogBreath} disabled={engine.breathTime < 5 || saving} className="w-full py-3 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50">
                            {saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SparklesIcon className="h-5 w-5" />} Log Session
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
