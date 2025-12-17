import { useMemo } from 'react';
import { TrophyIcon } from '@heroicons/react/24/solid';

interface SobrietyCounterProps {
  sobrietyDate: Date;
}

// ensure 'export default' is present here
export default function SobrietyCounter({ sobrietyDate }: SobrietyCounterProps) {
  const time = useMemo(() => {
    const now = new Date();
    const start = new Date(sobrietyDate);
    
    // Calculate the difference
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    const years = Math.floor(totalDays / 365);
    const months = Math.floor((totalDays % 365) / 30);
    const days = (totalDays % 365) % 30;

    return { years, months, days, totalDays };
  }, [sobrietyDate]);

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
      {/* Background Decoration */}
      <TrophyIcon className="absolute -right-4 -bottom-4 h-48 w-48 text-blue-500 opacity-20 transform rotate-12" />

      <div className="relative z-10">
        <h2 className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-4">
          Clean & Sober Time
        </h2>
        
        <div className="flex items-end space-x-6">
          {/* Years */}
          {time.years > 0 && (
            <div className="text-center">
              <span className="block text-4xl sm:text-5xl font-bold">{time.years}</span>
              <span className="text-xs sm:text-sm text-blue-200 uppercase">Years</span>
            </div>
          )}

          {/* Months */}
          {time.months > 0 && (
            <div className="text-center">
              <span className="block text-4xl sm:text-5xl font-bold">{time.months}</span>
              <span className="text-xs sm:text-sm text-blue-200 uppercase">Months</span>
            </div>
          )}

          {/* Days */}
          <div className="text-center">
            <span className="block text-4xl sm:text-5xl font-bold">{time.days}</span>
            <span className="text-xs sm:text-sm text-blue-200 uppercase">Days</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-blue-500/50 flex justify-between items-center text-sm text-blue-200">
          <span>Total Days: {time.totalDays}</span>
          <span>Started: {sobrietyDate.toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}