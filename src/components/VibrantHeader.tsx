import React from 'react';

interface VibrantHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  fromColor: string; // e.g. "from-blue-600"
  viaColor: string;  // e.g. "via-indigo-600"
  toColor: string;   // e.g. "to-purple-600"
  percentage?: number; // Optional progress ring (0-100)
  percentageColor?: string; // Optional hex for the ring
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
        {/* Track */}
        <circle
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress */}
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
  return (
    <div className={`bg-gradient-to-r ${fromColor} ${viaColor} ${toColor} p-6 pb-12 shadow-md relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="text-white">
          <h1 className="text-2xl font-bold flex items-center gap-2 drop-shadow-md">
            {title}
            <Icon className="h-6 w-6 text-white/80 animate-pulse" />
          </h1>
          <p className="text-white/90 text-sm font-medium mt-1">
            {subtitle}
          </p>
        </div>
        
        {/* Optional Progress Ring */}
        {percentage !== undefined && (
          <div className="bg-white/10 backdrop-blur-md rounded-full p-1 shadow-inner">
            <ProgressRing percentage={percentage} colorHex={percentageColor} />
          </div>
        )}
      </div>
    </div>
  );
}