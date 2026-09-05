import { useLayout } from '../contexts/LayoutContext';
import { Bars3Icon, ExclamationTriangleIcon, ChevronLeftIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import type { ElementType } from 'react';
import { useNavigate } from 'react-router-dom';

interface VibrantHeaderExtraAction {
  icon: ElementType;
  onClick: () => void;
  label: string;
}

interface VibrantHeaderProps {
  title: string;
  subtitle: string;
  icon?: ElementType;
  fromColor: string;
  viaColor: string;
  toColor: string;
  percentage?: number;
  percentageColor?: string;
  backLink?: string;
  // Optional extra icon button in the right-side cluster, before Help/SOS —
  // e.g. Dashboard.tsx's "view today's inspirational image again" trigger
  // (PROJ-113). Omitted by every other page that renders this shared header.
  extraAction?: VibrantHeaderExtraAction;
}

const ProgressRing = ({ percentage, colorHex }: { percentage: number; colorHex?: string }) => {
  const radius = 24; 
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

export default function VibrantHeader({ title, subtitle, icon: Icon, fromColor, viaColor, toColor, percentage, percentageColor, backLink, extraAction }: VibrantHeaderProps) {
  const { toggleSidebar, toggleSOS } = useLayout();
  const navigate = useNavigate();

  return (
    <div className={`bg-gradient-to-r ${fromColor} ${viaColor} ${toColor} px-4 pt-4 pb-16 shadow-lg relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      
      {/* 3-Column Flex Layout for Perfect Centering */}
      <div className="relative z-20 flex items-center justify-between w-full">
        
        {/* Left: Hamburger or Back Arrow (Flex-1 anchors left side) */}
        <div className="flex-1 flex justify-start">
          {backLink ? (
            <button 
              onClick={() => navigate(backLink)}
              className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-sm border border-white/20 active:scale-95"
              aria-label="Go Back"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
          ) : (
            <button 
              onClick={toggleSidebar}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm border border-white/10 active:scale-95"
              aria-label="Open Menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Center: Title & Subtitle (min-w-0 lets a long subtitle truncate instead of pushing SOS off-screen) */}
        <div className="min-w-0 flex flex-col items-center text-center px-2">
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2 drop-shadow-md">
            {Icon && <Icon className="h-6 w-6 text-white/90 shrink-0" />}
            {title}
            {Icon && <Icon className="h-6 w-6 text-white/90 shrink-0" />}
          </h1>
          <p className="text-white/80 text-xs sm:text-sm font-medium mt-0.5 tracking-wide truncate max-w-full">
            {subtitle}
          </p>
        </div>

        {/* Right: Help, SOS & Stats (Flex-1 anchors right side) */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {/* Progress Ring (Optional) */}
          {percentage !== undefined && (
             <div className="hidden sm:block bg-white/10 backdrop-blur-md rounded-full p-1 shadow-inner border border-white/5">
                <ProgressRing percentage={percentage} colorHex={percentageColor} />
             </div>
          )}

          {/* Optional Extra Action (e.g. Dashboard's "view today's image") */}
          {extraAction && (
            <button
              onClick={extraAction.onClick}
              className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md shadow-sm border border-white/10 active:scale-95"
              aria-label={extraAction.label}
              title={extraAction.label}
            >
              <extraAction.icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          )}

          {/* Contextual Help Icon */}
          <a 
            href="https://docs.myrecoverytoolkit.ca/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md shadow-sm border border-white/10 active:scale-95"
            aria-label="Help & Documentation"
          >
            <QuestionMarkCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </a>

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
