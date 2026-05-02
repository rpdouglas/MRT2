import type { ReadingModality } from '../lib/db';

export interface FellowshipInfo {
  id: string;
  name: string;
  dailyReadingUrl: string;
  modalityKey?: ReadingModality;
}

export const FELLOWSHIPS: Record<string, FellowshipInfo> = {
  AA: {
    id: 'AA',
    name: 'Alcoholics Anonymous',
    dailyReadingUrl: 'https://www.aa.org/pages/en_US/daily-reflection',
    modalityKey: 'twelve-step-aa',
  },
  NA: {
    id: 'NA',
    name: 'Narcotics Anonymous',
    dailyReadingUrl: 'https://jftna.org/jft/',
    modalityKey: 'twelve-step-na',
  },
  SMART: {
    id: 'SMART',
    name: 'SMART Recovery',
    dailyReadingUrl: 'https://www.smartrecovery.org/community/forums/130-Daily-Check-in',
    modalityKey: 'smart-recovery',
  },
  DEFAULT: {
    id: 'DEFAULT',
    name: 'General Recovery',
    dailyReadingUrl: 'https://www.justfortoday.com/',
  },
};
