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
    name: 'AA Daily Reflection',
    dailyReadingUrl: 'https://www.aa.org/pages/en_US/daily-reflection',
    modalityKey: 'twelve-step-aa',
  },
  NA: {
    id: 'NA',
    name: 'NA Just for Today',
    dailyReadingUrl: 'https://jftna.org/jft/',
    modalityKey: 'twelve-step-na',
  }
};
