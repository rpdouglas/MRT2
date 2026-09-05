# 📁 Project 113: Daily Inspirational Image

**Status:** ✅ Shipped
**Primary Persona:** Ned (early sobriety, wants gamification/positivity touchpoints) — secondary: Lisa (Primary Viral Driver, native share amplifies her role), All (the popup itself is non-persona-specific, same posture as PROJ-79's Daily Crossword)
**Objective:** Surface one of the owner's existing library of hand-made inspirational images (originally created for MRT's Facebook/Instagram accounts) on the Dashboard the first time it's opened each day, lets the user share it via the phone's native share sheet, and lets the user journal specifically about that image — with new images addable at runtime via an admin upload UI, no code deploy required.

---

## 1. The Executive Summary

**User Story:** As any MRT user, I want an inspirational image to greet me the first time I open the app each day, so that I get a small, low-effort moment of positivity — and I want to be able to share it to my own social accounts or journal my reaction to it in one or two taps, without the app ever making that popup something I have to get past to reach SOS or my other tools.

**Competitive Gap:** "I Am Sober," "Reframe," and "Sober Grid" surface generic motivational-quote-of-the-day content, not first-party-authored imagery with a direct line back to the owner's own social presence. Pairing the image with native share and image-specific journaling — rather than a static quote card — is the differentiator: it turns existing marketing content into an in-app engagement + light virality loop (Lisa's role) without adding any AI cost or new consent surface.

