import { parseISO } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

// Interface
interface TimeStampedItem {
  createdAt: Timestamp | Date | string | number;
}

// Return Type: Year -> MonthIndex (0-11) -> Array of Items
type NestedGroup<T> = Record<string, Record<number, T[]>>;

/**
 * Groups items by Year -> Month Index.
 * Example: { "2026": { 2: [Entry, Entry] } } // 2 = March
 */
export function groupItemsByYearAndMonth<T extends TimeStampedItem>(items: T[]): NestedGroup<T> {
  const groups: NestedGroup<T> = {};

  items.forEach((item) => {
    let date: Date;

    // Normalize Date
    if (item.createdAt instanceof Timestamp) {
      date = item.createdAt.toDate();
    } else if (item.createdAt instanceof Date) {
      date = item.createdAt;
    } else if (typeof item.createdAt === 'string') {
      date = parseISO(item.createdAt);
    } else {
      date = new Date(item.createdAt);
    }

    const year = date.getFullYear().toString();
    const monthIndex = date.getMonth(); // 0 = Jan, 11 = Dec

    if (!groups[year]) {
      groups[year] = {};
    }

    if (!groups[year][monthIndex]) {
      groups[year][monthIndex] = [];
    }

    groups[year][monthIndex].push(item);
  });

  return groups;
}
