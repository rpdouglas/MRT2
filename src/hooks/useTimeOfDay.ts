import { useState, useEffect } from 'react';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function useTimeOfDay(): TimeOfDay {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      
      if (hour >= 5 && hour < 12) {
        setTimeOfDay('morning');
      } else if (hour >= 12 && hour < 17) {
        setTimeOfDay('afternoon');
      } else if (hour >= 17 && hour < 22) {
        setTimeOfDay('evening');
      } else {
        setTimeOfDay('night');
      }
    };

    checkTime();
    
    // Check every minute to keep it updated if they leave the app open
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return timeOfDay;
}

export const TIME_BASED_PROMPTS: Record<TimeOfDay, string> = {
  morning: "Morning Check-In:\n\n1. Today my primary intention is...\n2. Something I am grateful for right now is...\n3. One potential trigger I might face today is, and I will handle it by...",
  afternoon: "Afternoon Check-In:\n\n1. My current energy level and state of mind is...\n2. A small win I've had today is...\n3. To stay grounded for the rest of the day, I will...",
  evening: "Evening Check-In:\n\n1. The best part of my day was...\n2. A challenge I faced today was, and I learned...\n3. My plan to wind down safely tonight is...",
  night: "Night Check-In / Grounding:\n\n1. I am safe in this moment because...\n2. A comforting thought I can hold onto is...\n3. I release the events of today by..."
};
