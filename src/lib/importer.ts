/**
 * GITHUB COMMENT:
 * [importer.ts]
 * UPDATED: Strictly typed IncomingEntry to handle both legacy and full-backup formats.
 * Added support for isEncrypted: false flag to ensure re-imported data is prepared for the new vault key.
 */
import { collection, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface NewJournalEntry {
  uid: string;
  content: string;
  moodScore: number;
  sentiment: string;
  weather: { temp: number; condition: string } | null;
  createdAt: Timestamp;
  tags: string[];
  isEncrypted: boolean;
}

interface WeatherObject {
  temp: number;
  condition: string;
}

interface IncomingEntry {
  text?: string;
  mood?: number;
  timestamp?: string;
  content?: string;
  moodScore?: number;
  sentiment?: string;
  createdAt?: string | { seconds: number; nanoseconds: number };
  weather?: string | WeatherObject | null;
  tags?: string[];
}

const parseWeather = (weatherData: string | WeatherObject | null | undefined): { temp: number; condition: string } | null => {
  if (!weatherData) return null;
  if (typeof weatherData === 'string') {
    const match = weatherData.match(/^(.*),\s*(-?\d+)°C$/);
    if (match) return { condition: match[1].trim(), temp: parseInt(match[2], 10) };
    return { condition: weatherData, temp: 0 };
  }
  if (typeof weatherData === 'object' && 'temp' in weatherData) {
    return weatherData as { temp: number; condition: string };
  }
  return null;
};

const mapEntry = (uid: string, entry: IncomingEntry): NewJournalEntry => {
  const mood = entry.moodScore ?? entry.mood ?? 5;
  const clampedMood = Math.max(1, Math.min(10, mood));

  let dateVal = new Date();
  if (entry.createdAt) {
    if (typeof entry.createdAt === 'string') {
      dateVal = new Date(entry.createdAt);
    } else if (typeof entry.createdAt === 'object' && 'seconds' in entry.createdAt) {
      dateVal = new Date(entry.createdAt.seconds * 1000);
    }
  } else if (entry.timestamp) {
    dateVal = new Date(entry.timestamp);
  }

  return {
    uid,
    content: entry.content || entry.text || "",
    moodScore: clampedMood,
    sentiment: entry.sentiment || 'Neutral',
    weather: parseWeather(entry.weather),
    createdAt: Timestamp.fromDate(dateVal),
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    isEncrypted: false
  };
};

export async function importLegacyJournals(uid: string, file: File): Promise<{ success: number; errors: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        if (!db) {
          reject(new Error("Firestore database is not initialized"));
          return;
        }

        const text = e.target?.result as string;
        const json = JSON.parse(text) as Record<string, unknown> | IncomingEntry[];

        let rawEntries: IncomingEntry[] = [];
        if (Array.isArray(json)) {
          rawEntries = json as IncomingEntry[];
        } else if (json && typeof json === 'object' && 'journals' in json && Array.isArray(json.journals)) {
          rawEntries = json.journals as IncomingEntry[];
        } else if (json) {
          rawEntries = [json as IncomingEntry];
        }

        if (rawEntries.length === 0) {
          resolve({ success: 0, errors: 0 });
          return;
        }

        let batch = writeBatch(db);
        let operationCount = 0;
        let successCount = 0;
        let errorCount = 0;

        for (const raw of rawEntries) {
          try {
            if (!raw.content && !raw.text) continue;
            const mappedData = mapEntry(uid, raw);
            const newDocRef = doc(collection(db, 'journals'));
            batch.set(newDocRef, mappedData);
            operationCount++;
            successCount++;

            if (operationCount >= 450) {
              await batch.commit();
              batch = writeBatch(db);
              operationCount = 0;
            }
          } catch (err) {
            console.error("Skipping invalid entry:", err);
            errorCount++;
          }
        }

        if (operationCount > 0) {
          await batch.commit();
        }

        resolve({ success: successCount, errors: errorCount });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}