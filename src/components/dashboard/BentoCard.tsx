import type { ComponentType, SVGProps } from 'react';
import { Link } from 'react-router-dom';
import { THEME } from '../../lib/theme';

export interface BentoTileConfig {
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  moduleKey: keyof typeof THEME;
  shadowClass: string;
  label: string;
  description: string;
  badgeIcon?: ComponentType<SVGProps<SVGSVGElement>>;
}

export default function BentoCard({ to, icon: Icon, title, moduleKey, shadowClass, label, description, badgeIcon: BadgeIcon }: BentoTileConfig) {
  const { from, via, to: toColor } = THEME[moduleKey].header;

  return (
    <Link
      to={to}
      className={`group relative overflow-hidden rounded-2xl px-5 py-4 text-white bg-gradient-to-br ${from} ${via} ${toColor} shadow-lg ${shadowClass} transition-all duration-300 active:scale-95 hover:shadow-xl hover:brightness-105`}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

      <div className="absolute right-0 top-0 p-3 opacity-20 transform translate-x-2 -translate-y-2 transition-transform duration-300 group-hover:rotate-12">
        <Icon className="h-16 w-16 rotate-12" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg"><Icon className="h-4 w-4 text-white" /></div>
          <span className="text-sm font-bold uppercase tracking-wider opacity-90">{title}</span>
        </div>

        {BadgeIcon ? (
          <div className="text-xs font-bold mt-3 mb-1 uppercase tracking-wider flex items-center gap-1 opacity-95">
            <BadgeIcon className="h-3 w-3" /> {label}
          </div>
        ) : (
          <div className="text-xs font-bold mt-3 mb-1 uppercase tracking-wider opacity-80">{label}</div>
        )}

        <p className={`text-[10px] leading-tight pr-2 ${BadgeIcon ? 'font-medium opacity-95' : 'opacity-90'}`}>
          {description}
        </p>
      </div>
    </Link>
  );
}
