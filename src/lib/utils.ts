// src/lib/utils.ts

/**
 * Processes an array of items in chunks to prevent blocking the main thread.
 * Useful for CPU-intensive tasks like decryption or formatting large datasets.
 * * @param items - The array of data to process.
 * @param chunkSize - How many items to process per tick (e.g., 10).
 * @param processor - The async function to run on each item.
 * @param onProgress - Optional callback for percentage updates (0-100).
 */
export async function processInChunks<T, R>(
  items: T[],
  chunkSize: number,
  processor: (item: T) => Promise<R>,
  onProgress?: (progress: number) => void
): Promise<R[]> {
  const results: R[] = [];
  let processed = 0;

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    
    // Process chunk in parallel
    const chunkResults = await Promise.all(chunk.map(processor));
    results.push(...chunkResults);
    
    processed += chunk.length;
    if (onProgress) {
      onProgress(Math.round((processed / items.length) * 100));
    }
    
    // Yield to main thread to allow UI updates
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return results;
}