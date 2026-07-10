# 🚀 July 2026 New Features & Code Review Report

## Executive Summary
During July 2026, the **My Recovery Toolkit (MRT)** development cycle resolved several key UX friction points, expanded content libraries, modernized state synchronization, and fortified database security boundaries. These updates focus on improving reliability, increasing engagement via personalization, expanding clinical recovery modalities, and enhancing user privacy.

The updates span seven primary areas:
1. **Guided CBT/REBT Interactive Workflows (`PROJ-50`)**: Transforming passive CBT worksheets into step-locked guided engines.
2. **12-Step Workbook Remediation (`PROJ-55`)**: Rebuilding Steps 2–11 with literature-grounded content and migrating to TanStack Query.
3. **Profile Settings Reliability & UX (`PROJ-58`)**: Implementing full autosaving, deep-linkable routes, custom dialog forms, and strict sanity checks.
4. **Sobriety Hero Card Color Personalization (`PROJ-56`)**: Introducing cosmetic preset options with instantaneous sync.
5. **Notification System Remediation (`PROJ-26`)**: Integrating in-app toasts for foreground push notifications and enforcing robust opt-outs.
6. **Zero-Knowledge PIN Rotation & Crypto-Shredding Scaling (`PROJ-31`)**: Batching resource-intensive encryption operations via cursor pagination.
7. **PostHog Analytics & Lined-Paper Aesthetic**: Launching product analytics and extending the Resentment Burner's tactile style to the journal editors.

---

## 📂 Feature & Code Deep Dive

