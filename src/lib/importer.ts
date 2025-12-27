import { collection, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

// 1. Define the Target Format (Our App's Schema)
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

// 2. Define Inputs: A Union Interface for "Incoming Data"
// This handles both the Old App (Legacy) and New App (Backup) structures safely.
interface WeatherObject {
    temp: number;
    condition: string;
}

interface IncomingEntry {
    // Legacy Fields
    text?: string;
    mood?: number;
    timestamp?: string;
    
    // New Fields
    content?: string;
    moodScore?: number;
    sentiment?: string;
    createdAt?: string | { seconds: number }; // Handles ISO strings OR Firestore Timestamp objects
    
    // Shared / Mixed
    weather?: string | WeatherObject;
    tags?: string[];
}

// 3. Helper to parse weather
// Now accepts a specific Union Type instead of 'any'
const parseWeather = (weatherData: string | WeatherObject | null | undefined): { temp: number; condition: string } | null => {
  if (!weatherData) return null;
  
  // Handle Legacy String format ("Cloudy, 20°C")
  if (typeof weatherData === 'string') {
      const match = weatherData.match(/^(.*),\s*(-?\d+)°C$/);
      if (match) return { condition: match[1].trim(), temp: parseInt(match[2], 10) };
      return { condition: weatherData, temp: 0 };
  }
  
  // Handle New Object format
  if (typeof weatherData === 'object' && 'temp' in weatherData) {
      return weatherData;
  }
  return null;
};

// 4. The Mapper Function
const mapEntry = (uid: string, entry: IncomingEntry): NewJournalEntry => {
  // Handle mood mapping (Old uses 0-10, New uses 1-10)
  let mood = entry.moodScore ?? entry.mood ?? 5;
  mood = Math.max(1, Math.min(10, mood));

  // Handle Date parsing (ISO string or Firestore Timestamp object)
  let dateVal = new Date();
  
  if (entry.createdAt) {
      if (typeof entry.createdAt === 'string') {
          dateVal = new Date(entry.createdAt);
      } else if (typeof entry.createdAt === 'object' && 'seconds' in entry.createdAt) {
          dateVal = new Date(entry.createdAt.seconds * 1000); 
      }
  } else if (entry.timestamp) {
      dateVal = new Date(entry.timestamp); // Legacy field
  }

  return {
    uid,
    // Checks 'content' (new) first, falls back to 'text' (old)
    content: entry.content || entry.text || "", 
    moodScore: mood,
    sentiment: entry.sentiment || 'Neutral',
    weather: parseWeather(entry.weather),
    createdAt: Timestamp.fromDate(dateVal),
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    isEncrypted: false 
  };
};

// 5. Main Import Function
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
        const json = JSON.parse(text);

        // --- SMART DETECTION LOGIC ---
        // Typed as IncomingEntry[] so TS knows what to expect
        let rawEntries: IncomingEntry[] = [];
        
        if (Array.isArray(json)) {
            // CASE A: Legacy Array (Old App)
            rawEntries = json as IncomingEntry[];
        } else if (json.journals && Array.isArray(json.journals)) {
            // CASE B: New Full Backup Object
            rawEntries = json.journals as IncomingEntry[];
        } else {
            // CASE C: Single Object wrapper
            rawEntries = [json as IncomingEntry];
        }
        
        if (rawEntries.length === 0) {
          resolve({ success: 0, errors: 0 });
          return;
        }

        // Process in batches
        let batch = writeBatch(db);
        let operationCount = 0;
        let successCount = 0;
        let errorCount = 0;

        for (const raw of rawEntries) {
          try {
            // Skip empty entries
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
            console.warn("Skipping invalid entry:", err);
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