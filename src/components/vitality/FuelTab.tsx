import { useState } from 'react';
import type { FormEvent } from 'react';
import { BeakerIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface FuelTabProps {
    onLog: (category: string, title: string, contentDetails: string, note: string, tags: string[]) => Promise<void>;
    saving: boolean;
}

export default function FuelTab({ onLog, saving }: FuelTabProps) {
    const [mealType, setMealType] = useState('Lunch');
    const [hungerType, setHungerType] = useState('Physical');
    const [waterCount, setWaterCount] = useState(0);
    const [nutriNote, setNutriNote] = useState('');

    const handleLogNutrition = async (e: FormEvent) => {
        e.preventDefault();
        const details = `*Meal:* ${mealType}\n*Hunger Type:* ${hungerType}\n*Hydration at log:* ${waterCount} glasses`;
        await onLog('Nutrition', 'Fuel Log 🍎', details, nutriNote, [mealType]);
        setNutriNote('');
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative animate-fadeIn">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-400 to-green-600"></div>
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><BeakerIcon className="h-6 w-6" /></div>
                        <h3 className="text-lg font-bold text-gray-900">Nutrition</h3>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        <button onClick={() => setWaterCount(Math.max(0, waterCount - 1))} className="text-blue-400 font-bold">-</button>
                        <span className="text-sm font-bold text-blue-700 w-4 text-center">{waterCount}</span>
                        <button onClick={() => setWaterCount(waterCount + 1)} className="text-blue-400 font-bold">+</button>
                        <span className="text-[10px] text-blue-400 uppercase font-bold">H2O</span>
                    </div>
                </div>
                <form onSubmit={handleLogNutrition} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Meal</label>
                            <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="w-full text-sm rounded-xl border-gray-200 bg-gray-50"><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option></select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Hunger</label>
                            <select value={hungerType} onChange={(e) => setHungerType(e.target.value)} className="w-full text-sm rounded-xl border-gray-200 bg-gray-50"><option>Physical</option><option>Emotional</option><option>Boredom</option><option>Habit</option></select>
                        </div>
                    </div>
                    <textarea rows={2} placeholder="Mindful eating check..." value={nutriNote} onChange={(e) => setNutriNote(e.target.value)} className="w-full text-sm rounded-xl border-gray-200 bg-gray-50 resize-none" />
                    <button type="submit" disabled={saving} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2">
                        {saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />} Log Fuel
                    </button>
                </form>
            </div>
        </div>
    );
}
