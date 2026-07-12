import { useState } from 'react';
import type { FormEvent } from 'react';
import { FireIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface MoveTabProps {
    onLog: (category: string, title: string, contentDetails: string, note: string, tags: string[]) => Promise<void>;
    saving: boolean;
}

export default function MoveTab({ onLog, saving }: MoveTabProps) {
    const [moveActivity, setMoveActivity] = useState('');
    const [moveDuration, setMoveDuration] = useState('');
    const [moveIntensity, setMoveIntensity] = useState('Moderate');
    const [moveNote, setMoveNote] = useState('');

    const handleLogMovement = async (e: FormEvent) => {
        e.preventDefault();
        if (!moveActivity) return;

        const details = `*Activity:* ${moveActivity}\n*Duration:* ${moveDuration} mins\n*Intensity:* ${moveIntensity}`;
        await onLog('Movement', 'Movement Log 🏃', details, moveNote, [moveActivity]);

        setMoveActivity('');
        setMoveDuration('');
        setMoveNote('');
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative animate-fadeIn">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-400 to-red-500"></div>
            <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                        <FireIcon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Log Activity</h3>
                </div>
                <form onSubmit={handleLogMovement} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Activity</label>
                            <input type="text" placeholder="e.g. Walk" value={moveActivity} onChange={(e) => setMoveActivity(e.target.value)} className="w-full text-sm rounded-xl border-gray-200 bg-gray-50" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Mins</label>
                            <input type="number" placeholder="30" value={moveDuration} onChange={(e) => setMoveDuration(e.target.value)} className="w-full text-sm rounded-xl border-gray-200 bg-gray-50" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Intensity</label>
                        <div className="flex gap-2">
                            {['Low', 'Moderate', 'High'].map(lvl => (
                                <button key={lvl} type="button" onClick={() => setMoveIntensity(lvl)} className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${moveIntensity === lvl ? 'bg-orange-100 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-500'}`}>{lvl}</button>
                            ))}
                        </div>
                    </div>
                    <textarea rows={2} placeholder="Body check-in..." value={moveNote} onChange={(e) => setMoveNote(e.target.value)} className="w-full text-sm rounded-xl border-gray-200 bg-gray-50 resize-none" />
                    <button type="submit" disabled={saving} className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2">
                        {saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />} Log
                    </button>
                </form>
            </div>
        </div>
    );
}
