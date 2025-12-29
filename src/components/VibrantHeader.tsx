import { useLayout } from '../contexts/LayoutContext';
import { Bars3Icon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { ElementType } from 'react';

interface VibrantHeaderProps {
  title: string;
  subtitle: string;
  icon?: ElementType;
  fromColor: string; // e.g. "from-blue-600"
  viaColor: string;  // e.g. "via-indigo-600"
  toColor: string;   // e.g. "to-purple-600"
  percentage?: number;
  percentageColor?: string;
}

const ProgressRing = ({ percentage, colorHex }: { percentage: number; colorHex?: string }) => {
  const radius = 24; // Slightly smaller for the compact header
  const stroke = 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={colorHex || "currentColor"}
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 1s ease-out" }}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={!colorHex ? "text-white" : ""} 
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[10px] font-bold text-white drop-shadow-sm">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};

export default function VibrantHeader({
  title,
  subtitle,
  icon: Icon,
  fromColor,
  viaColor,
  toColor,
  percentage,
  percentageColor
}: VibrantHeaderProps) {
  const { toggleSidebar, toggleSOS } = useLayout();

  return (
    <div className={`bg-gradient-to-r ${fromColor} ${viaColor} ${toColor} px-4 pt-4 pb-16 shadow-lg relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      
      {/* 3-Column Grid Layout: Menu | Title | Actions */}
      <div className="relative z-20 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        
        {/* Left: Hamburger */}
        <button 
          onClick={toggleSidebar}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm border border-white/10 active:scale-95"
          aria-label="Open Menu"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Center: Title & Subtitle */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2 drop-shadow-md">
            {Icon && <Icon className="h-6 w-6 text-white/90 animate-pulse" />}
            {title}
          </h1>
          <p className="text-white/80 text-xs sm:text-sm font-medium mt-0.5 tracking-wide">
            {subtitle}
          </p>
        </div>

        {/* Right: SOS & Stats */}
        <div className="flex items-center gap-3">
          {/* Progress Ring (Optional) */}
          {percentage !== undefined && (
             <div className="hidden sm:block bg-white/10 backdrop-blur-md rounded-full p-1 shadow-inner border border-white/5">
                <ProgressRing percentage={percentage} colorHex={percentageColor} />
             </div>
          )}

          {/* SOS Button */}
          <button 
            onClick={toggleSOS}
            className="p-2.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white border border-red-400/50 transition-all backdrop-blur-md shadow-lg animate-pulse hover:animate-none active:scale-95"
            aria-label="Emergency SOS"
          >
            <ExclamationTriangleIcon className="h-6 w-6" />
          </button>
        </div>

      </div>
    </div>
  );
}