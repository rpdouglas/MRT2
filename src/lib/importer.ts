import { collection, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

// 1. Define the target format (Your current app schema)
export interface NewJournalEntry {
  uid: string;
  content: string;
  moodScore: number;
  sentiment: string;
  weather: { temp: number; condition: string } | null;
  createdAt: Timestamp;
  tags: string[];
}

// 2. Define the exact Legacy format based on your uploaded JSON
interface LegacyEntry {
  id: string;
  text: string;
  mood: number;
  weather?: string;
  tags?: string[];
  timestamp: string;
}

// 3. Helper to parse weather string "Partly Cloudy, -6°C" -> { condition, temp }
const parseLegacyWeather = (weatherStr?: string): { temp: number; condition: string } | null => {
  if (!weatherStr || typeof weatherStr !== 'string') return null;

  // Regex to capture "Condition" and "Temp" (e.g. "Partly Cloudy, -6°C")
  // Matches: Group 1 (Condition), Group 2 (Number)
  const match = weatherStr.match(/^(.*),\s*(-?\d+)°C$/);

  if (match) {
    return {
      condition: match[1].trim(),
      temp: parseInt(match[2], 10)
    };
  }

  // Fallback if format is different but not empty
  if (weatherStr.trim().length > 0) {
    return { condition: weatherStr, temp: 0 };
  }

  return null;
};

// 4. The Mapper Function
// Converts "LegacyEntry" -> "NewJournalEntry"
const mapLegacyEntry = (uid: string, entry: LegacyEntry): NewJournalEntry => {
  // Handle mood: Legacy app seems to use 0 for unset. New app uses 1-10.
  // We map 0 to 5 (Neutral), and clamp others between 1-10.
  let mood = entry.mood || 5;
  if (mood === 0) mood = 5;
  mood = Math.max(1, Math.min(10, mood));

  return {
    uid,
    content: entry.text || "", // Map 'text' to 'content'
    moodScore: mood,
    sentiment: 'Neutral', // Legacy data doesn't have sentiment, default to Neutral
    weather: parseLegacyWeather(entry.weather),
    createdAt: Timestamp.fromDate(new Date(entry.timestamp)), // Parse ISO string
    tags: Array.isArray(entry.tags) ? entry.tags : [] // Carry over tags
  };
};

// 5. Main Import Function
export async function importLegacyJournals(uid: string, file: File): Promise<{ success: number; errors: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        // FIX: Guard clause to ensure db is initialized
        if (!db) {
            reject(new Error("Firestore database is not initialized"));
            return;
        }

        const text = e.target?.result as string;
        const json = JSON.parse(text);

        // Ensure it's an array
        const rawEntries = Array.isArray(json) ? json : [json];
        
        if (rawEntries.length === 0) {
          resolve({ success: 0, errors: 0 });
          return;
        }

        // Process in batches of 500 (Firestore limit)
        let batch = writeBatch(db);
        let operationCount = 0;
        let successCount = 0;
        let errorCount = 0;

        for (const raw of rawEntries) {
          try {
            // Validate essential fields before mapping
            if (!raw.timestamp) {
              console.warn("Skipping entry without timestamp:", raw.id);
              errorCount++;
              continue;
            }

            const mappedData = mapLegacyEntry(uid, raw as LegacyEntry);
            
            // Generate a new ID for the document (ignoring legacy ID to avoid collision/format issues)
            const newDocRef = doc(collection(db, 'journals'));
            batch.set(newDocRef, mappedData);
            
            operationCount++;
            successCount++;

            // If we hit 450 (safety buffer below 500), commit and restart batch
            if (operationCount >= 450) {
              await batch.commit();
              batch = writeBatch(db); // New batch
              operationCount = 0;
            }
          } catch (err) {
            console.warn("Skipping invalid entry:", raw.id, err);
            errorCount++;
          }
        }

        // Commit any remaining ops
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