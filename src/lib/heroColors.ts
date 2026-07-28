/**
 * src/lib/heroColors.ts
 * PROJ-56: Sobriety Hero Color Themes
 * Fully-spelled Tailwind class lookup per preset — Tailwind's JIT compiler
 * can't purge dynamically-built strings like `bg-${color}-400`, so every
 * class combination a preset can render must appear literally somewhere
 * in this file (see src/components/tools/ListInput.tsx for the same idiom).
 */
import type { HeroColorKey } from './db';

export interface HeroColorTheme {
  label: string;
  gradient: string;
  shadow: string;
  accentText: string;
  glow: string;
  swatchClass: string;
  // Derived tones for the Dashboard page (header gradient + page background),
  // kept next to the hero's own palette so both stay in sync. dashboardHeader
  // is darkened just enough (not literally lighter than the hero) to keep
  // VibrantHeader's white title text legible — see PROJ-56 follow-up notes.
  dashboardHeader: { from: string; via: string; to: string };
  dashboardPage: string;
}

export const DEFAULT_HERO_COLOR: HeroColorKey = 'amber';

export const HERO_COLORS: Record<HeroColorKey, HeroColorTheme> = {
  amber: {
    label: 'Amber',
    gradient: 'bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500',
    shadow: 'shadow-xl shadow-orange-500/20',
    accentText: 'text-orange-500',
    glow: 'bg-yellow-300',
    swatchClass: 'bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500',
    dashboardHeader: { from: 'from-amber-700', via: 'via-orange-700', to: 'to-yellow-700' },
    dashboardPage: 'bg-amber-100',
  },
  sky: {
    label: 'Sky',
    gradient: 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500',
    shadow: 'shadow-xl shadow-blue-500/20',
    accentText: 'text-blue-500',
    glow: 'bg-sky-300',
    swatchClass: 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500',
    dashboardHeader: { from: 'from-sky-600', via: 'via-blue-500', to: 'to-indigo-500' },
    dashboardPage: 'bg-sky-100',
  },
  emerald: {
    label: 'Emerald',
    gradient: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500',
    shadow: 'shadow-xl shadow-emerald-500/20',
    accentText: 'text-emerald-500',
    glow: 'bg-emerald-300',
    swatchClass: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500',
    dashboardHeader: { from: 'from-emerald-600', via: 'via-green-700', to: 'to-teal-600' },
    dashboardPage: 'bg-emerald-100',
  },
  violet: {
    label: 'Violet',
    gradient: 'bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-500',
    shadow: 'shadow-xl shadow-purple-500/20',
    accentText: 'text-purple-500',
    glow: 'bg-violet-300',
    swatchClass: 'bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-500',
    dashboardHeader: { from: 'from-violet-500', via: 'via-purple-500', to: 'to-fuchsia-500' },
    dashboardPage: 'bg-violet-100',
  },
  rose: {
    label: 'Rose',
    gradient: 'bg-gradient-to-br from-rose-400 via-pink-500 to-red-500',
    shadow: 'shadow-xl shadow-rose-500/20',
    accentText: 'text-rose-500',
    glow: 'bg-rose-300',
    swatchClass: 'bg-gradient-to-br from-rose-400 via-pink-500 to-red-500',
    dashboardHeader: { from: 'from-rose-500', via: 'via-pink-500', to: 'to-red-500' },
    dashboardPage: 'bg-rose-100',
  },
};

export function getHeroColorTheme(key?: HeroColorKey | null): HeroColorTheme {
  return HERO_COLORS[key ?? DEFAULT_HERO_COLOR];
}
