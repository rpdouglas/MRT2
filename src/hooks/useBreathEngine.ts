import { useState, useRef, useCallback, useEffect } from 'react';
import { useWakeLock } from './useWakeLock';
import { triggerHaptic } from '../lib/haptics';

export type BreathPhase = 'Idle' | 'Inhale' | 'Hold' | 'Exhale' | 'Hold (Empty)';
export type BreathPatternType = '4-7-8' | '4-4-4-4' | 'custom';

const PRESETS = { '4-7-8': [4, 7, 8, 0], '4-4-4-4': [4, 4, 4, 4] };

// The breathwork timer state machine (Vitality 2.0). Mutable refs track engine
// state outside of React's render batching loop so the 1s interval stays
// accurate regardless of when React chooses to flush state updates.
export function useBreathEngine() {
    const { requestWakeLock, releaseWakeLock } = useWakeLock();

    const [breathPattern, setBreathPattern] = useState<BreathPatternType>('4-7-8');
    const [customPattern, setCustomPattern] = useState<[number, number, number, number]>(() => {
        const saved = localStorage.getItem('mrt_custom_breath');
        if (saved) {
            try { return JSON.parse(saved) as [number, number, number, number]; } catch { /* ignore */ }
        }
        return [5, 0, 5, 0];
    });
    const [showSettings, setShowSettings] = useState(false);

    const [breathActive, setBreathActive] = useState(false);
    const [breathTime, setBreathTime] = useState(0);
    const [breathPhase, setBreathPhase] = useState<BreathPhase>('Idle');
    const [phaseTimeLeft, setPhaseTimeLeft] = useState(0);
    const [visualState, setVisualState] = useState({ scale: 1, duration: 0 });

    const currentPhaseIndex = useRef(0); // 0: In, 1: Hold, 2: Out, 3: HoldEmpty
    const timeLeftRef = useRef(0);
    const patternRef = useRef<number[]>([4, 7, 8, 0]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const handleCustomChange = (index: number, val: number) => {
        const newPattern = [...customPattern] as [number, number, number, number];
        newPattern[index] = Math.max(0, val);
        setCustomPattern(newPattern);
        localStorage.setItem('mrt_custom_breath', JSON.stringify(newPattern));
    };

    const applyPhase = useCallback((index: number, pattern: number[]) => {
        currentPhaseIndex.current = index;
        const duration = pattern[index];

        // Immediately sync the ref so the interval loop catches the new duration
        timeLeftRef.current = duration;
        setPhaseTimeLeft(duration);

        if (index === 0) {
            setBreathPhase('Inhale');
            setVisualState({ scale: 1.5, duration });
            triggerHaptic('inhale');
        } else if (index === 1) { setBreathPhase('Hold'); setVisualState({ scale: 1.5, duration }); triggerHaptic('hold'); } else if (index === 2) { setBreathPhase('Exhale'); setVisualState({ scale: 0.8, duration }); triggerHaptic('exhale'); } else if (index === 3) { setBreathPhase('Hold (Empty)'); setVisualState({ scale: 0.8, duration }); triggerHaptic('hold'); }
    }, []);

    const startEngine = useCallback(() => {
        setBreathActive(true);
        setShowSettings(false);
        setBreathTime(0);
        requestWakeLock();

        const pattern = breathPattern === 'custom' ? customPattern : PRESETS[breathPattern];
        patternRef.current = pattern;

        // Find first non-zero phase
        let startIndex = 0;
        while (pattern[startIndex] === 0 && startIndex < 4) startIndex++;
        if (startIndex === 4) startIndex = 0;

        applyPhase(startIndex, pattern);

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setBreathTime(t => t + 1);

            // Engine logic bypasses React setState batching for immediate execution
            if (timeLeftRef.current <= 1) {
                let nextIdx = (currentPhaseIndex.current + 1) % 4;
                while (patternRef.current[nextIdx] === 0) {
                    nextIdx = (nextIdx + 1) % 4;
                }
                applyPhase(nextIdx, patternRef.current);
            } else { timeLeftRef.current -= 1; setPhaseTimeLeft(timeLeftRef.current); }
        }, 1000);

    }, [breathPattern, customPattern, requestWakeLock, applyPhase]);

    const stopEngine = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setBreathActive(false);
        setBreathPhase('Idle');
        setPhaseTimeLeft(0);
        timeLeftRef.current = 0;
        setVisualState({ scale: 1, duration: 1 });
        releaseWakeLock();
    }, [releaseWakeLock]);

    useEffect(() => {
        return () => stopEngine();
    }, [stopEngine]);

    return {
        breathPattern, setBreathPattern,
        customPattern, handleCustomChange,
        showSettings, setShowSettings,
        breathActive, breathTime, breathPhase, phaseTimeLeft, visualState,
        startEngine, stopEngine,
    };
}
