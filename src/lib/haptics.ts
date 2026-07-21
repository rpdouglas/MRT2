export type HapticPulse = 'inhale' | 'hold' | 'exhale' | 'tap';

export function triggerHaptic(type: HapticPulse) {
    try {
        if (!navigator.vibrate) return;
        if (type === 'inhale') navigator.vibrate([40]); // Single distinct pulse
        if (type === 'hold') navigator.vibrate([20, 50, 20]); // Gentle double tap
        if (type === 'exhale') navigator.vibrate([40]); // Single distinct pulse
        if (type === 'tap') navigator.vibrate([15]); // PROJ-72: short confirmation tick for a registered game tap
    } catch {
        // Safely ignore if browser blocks haptics
    }
}
