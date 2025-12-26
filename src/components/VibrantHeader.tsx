import { useLayout } from '../contexts/LayoutContext';
import { Bars3Icon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { ElementType } from 'react';

interface VibrantHeaderProps {
  title: string;
  subtitle: string;
  icon: ElementType;
  fromColor: string;
  viaColor: string;
  toColor: string;
  percentage?: number;
  percentageColor?: string;
}

const ProgressRing = ({ percentage, colorHex }: { percentage: number; colorHex?: string }) => {
  const radius = 32;
  const stroke = 5;
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
    <div className={`bg-gradient-to-r ${fromColor} ${viaColor} ${toColor} p-6 pb-12 shadow-md relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      
      {/* Top Navigation Row (Integrated) */}
      <div className="relative z-20 flex justify-between items-start mb-4">
        {/* Hamburger (Left) */}
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
          aria-label="Open Menu"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* SOS (Right) */}
        <button 
          onClick={toggleSOS}
          className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-white border border-red-200/30 transition-colors backdrop-blur-sm animate-pulse"
          aria-label="Emergency SOS"
        >
          <ExclamationTriangleIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <div className="text-white pr-4">
          <h1 className="text-2xl font-bold flex items-center gap-2 drop-shadow-md">
            {title}
            <Icon className="h-6 w-6 text-white/80" />
          </h1>
          <p className="text-white/90 text-sm font-medium mt-1 leading-snug">
            {subtitle}
          </p>
        </div>
        
        {/* Optional Progress Ring */}
        {percentage !== undefined && (
          <div className="bg-white/10 backdrop-blur-md rounded-full p-1 shadow-inner flex-shrink-0">
            <ProgressRing percentage={percentage} colorHex={percentageColor} />
          </div>
        )}
      </div>
    </div>
  );
}