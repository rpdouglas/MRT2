# 📁 Project 17: Changelog Beacon

**Status:** ✅ Shipped (2026-03-17, commit `96e8af1` — bundled with AI rate limits and export watermark under one PR). Spec backfilled 2026-07-16 during a governance alignment audit, at which point it was discovered inert in production (see §5) and fixed same-day (see §6). `docs/ROADMAP.md`/`docs/BACKLOG.md` incorrectly carried it as `⚪ Planned | NEW` for the four months since it actually shipped — corrected in the same pass.
**Primary Persona:** All
**Objective:** Give every user a lightweight, dismissible, in-app notice when the app has been updated to a new build, without resorting to an interruptive modal.

---

## 1. The Executive Summary

**User Story:** As any user, I want to know when MRT has shipped an update so I'm aware new features or fixes exist, without being blocked by a modal I have to dismiss before I can use the app.

**Competitive Gap:** N/A — this is retention/trust hygiene, not a differentiator. The stated goal ("without modal fatigue") is the actual design constraint this spec evaluates the implementation against in §5.

---

## 2. Security & Zero-Knowledge Audit 🛡️

* [x] **Data Sensitivity:** None. The only new field, `lastSeenBuildHash`, is a short git-commit hash string — build/version metadata, not user content.
* [x] **Encryption Strategy:** N/A. `lastSeenBuildHash` is written as plaintext on `users/{uid}`, consistent with how other non-sensitive profile/preference fields are handled elsewhere in the schema (`heroColor`, `anchorSettings`, `fcmSwVersion`). **Doc gap noted:** `lastSeenBuildHash` is not yet listed among the example fields in `CLAUDE.md`'s `users/{uid}` ZK boundary table row — low-risk (the row is already `❌ No` / unencrypted), but worth adding next time that table is touched, so the field list stays representative.
* [x] **Key Rotation:** N/A — not vault-derived data, untouched by `executePinRotation`.

---

## 3. Schema & Architecture 🗄️ (as built)

**Firestore Collections Impacted:**
* `users/{uid}`: adds `lastSeenBuildHash?: string` (`src/lib/db.ts:22`) — the short git hash of the build the user last had acknowledged/seen.

