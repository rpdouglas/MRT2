import os

FENCE = chr(96) * 3

def patch_fellowships():
    file_path = 'src/data/fellowships.ts'
    
    new_content = """import type { ReadingModality } from '../lib/db';

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
"""

    with open(file_path, 'w') as f:
        f.write(new_content)

    print("✅ src/data/fellowships.ts patched successfully.")

if __name__ == "__main__":
    patch_fellowships()