### 1. Guided CBT/REBT Interactive Workflows (`PROJ-50`)
* **Project Specifications:** [docs/projects/50_GUIDED_CBT.md](file:///workspaces/MRT2/docs/projects/50_GUIDED_CBT.md)
* **Goal:** Alleviate "blank page paralysis" and avoid "cognitive avoidance" by breaking CBT tools into step-locked sequences with contextual coaching cards and AI-driven prompts.

#### Key Architectural Components:
* **`GuidedWorkflowEngine`** ([src/components/tools/GuidedWorkflowEngine.tsx](file:///workspaces/MRT2/src/components/tools/GuidedWorkflowEngine.tsx)): A generic component managing step state, inputs (`textarea` | `list` | `emotion`), navigation, offline checks, and AI prompts.
* **Auto-Save Drafts:** Saves a snapshot to `sessionStorage` every 30 seconds. On mount, if a draft is found, it prompts the user to "Resume" or "Start Fresh". Partial saves write to Firestore as journal entries with the `['SMART Tool', toolType, 'DRAFT']` tags, which are excluded from pattern analysis.
* **AI Coaching prompts:** Integrated using `gemini-2.5-flash-lite` via `generateCBTCoachingPrompt` in [src/lib/gemini.ts](file:///workspaces/MRT2/src/lib/gemini.ts). A 5-second debounce ensures that once a user pauses typing on an enabled step, a Socratic follow-up question is generated and cached. This is gated for Premium users only.
* **Thought Record Tool** ([src/components/smart_tools/ThoughtRecordTool.tsx](file:///workspaces/MRT2/src/components/smart_tools/ThoughtRecordTool.tsx)): Tracks 7 columns (Situation, Automatic Thought, Emotions (Before), Evidence For, Evidence Against, Balanced Thought, Emotions (After)).
  * *Emotion Delta:* Displays a comparison of emotion intensities before and after completing the reframe, reinforcing clinical progress.
  * *Cognitive Distortion Picker:* Allows the user to optionally identify distortion patterns (e.g., Catastrophizing, Should Statements) at Step 5.
* **Quadrant CBA Reveal** ([src/components/smart_tools/CBATool.tsx](file:///workspaces/MRT2/src/components/smart_tools/CBATool.tsx)): Reveals quadrants sequentially, enforcing that the user logs the uncomfortable "Advantages of continuing the behavior" first before looking at the advantages of stopping.
* **DENTS Pre-Planning Scenario Mode** ([src/components/smart_tools/DentsTool.tsx](file:///workspaces/MRT2/src/components/smart_tools/DentsTool.tsx)): Prompts for the specific situation first, rewriting the DENTS questions dynamically to reference that scenario.
* **Five Questions Flow** ([src/components/smart_tools/FiveQuestionsTool.tsx](file:///workspaces/MRT2/src/components/smart_tools/FiveQuestionsTool.tsx)): Includes yes/no selectors, guided imagery triggers, and a 1–5 star turnaround rating.

---

### 2. 12-Step Workbook Remediation (`PROJ-55`)
* **Project Specifications:** [docs/projects/55_WORKBOOK_REMEDIATION.md](file:///workspaces/MRT2/docs/projects/55_WORKBOOK_REMEDIATION.md)
* **Goal:** Replace duplicated question stubs in Steps 2–11 with real, literature-grounded literature prompts and migrate data flow to TanStack Query.

#### Architectural Highlights:
* **TanStack Query Migration:** The custom hook `useWorkbookAnswers` ([src/hooks/useWorkbookAnswers.ts](file:///workspaces/MRT2/src/hooks/useWorkbookAnswers.ts)) serves as the single source of truth. It handles decryption at the query fetch layer and encryption on mutation writes. It includes optimistic caching, rollback on failure, and query invalidation.
* **Decryption Safety:** Plaintext is only decrypted in-memory. The decryption trigger is gated strictly on the `isEncrypted` boolean field in the database, replacing a fragile `.includes(':')` text heuristic that caused formatting bugs.
* **Document Stability:** The Firestore document ID is computed as `${workbookId}_${questionId}` and stored under `users/{uid}/workbook_answers/{docId}`.
* **Progress Denominator:** The total question count is computed dynamically in [src/lib/gamification.ts](file:///workspaces/MRT2/src/lib/gamification.ts) based on the structural length of the workbook config, rather than a hardcoded constant. The dashboard stat now shows "Questions Answered: X / Y" instead of a flat percentage, preventing users from seeing progress drops when new questions are added.

```typescript
// From useWorkbookAnswers.ts
const { data: answers = [], isLoading } = useQuery<DecryptedWorkbookAnswer[]>({
  queryKey,
  queryFn: async () => {
    const raw = await getWorkbookAnswers(user!.uid, workbookId);
    return Promise.all(raw.map(async (entry) => {
      if (!entry.isEncrypted) return entry;
      try {
        return { ...entry, answer: await decrypt(entry.answer) };
      } catch {
        return { ...entry, answer: '🔒 [Error Decrypting]' };
      }
    }));
  },
  enabled: !!user,
});
```

---

### 3. Profile Settings Reliability & UX (`PROJ-58`)
* **Project Specifications:** [docs/projects/58_PROFILE_UX_REMEDIATION.md](file:///workspaces/MRT2/docs/projects/58_PROFILE_UX_REMEDIATION.md)
* **Goal:** Close consistency gaps across three incompatible save models, implement deep-linking for tab navigation, prevent silent error swallowing, and add safety bounds to input forms.

#### Key Updates:
* **Autosave Standardization:** The profile page ([src/pages/Profile.tsx](file:///workspaces/MRT2/src/pages/Profile.tsx)) now saves fields automatically on blur or change, matching the behavior of hero preferences. Onboarding fields (`displayName` and `sobrietyDate`) are the only exception and require an explicit "Complete Setup" action *during* onboarding.
* **TanStack Query Integration:** Routed all settings reads and writes through a unified `useUserProfile` hook ([src/hooks/useUserProfile.ts](file:///workspaces/MRT2/src/hooks/useUserProfile.ts)) with key `['profile', uid]`. This resolved a bug where profile updates wouldn't invalidate the dashboard badge status, causing stale layout badges.
* **Headless UI Modal Replacement:** The native browser `prompt`/`alert` checks for resetting the vault have been replaced by a customized, staged Headless UI `Dialog` modal.
* **Deep-Linkable Routes:** In [src/App.tsx](file:///workspaces/MRT2/src/App.tsx), nested routes `/profile/:tab` route directly into the active tabs (`general`, `security`, `data`), letting users bookmark or link directly to specific configuration states. Deep links are guarded during onboarding and redirect to the General tab.
* **Descriptive Import Errors:** In [src/components/profile/DataManagement.tsx](file:///workspaces/MRT2/src/components/profile/DataManagement.tsx), generic error messages are parsed and described using `describeImportError()` to report issues like syntax mismatches (invalid JSON), network outages, or auth timeouts instead of directing users to the browser console.
* **Data Bounds:** Bounded the sobriety-date input to reject future dates or dates older than 100 years back.

---

### 4. Sobriety Hero Color Themes (`PROJ-56`)
* **Project Specifications:** [docs/projects/56_HERO_COLOR_THEMES.md](file:///workspaces/MRT2/docs/projects/56_HERO_COLOR_THEMES.md)
* **Goal:** Let users personalize their dashboard hero experience by selecting from five curated color presets.

#### Key Features:
* **The Swatches:** Presets include Amber (default), Sky, Emerald, Violet, Rose.
* **Color Preset Map:** Declared statically in [src/lib/heroColors.ts](file:///workspaces/MRT2/src/lib/heroColors.ts) using absolute, fully-spelled Tailwind class names. This prevents the Tailwind JIT compiler from purging dynamic CSS strings (e.g., `bg-${color}-400`).
* **Instant Sync:** Managed via `useHeroColor` ([src/hooks/useHeroColor.ts](file:///workspaces/MRT2/src/hooks/useHeroColor.ts)), updating the `heroColor` field on `users/{uid}`. It applies optimistic updates to the local TanStack cache so the card color changes instantly.
* **Watermark Export Integration:** The color picker buttons on [src/components/SobrietyHero.tsx](file:///workspaces/MRT2/src/components/SobrietyHero.tsx) are hidden during PNG snapshot exports, ensuring a clean share card displaying the theme color along with the latest AI-generated insight.

---

### 5. Notification System & FCM Remediation (`PROJ-26`)
* **Project Specifications:** [docs/projects/26_THE_BEACON.md](file:///workspaces/MRT2/docs/projects/26_THE_BEACON.md)
* **Goal:** Fix notification delivery issues, migrate SW tokens, handle foreground messages gracefully, and respect user opt-outs.

#### Key Solutions:
* **Foreground Handling:** Added `listenForForegroundMessages()` in [src/lib/messaging.ts](file:///workspaces/MRT2/src/lib/messaging.ts), which captures active FCM payloads while the app is focused and triggers a non-blocking toast notification via `sonner`.
* **Token Migration:** Implemented `refreshFcmTokenIfStale()`. It forces a token cleanup and registers new keys against the correct service worker path (`firebase-messaging-sw.js` instead of the general VitePWA SW) whenever the service worker version updates.
* **True Opt-Out Enforcement:** Turning off push notification toggles updates the Firestore database to clear the active `fcmTokens` array. This immediately excludes the user's device from the server's push distribution run (`dailyBeacon`).

---

### 6. Zero-Knowledge PIN Rotation & Crypto-Shredding Scaling (`PROJ-31`)
* **Goal:** Prevent the browser UI thread from freezing and avoid memory overflow when rotated PIN keys encrypt or decrypt thousands of documents.

#### Scaling Implementation:
* **Batched Writing with Cursor Pagination:** In [src/lib/rotation.ts](file:///workspaces/MRT2/src/lib/rotation.ts), `executePinRotation` and `executeCryptoShredding` process documents in chunks of 50 (`BATCH_SIZE`) using `limit()` and `startAfter()`.
* **Interrupted Session Resumption:** A `pendingRotation` sub-document state is maintained under `users/{uid}`. If a PIN rotation fails or is interrupted mid-batch, the next attempt recovers the pending salt and verifier. This allows the system to detect and skip already-migrated documents without corruption.
* **Securing Firestore Metadata:** Enhanced [firestore.rules](file:///workspaces/MRT2/firestore.rules) to prevent client-side bypasses. The rules enforce that `tier`, `role`, and `tierSource` keys on the profile document cannot be updated by the client directly.

```typescript
// From firestore.rules
match /users/{userId} {
  allow update: if isAdmin() || (
    isOwner(userId) &&
    !request.resource.data.diff(resource.data).affectedKeys().hasAny(['tier', 'tierSource', 'role'])
  );
}
```

---

### 7. Journal Polish & Lined-Paper Style
* **Goal:** Elevate visual aesthetics to look premium and feel like a tactile journaling tool.
* **Implementation:**
  * Created the `.notebook-paper` class in [src/index.css](file:///workspaces/MRT2/src/index.css) using dual CSS gradients (one linear gradient for the vertical red margin line and one repeating linear gradient for horizontal grey ruled lines).
  * Styled the font to use a serif family matching the Resentment Burner layout.
  * Synchronized the background lines with scrolling text using `background-attachment: local` and fixed the `line-height` at `32px` to align text perfectly with the horizontal rules.
  * Shared the class across the journal history editor, write modal, and dashboard check-in screens.

---

## 🔒 Security & ZK Boundaries Audits
All July 2026 features align with the **Zero-Knowledge Encryption boundary**:
* Plaintext emotional and personal data (such as journal content, workbook reflections, and CBT answers) is encrypted client-side using `AES-GCM` before sending writes to Firestore.
* Plaintext fields are only evaluated at the UI rendering boundary and never leak to global React state, telemetry logs, or cache.
* Configuration preferences (such as reading traditions, dashboard color presets, and push notification statuses) are treated as plaintext profile metadata and stored on the `users/{uid}` document without encryption. This allows the server to query preferences without a vault unlock.
* Admin escalation is strictly blocked at the database level by enforcing Firestore rules that prevent writes to user role or tier keys from standard client auth.

---

## 📈 Quality Assurance & Validation Summary
* The Vitest suite covers critical pathways, including:
  * `useWorkbookAnswers.test.ts`: Validates that queries fetch raw records, execute client-side decrypt runs, and invalidate cache correctly.
  * `Profile.test.tsx`: Checks tabs, onboarding constraints, error rendering, and autosave commits.
  * `ThoughtRecordTool.test.tsx` and `GuidedWorkflowEngine.test.tsx`: Confirms step locks, minLength gates, and emotion re-rating delta math.
* Zero warning conditions during production build runs: `npm run lint` and `npm run check` resolve clean.