**New files:**
* `scripts/generate-build-info.js` — Node script, no external deps beyond `fs`/`crypto`/`child_process`. Computes:
  * `meta.branch` / `meta.globalHash` — current git branch and short commit hash (`git rev-parse --abbrev-ref HEAD` / `git rev-parse --short HEAD`).
  * `meta.env` — `PRODUCTION` if branch is `main`/`master`, `UAT` if `develop`, else `DEV`.
  * `meta.coreHash` — MD5 of the concatenated content-hashes of every file under `src/components/` and `src/lib/` (so any shared-code change bumps every page's derived hash).
  * `pages[pageName].hash` — MD5 of `coreHash + <page file's own content hash>`, per file in `src/pages/`.
  * Writes the result to `src/build-info.json`.
* `src/lib/versioning.ts` — statically imports `src/build-info.json`, exposes `useBuildInfo(): BuildMeta`, `usePageVersion(pageName): string`, `getEnvColor(env)`.

**Modified files:**
* `src/pages/Dashboard.tsx` — the toast + comparison logic (see Phase 3 below).

---

## 4. Implementation Phases 🏗️ (as built)

### Phase 1: Build Manifest Generation
`scripts/generate-build-info.js` is a standalone script, run manually via `node scripts/generate-build-info.js`. It is **not** invoked by any `npm run` script (`build`, `check`, `dev`) and **not** invoked by `.github/workflows/deploy.yml` — confirmed by grep across both at spec-backfill time. `src/build-info.json` is a committed, hand-generated artifact rather than a build-time output.

### Phase 2: Client Consumption
`useBuildInfo()` reads the statically-imported manifest and returns `{ env, branch, globalHash, coreHash, buildTime }`. Because the import is static (`import buildInfoRaw from '../build-info.json'`), whatever was checked in at the last manual run is what every environment — dev, UAT, and prod alike — sees, regardless of how many real commits have shipped since.

### Phase 3: Dashboard Integration
In `Dashboard.tsx` (`useEffect` at line 51, "Changelog Beacon Logic"):
1. On `userProfile` load, if `lastSeenBuildHash` is unset, silently set it to the current `meta.globalHash` (first-run baseline — no toast on a brand-new profile).
2. If `lastSeenBuildHash` is set and differs from `meta.globalHash`, show the toast (`setShowChangelogToast(true)`, deferred one tick via `setTimeout(..., 0)` to avoid a synchronous `setState` inside the effect) and immediately patch `lastSeenBuildHash` to the new hash via `useUserProfile().patchFields` (the same TanStack Query mutation pattern PROJ-58 established — no raw Firestore call).
3. The toast (`CHANGELOG TOAST BEACON`, ~line 226): a dismissible fuchsia banner reading "Update Released! Tap to see what's new." with a **View** link to `https://rpdouglas.github.io/MRT2/support/changelog` (the VitePress-published `docs-site/support/changelog.md`) and a close (✕) button. No re-trigger — dismissing or navigating away doesn't bring it back until the next hash change.

---

## 5. Known Limitations — flagged during 2026-07-16 spec backfill

**🔴 Found non-functional in production (fixed same day, see §6).** `src/build-info.json` was last regenerated **2026-02-17** (`git log -1 -- src/build-info.json`) — over 5 months stale as of the 2026-07-16 audit, and no automated step regenerated it. Since the toast only fires when `meta.globalHash` *changes* between the value baked into the deployed bundle and the value stored on the user's profile, and that baked-in value hadn't changed across any real deploy since February, the toast had almost certainly not fired for any user in production since whenever this file was last hand-regenerated and deployed. Every user who first loaded the dashboard after that point had their `lastSeenBuildHash` silently baselined to the same stale hash and saw nothing since, regardless of the ~20+ features/fixes that shipped in that window (PROJ-46 through PROJ-63 per `ROADMAP.md`'s RECENTLY SHIPPED list).

**Design gap vs. the stated goal.** Even once the manifest is kept current, `globalHash` is a raw git short-hash, not a curated "release" marker — it changes on *every* commit to `main`, including purely internal work (chore/tech-debt PRs, doc-only changes, CI fixes). As implemented, every one of those would trigger "Update Released!" for every user on their next Dashboard load. That's in tension with the feature's own stated purpose ("without modal fatigue") — a toast that fires on doc-only commits is close to the fatigue it was meant to prevent, just moved from a modal to a banner.

**No environment gating.** `meta.env` is computed and available but never checked — the toast fires identically whether the deployed build is DEV, UAT, or PROD.

---

## 6. Fix Applied (2026-07-16)

Item 1 below was implemented same-day as this backfill; items 2–4 remain open follow-up.

1. **✅ Done.** Added `"prebuild": "node scripts/generate-build-info.js"` to `package.json`. npm automatically runs any `prebuild` script before `npm run build`, so this now fires in `.github/workflows/deploy.yml` (which calls `npm run build` at line 150) and in `npm run check`'s nested build step, with no workflow-file changes needed. Verified locally: `npm run prebuild` regenerated `src/build-info.json` with `globalHash` matching current `HEAD` and correctly detected `PRODUCTION` env on the `main` branch.
2. **Open.** Consider decoupling the trigger from the raw commit hash — e.g. gate on a `package.json` version bump, or a manually curated "user-facing" flag per changelog entry — so the toast reflects genuine releases rather than every commit (see the "modal fatigue" design gap in §5).
3. **Open.** Gate the toast to `env === 'PRODUCTION'` so DEV/UAT testing doesn't produce noise.
4. **Open.** Add `lastSeenBuildHash` to `CLAUDE.md`'s `users/{uid}` ZK table field list (documentation-only, no behavior change).

---

## 7. QA & Verification 🧪

* [ ] **Not verified against a live deploy in this backfill** — no production/Firebase access in this environment. Recommend a manual check: confirm whether the currently-deployed `build-info.json` is current, and whether the toast has fired for any real user recently.
* [ ] **Unit Tests:** None exist today for the comparison/patch logic in `Dashboard.tsx`. Recommended coverage once this is next touched: toast does NOT show on first profile load (`lastSeenBuildHash` unset → baseline only); toast DOES show when `lastSeenBuildHash` is set and differs from `meta.globalHash`; `patchProfileFields` is called with the new hash in both cases.
* [ ] **The Subway Test:** Not applicable — the comparison is a pure client-side read against an already-cached profile; no new offline-specific behavior.
* [ ] **The "Lost PIN" Test:** N/A — `lastSeenBuildHash` is unencrypted and untouched by crypto-shredding.

---

*MRT · PROJ-17 Changelog Beacon · v1.0 (backfilled) · July 2026 · Status: ✅ Shipped, inert pending §6 follow-up*
