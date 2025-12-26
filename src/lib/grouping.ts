import { format, isToday, isYesterday, isSameYear, parseISO } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

// FIX: Removed '[key: string]: unknown' to allow specific interfaces like JournalEntry to be passed without error.
interface TimeStampedItem {
  createdAt: Timestamp | Date | string | number;
}

/**
 * Groups a list of items by human-readable date headings.
 * Returns an object where keys are headers (e.g. "Today", "Yesterday")
 * and values are arrays of items.
 */
export function groupItemsByDate<T extends TimeStampedItem>(items: T[]): Record<string, T[]> {
  const groups: Record<string, T[]> = {};

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

    let header: string;

    if (isToday(date)) {
      header = 'Today';
    } else if (isYesterday(date)) {
      header = 'Yesterday';
    } else if (isSameYear(date, new Date())) {
      header = format(date, 'MMMM d'); // e.g. "October 12"
    } else {
      header = format(date, 'MMMM d, yyyy'); // e.g. "October 12, 2024"
    }

    if (!groups[header]) {
      groups[header] = [];
    }
    groups[header].push(item);
  });

  return groups;
}