**Origin note:** This spec formalizes the architecture review conducted in the 2026-09-04 `/plan` session (see conversation history) that compared three approaches — (1) static images committed to the repo with client-computed or script-seeded rotation, (2) static images with Cloud-Function-scheduled rotation (mirroring PROJ-79's nightly job), and (3) true runtime upload via a new Firebase Storage bucket + Admin Dashboard tab. **Approach 3 was selected** by the product owner specifically because the image library needs ongoing additions without developer/deploy involvement — this is new ground for the app (no Storage/Admin-upload precedent exists today) and is the largest scope of the three options considered.

---

## 2. Security & Zero-Knowledge Audit 🛡️

*This section MUST be completed before any code is written.*

- [x] **Data Sensitivity:** Two different data classes, handled differently:
  - **Image content itself** (the uploaded JPG/PNG files and their `image_library`/`daily_images` metadata) is **not** user data — it's shared editorial content, identical for every user on a given date, uploaded by an admin. No PII, no emotional disclosure. Same posture as `crossword_puzzles`/`daily_readings`.
  - **The journal entry a user writes about an image** is personal recovery content — same sensitivity class as any other journal entry.
- [x] **Encryption Strategy:**
  - `image_library/{imageId}` and `daily_images/{date}` are **not encrypted** — public-to-all-authenticated-users editorial content, same posture as `crossword_puzzles`.
  - The journal entry's `content` is encrypted exactly as today (`journals/{id}.content`, AES-GCM via `src/lib/crypto.ts`) — **unchanged**.
  - New field `journals/{id}.linkedImageId?: string` is **plaintext**, following the existing precedent that journal *metadata* (`moodScore`, `tags`, `weather`) is unencrypted while `content` is encrypted (see `CLAUDE.md`'s ZK table, `journals/{id}` row: "mood/tags/timestamps are plaintext"). Knowing a user journaled *in response to* a specific shared editorial image is not more sensitive than knowing their mood score or tags.
  - `users/{uid}.lastSeenDailyImageDate` is **plaintext** profile metadata — same category as the existing `lastSeenBuildHash` field it's modeled on.
- [x] **Key Rotation:** No new field requires `executePinRotation`/`executeCryptoShredding` coverage. `linkedImageId` is plaintext (not vault-key-derived), same as `tags`; `journals/{id}.content` is already covered by existing rotation/shredding logic and needs no change.
- [x] **Gemini call boundary:** None. This feature makes zero Gemini calls (no AI generation, no AI analysis) — no addition to the nine approved-flow list or the PROJ-79-style server-only exception is needed.
- [x] **New infrastructure surface (flag, not a violation):** This is the first feature in the app to use Firebase Storage. `storage.rules` must be written and reviewed with the same rigor as `firestore.rules` — admin-only write, authenticated-only read, no public bucket access. No existing precedent to copy verbatim; author it explicitly against `firestore.rules`'s `isAdmin()` pattern rather than assuming a permissive Storage default.

---

## 3. Schema & Architecture 🗄️

**Firebase Storage** *(new — first use of Storage in this app)*:
* New bucket path convention, e.g. `daily-images/{imageId}.{ext}`. `storage.rules`: `allow read: if request.auth != null; allow write: if isAdmin();` (mirrors `firestore.rules`'s existing `isAdmin()` helper — reuse it, don't reimplement admin-check logic in Storage rules).
* `firebase.json` gains a `"storage"` config block pointing at the new rules file.

**Firestore Collections Impacted:**
* `image_library/{imageId}` *(new)* — one doc per uploaded image. Admin-write, authenticated-read (same rule shape as `crossword_puzzles`).
* `daily_images/{date}` *(new)* — one doc per calendar date (`YYYY-MM-DD` UTC doc ID, matching `crossword_puzzles`'s convention), assigned by the nightly rotation function or an admin override. Same rule shape.
* `journals/{id}` *(modified)* — adds optional `linkedImageId?: string` (plaintext). No change to existing encrypted `content` field or its rules.
* `users/{uid}` *(modified)* — adds optional `lastSeenDailyImageDate?: string` (plaintext, local `YYYY-MM-DD`), same category as existing `lastSeenBuildHash`.

**Types (`src/lib/db.ts`):**
```typescript
export interface ImageLibraryEntry {
  id: string;
  storagePath: string;
  downloadUrl: string;
  caption?: string;
  attribution?: string;
  tags?: string[];
  uploadedAt: Timestamp;
  uploadedBy: string;       // admin uid
  lastShownDate?: string;   // 'YYYY-MM-DD', UTC — drives round-robin rotation
}

export interface DailyImageRecord {
  date: string;              // 'YYYY-MM-DD' UTC, doc ID
  imageId: string;
  storagePath: string;
  downloadUrl: string;
  caption?: string;
  assignedAt: Timestamp;
}

// Added to the existing JournalEntry interface:
//   linkedImageId?: string;  // plaintext — DailyImageRecord.imageId this entry responds to

// Added to the existing UserProfile interface:
//   lastSeenDailyImageDate?: string; // plaintext, local date, drives the once-per-day popup
```

**Existing infrastructure this reuses rather than duplicates:**
* `useDailyCrossword.ts` — pattern to clone for `useDailyImage.ts` (TanStack Query + `getDoc`, UTC-date doc key, `staleTime` ~1h).
* `Dashboard.tsx`'s changelog-toast `useEffect` (lines ~57-68, comparing `userProfile.lastSeenBuildHash` against the current build hash) — pattern to clone for the once-per-day image popup, substituting `lastSeenDailyImageDate` vs. today's local date.
* `DynamicAnchorWidget.tsx`'s `handleJournalFromReading` — pattern to clone for "journal about this image," pre-filling `JournalEditor`'s `initialContent`.
* `useShareImage.ts` — its internal `File` + `navigator.share`/download-fallback logic (currently only reachable after an `html-to-image` DOM snapshot) should be extracted into a standalone helper (e.g. `shareFile(blob, filename, title, text)`) so this feature can share the original uploaded image directly (`fetch(downloadUrl) → blob → shareFile(...)`) without adding an unnecessary DOM-snapshot step. `useShareImage` itself keeps calling the extracted helper after `toPng()`, so milestone/game share behavior is unchanged.
* `generateDailyCrossword` (`functions/src/index.ts`) — `onSchedule` pattern to clone for the new `generateDailyImage` nightly rotation function.
* `firestore.rules`'s `isAdmin()` helper — reuse for both the two new Firestore collections and the new `storage.rules`.

---

## 4. Implementation Phases 🏗️

### Phase 1: Storage, Data & Rotation
* Add `storage.rules` + `firebase.json` Storage config.
* Add `image_library`/`daily_images` collections + Firestore rules.
* `generateDailyImage` scheduled Cloud Function: if tomorrow's `daily_images/{date}` doc doesn't already exist (an admin may pre-schedule a specific image for a specific date), pick the oldest-`lastShownDate`/never-shown image from `image_library` (round-robin, no repeats until the pool cycles), write the `daily_images/{date}` doc, and update that image's `lastShownDate`.
* `useDailyImage.ts` hook, cloned from `useDailyCrossword.ts`.

### Phase 2: Admin Upload UI
* New "Inspirational Images" tab in `src/pages/AdminDashboard.tsx` — multi-file upload to Storage, with caption/attribution/tags form fields written to `image_library`. This is the first admin-content-upload surface in the app; no existing tab to extend.
* **Somatic Check:** captions/attribution are optional — an admin uploading a batch of images shouldn't be blocked by required metadata fields.

### Phase 3: Dashboard Popup, Share & Journal
* `DailyImageModal` component + `Dashboard.tsx` mount-time `useEffect` (clone of the changelog-toast pattern), gated on `users/{uid}.lastSeenDailyImageDate`.
* **Somatic Check / David crisis-first floor:** the modal must be trivially dismissible (single tap, no confirmation) and must never block or delay access to SOS or other crisis-adjacent navigation — it is a dismissible overlay, not a route gate.
* Share button: `fetch(downloadUrl) → blob → shareFile(...)` (extracted helper from `useShareImage.ts`) — shares the original image file as-is (it already carries the app's watermark per the product owner's direction; no branded-card compositing needed for this flow, unlike `SobrietyHero`'s milestone card).
* "Journal about this" button → opens `JournalEditor` with `initialContent` referencing the image's caption (clone of `handleJournalFromReading`'s content-templating), and on save sets `linkedImageId` to the image's `imageId`.
* **Reward:** no XP/streak tie-in — this is a reflective touchpoint, not a gamification mechanic, matching the Daily Crossword's precedent of explicitly having no score.

### Phase 4: Edge Cases
* [ ] `navigator.onLine` is false → `useDailyImage` serves the cached TanStack Query result if already fetched that day; if never fetched, the popup simply doesn't fire (no error state blocking the dashboard).
* [ ] `isVaultUnlocked` is false → the image popup and share button work without unlocking (image content isn't encrypted); the "journal about this" button follows existing `JournalEditor` behavior when the vault is locked (same guard clause pattern already used elsewhere: `if (!isVaultUnlocked) return;` / existing locked-state messaging).
* [ ] `navigator.share` unsupported (desktop browsers) → falls back to a download link, matching `useShareImage.ts`'s existing fallback exactly.
* [ ] 320px screen (iPhone SE) → `DailyImageModal` image + caption + two action buttons (share, journal) must not require horizontal scroll or overflow — needs a real layout pass during implementation.
* [ ] `image_library` pool has zero images (before the admin's first upload, or a fresh dev/emulator environment) → `generateDailyImage` no-ops and `useDailyImage` returns an empty state; `Dashboard.tsx`'s popup effect must not fire (and must not error) when there's no `daily_images/{today}` doc.

---

## 5. QA & Verification 🧪

* [ ] **Unit Tests:** `generateDailyImage`'s round-robin selection logic (never repeats before the pool cycles, handles an empty pool); `useDailyImage.ts` fetch/cache behavior; `linkedImageId` write-through in the journal mutation.
* [ ] **The Subway Test:** popup/share/journal behavior with `navigator.onLine === false`, per Phase 4 above.
* [ ] **The "Lost PIN" Test:** confirm `journals/{id}.content` for an image-linked entry still round-trips through `executePinRotation`/`executeCryptoShredding` exactly as any other journal entry (no special-casing needed since `linkedImageId` is plaintext and untouched by rotation).
* [ ] **Rules test:** `storage.rules` and both new Firestore collections reject non-admin writes and allow authenticated reads, via the Firebase emulator.
* [ ] **David crisis-first check:** confirm the popup never sits between app-open and SOS — manual walkthrough with the modal open, verify SOS/crisis nav is still reachable in ≤1 extra tap (dismiss, then normal nav).

---

## 6. Open Questions

Resolved during implementation (2026-09-05), not silently assumed:

| # | Question | Resolution |
|---|---|---|
| 1 | Should `image_library` support soft-delete/retire (an admin wants to stop showing an image without deleting the file), or is hard-delete sufficient for v1? | **Deferred.** Phase 2 shipped upload + read-only browse only, no delete/edit at all — an unspec'd interaction (hard-delete an in-rotation image? orphan the Storage object? what if it's today's live pick?) that stays out of scope until a real need surfaces. |
| 2 | Should the "journal about this image" flow support viewing past entries linked to a given image (using the new `linkedImageId` field), or does that field stay write-only until a future feature reads it? | **Write-only for now**, as planned — Phase 3 sets `linkedImageId` on creation (`useJournalOperations.ts`'s `addJournalMutation`) but ships no read/query UI against it. Kept it a required-to-add-now field specifically so a future "see what you wrote about this image" view needs no schema migration. |
| 3 | Tier gating for this feature. | **Free for all tiers**, confirmed and shipped as such — no `<PremiumGate>` anywhere in the Phase 3 UI. Not crisis-critical, but shareable/engagement content with zero Gemini calls, so no cost-exposure argument for gating existed either. |

---

*MRT · PROJ-113 Daily Inspirational Image · v0.1 DRAFT · 2026-09-04 · Status: Planned*
