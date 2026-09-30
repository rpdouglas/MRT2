/**
 * PROJ-122: Reconcile buffer_status water marks against actual daily_readings
 *
 * Under the old dev-as-source pipeline, prod only ever synced `daily_readings`
 * from dev — never `buffer_status` — so prod's water marks froze at whatever
 * they were before PROJ-42's generate-once/promote change (all 7 modalities at
 * 2026-10-28 as of 2026-09-30), while prod's actual readings kept extending
 * past them (e.g. twelve-step-na through 2026-12-03). Once prod becomes the
 * generating source, checkBufferHealth trusts those water marks — stale ones
 * would make it regenerate (and overwrite) readings prod already has, all 7
 * modalities at once, inside one 540s run.
 *
 * This recomputes each modality's lastGeneratedDate as the last date in an
 * unbroken run of existing readings starting today (UTC) — the same
 * contiguous-only rule as computeContiguousLastGeneratedDate in
 * functions/src/index.ts, so the generator resumes exactly at the first
 * real gap. If today itself is missing, the water mark is set to yesterday so
 * the next checkBufferHealth run starts generating from today.
 *
 * Prerequisites:
 *   - service-account-prod.json in project root (or pass --key <path>)
 *
 * Usage:
 *   node scripts/reconcile_buffer_status.cjs            # dry run (default) — prints old → new
 *   node scripts/reconcile_buffer_status.cjs --apply    # writes the new water marks
 *   node scripts/reconcile_buffer_status.cjs --key ./service-account-dev.json
 */

const path = require('path');

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// ── Config ────────────────────────────────────────────────────────────────────

const MODALITIES = [
  'twelve-step-aa',
  'twelve-step-na',
  'twelve-step-ca',
  'recovery-dharma',
  'smart-recovery',
  'secular-stoic',
  'mindfulness-buddhist',
];
// Far beyond any real buffer (checkBufferHealth generates 90 days at a time).
const MAX_SCAN_DAYS = 400;

function utcDateString(d) {
  return d.toISOString().slice(0, 10);
}

function addDaysToDate(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return utcDateString(d);
}

// Mirrors computeContiguousLastGeneratedDate (functions/src/index.ts).
function contiguousLastDate(startDate, numDays, writtenDates) {
  let last = null;
  for (let i = 0; i < numDays; i++) {
    const d = addDaysToDate(startDate, i);
    if (!writtenDates.has(d)) break;
    last = d;
  }
  return last;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const keyPath = path.resolve(
    args.includes('--key') ? args[args.indexOf('--key') + 1] : './service-account-prod.json',
  );

  const serviceAccount = require(keyPath);
  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();

  const today = utcDateString(new Date());
  console.log(`Project: ${serviceAccount.project_id} · today (UTC): ${today} · mode: ${apply ? 'APPLY' : 'DRY RUN'}\n`);

  const updates = [];
  for (const modality of MODALITIES) {
    // Single-field filter + in-memory date filter — avoids needing a
    // (modality, date) composite index for a one-off script; the collection
    // is a few hundred docs per modality.
    const snap = await db.collection('daily_readings')
      .where('modality', '==', modality)
      .select('date')
      .get();
    const dates = new Set(snap.docs.map((d) => d.get('date')).filter((d) => d >= today));

    const statusSnap = await db.collection('buffer_status').doc(modality).get();
    const oldMark = statusSnap.exists ? statusSnap.get('lastGeneratedDate') : null;
    const newMark = contiguousLastDate(today, MAX_SCAN_DAYS, dates) ?? addDaysToDate(today, -1);

    const changed = oldMark !== newMark;
    console.log(`${changed ? '→' : '='} ${modality.padEnd(22)} ${String(oldMark).padEnd(12)} → ${newMark}  (${dates.size} readings from today on)`);
    if (changed) updates.push({ modality, newMark });
  }

  if (updates.length === 0) {
    console.log('\nAll water marks already match — nothing to do.');
    return;
  }
  if (!apply) {
    console.log(`\n${updates.length} water mark(s) would change. Re-run with --apply to write.`);
    return;
  }

  const batch = db.batch();
  for (const { modality, newMark } of updates) {
    batch.set(db.collection('buffer_status').doc(modality), { lastGeneratedDate: newMark }, { merge: true });
  }
  await batch.commit();
  console.log(`\n✅ Updated ${updates.length} water mark(s).`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
