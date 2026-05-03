/**
 * PROJ-42: Copy Daily Readings — DEV → PROD
 *
 * Copies the `daily_readings` and `buffer_status` collections from
 * mrt2-app-dev to mrt2-app-prod without re-generating content via Gemini.
 *
 * Prerequisites:
 *   - service-account-dev.json in project root
 *   - service-account-prod.json in project root
 *
 * Usage:
 *   node scripts/copy-readings-to-prod.cjs [--dry-run] [--modality twelve-step-aa]
 *
 * Always do a --dry-run first to confirm counts before writing to prod.
 * DO NOT run until the feature is fully signed off in DEV.
 */

const fs = require('fs');
const path = require('path');

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// ── Config ────────────────────────────────────────────────────────────────────

const COLLECTIONS_TO_COPY = ['daily_readings', 'buffer_status'];
const MODALITIES = [
  'twelve-step-aa',
  'twelve-step-na',
  'twelve-step-ca',
  'recovery-dharma',
  'smart-recovery',
  'secular-stoic',
  'mindfulness-buddhist',
];
const FIRESTORE_BATCH_LIMIT = 500;

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const modalityFilter = args.includes('--modality')
    ? args[args.indexOf('--modality') + 1]
    : null;

  const devKeyPath = path.resolve('./service-account-dev.json');
  const prodKeyPath = path.resolve('./service-account-prod.json');

  for (const [label, keyPath] of [['DEV', devKeyPath], ['PROD', prodKeyPath]]) {
    if (!fs.existsSync(keyPath)) {
      console.error(`Service account not found for ${label}: ${keyPath}`);
      process.exit(1);
    }
  }

  const devApp = initializeApp({ credential: cert(devKeyPath) }, 'dev');
  const prodApp = initializeApp({ credential: cert(prodKeyPath) }, 'prod');
  const devDb = getFirestore(devApp);
  const prodDb = getFirestore(prodApp);

  console.log('\nPROJ-42: Copy Readings DEV → PROD');
  console.log(`Dry run: ${dryRun}`);
  if (modalityFilter) console.log(`Modality filter: ${modalityFilter}`);
  console.log('');

  let totalRead = 0;
  let totalWritten = 0;
  let totalSkipped = 0;

  for (const collection of COLLECTIONS_TO_COPY) {
    console.log(`── Collection: ${collection} ──`);

    let query = devDb.collection(collection);

    // For daily_readings, optionally filter by modality prefix on the doc ID
    if (collection === 'daily_readings' && modalityFilter) {
      // Doc IDs are `{modality}_{date}` — use range query on the prefix
      query = query
        .where('modality', '==', modalityFilter);
    } else if (collection === 'buffer_status' && modalityFilter) {
      query = query
        .where('__name__', '>=', modalityFilter)
        .where('__name__', '<=', modalityFilter);
    }

    const snapshot = await query.get();
    const docs = snapshot.docs;
    totalRead += docs.length;
    console.log(`  Found ${docs.length} documents in DEV`);

    if (docs.length === 0) {
      console.log('  Nothing to copy.\n');
      continue;
    }

    if (dryRun) {
      // Show a sample of what would be written
      const sample = docs.slice(0, 3);
      console.log(`  Sample doc IDs: ${sample.map(d => d.id).join(', ')}${docs.length > 3 ? ` … (+${docs.length - 3} more)` : ''}`);
      totalWritten += docs.length;
      console.log(`  [DRY RUN] Would write ${docs.length} documents to PROD.\n`);
      continue;
    }

    // Check how many already exist in prod to avoid overwriting
    const prodSnapshot = await prodDb.collection(collection).get();
    const existingIds = new Set(prodSnapshot.docs.map(d => d.id));

    const toWrite = docs.filter(d => !existingIds.has(d.id));
    const skipped = docs.length - toWrite.length;
    totalSkipped += skipped;

    if (skipped > 0) {
      console.log(`  Skipping ${skipped} documents already present in PROD`);
    }

    if (toWrite.length === 0) {
      console.log('  All documents already exist in PROD — nothing to do.\n');
      continue;
    }

    // Write in batches of 500
    let written = 0;
    for (let i = 0; i < toWrite.length; i += FIRESTORE_BATCH_LIMIT) {
      const chunk = toWrite.slice(i, i + FIRESTORE_BATCH_LIMIT);
      const batch = prodDb.batch();
      for (const doc of chunk) {
        batch.set(prodDb.collection(collection).doc(doc.id), doc.data());
      }
      await batch.commit();
      written += chunk.length;
      process.stdout.write(`\r  Written: ${written}/${toWrite.length}`);
    }

    totalWritten += written;
    console.log(`\n  Done: ${written} written, ${skipped} skipped.\n`);
  }

  console.log('─────────────────────────────────');
  if (dryRun) {
    console.log(`[DRY RUN] Would copy ${totalWritten} documents to PROD.`);
    console.log('Run without --dry-run to execute.');
  } else {
    console.log(`Complete: ${totalWritten} written, ${totalSkipped} already existed.`);
  }
  console.log('');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
