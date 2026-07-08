# 📁 Project 56: Sobriety Hero Color Themes

**Status:** 🟢 Done
**Primary Persona:** Ned (with secondary benefit to Walt)
**Objective:** Let users pick a color scheme for the dashboard SobrietyHero card, via a swatch button on the hero itself and a matching section in Profile.

---

## 1. The Executive Summary
**User Story:** As Ned, I want to change the color of my sobriety hero card so that my dashboard feels personalized and rewards me for engaging with the app, without adding any friction to David's crisis-first dashboard experience.
**Competitive Gap:** Sobriety trackers like "I Am Sober" offer a fixed brand color; a lightweight, no-cost personalization touch differentiates MRT's gamification layer without diluting the crisis-first default view.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** No. `heroColor` is a cosmetic UI preference, not PII or emotional/recovery content.
* [x] **Encryption Strategy:** Not applicable. Stored as plaintext on `users/{uid}` (profile metadata), consistent with the CLAUDE.md ZK boundary table — `users/{uid}` is already unencrypted.
* [x] **Key Rotation:** Not applicable. `heroColor` is not part of any encrypted payload, so `executePinRotation` requires no changes.

---

## 3. Schema & Architecture 🗄️

**Firestore Collections Impacted:**
* `users/{uid}`: adds one optional field, `heroColor`.

**Types (`src/lib/db.ts`):**
```typescript
export type HeroColorKey = 'amber' | 'sky' | 'emerald' | 'violet' | 'rose';

export interface UserProfile {
  // ...existing fields
  heroColor?: HeroColorKey; // defaults to 'amber' (today's look) when absent
}
```

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
* `src/lib/heroColors.ts` — `HERO_COLORS: Record<HeroColorKey, HeroColorTheme>`, a fully-spelled Tailwind class lookup table (gradient, shadow, accent text, glow, swatch chip) per preset, following the existing `ListInput.tsx` color-lookup idiom so Tailwind's JIT compiler can statically see every class.
* `src/hooks/useHeroColor.ts` — TanStack `useMutation` hook (optimistic update + rollback + `invalidateQueries(['profile', uid])`), modeled on `useReadingPreferences.ts`'s `updateModalities`. Writes `setDoc(users/{uid}, {heroColor}, {merge:true})`.
* No new Firestore security rules required — `heroColor` is a field on a document users already read/write.

### Phase 2: UI/UX & Gamification
* `src/components/SobrietyHero.tsx` — new `SwatchIcon` button at `top-3 left-3` (mirrors the existing Share button's `top-3 right-3` hover/opacity treatment), opening an inline swatch popover; all previously-hardcoded orange classes (card gradient/shadow, Share button + "Tap Share" pill accent color, decorative glow) now resolve through `getHeroColorTheme(userProfile?.heroColor)`. Hidden during PNG export via the existing `{!isExporting && ...}` guard, so the milestone-share image is unaffected.
* `src/pages/Profile.tsx` — added a "Hero Appearance" section in the General tab (same `HERO_COLORS` table, same hook) as the durable, discoverable settings home — selecting a swatch persists immediately rather than waiting for the page's main "Save Changes" button, matching `ModalitySelector`'s toggle-on-tap pattern.
* **Somatic Check:** No stress induced — swatches are neutral color choices, not evaluative feedback. Button is corner-positioned, low-opacity-until-hover on desktop, same treatment as the pre-existing Share button, so it does not add visual noise to David's primary read path (the centered day/month/year counters).
* **Reward:** Not tied to XP directly; it's a low-friction personalization affordance for Ned's Pink Cloud engagement.

### Phase 3: Edge Cases
* [x] `navigator.onLine` false: `useHeroColor`'s optimistic `onMutate` updates the UI immediately; TanStack Query retries the underlying `setDoc` when back online. Last-write-wins merge write, safe to retry.
* [x] `isVaultUnlocked` false: not applicable — `heroColor` never touches `crypto.ts` or the encrypted vault.
* [x] 320px screen: swatch popover uses a fixed 5-swatch row (`h-7 w-7` circles) sized to fit comfortably under the hero's left edge on the smallest supported viewport.
* [x] No `heroColor` set (existing users): falls back to `'amber'` via `getHeroColorTheme`'s default parameter — renders identical to the pre-feature orange gradient, zero migration needed.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** N/A new unit test file — verified via `npm run check` (lint + test + build) and manual dashboard/profile walkthrough (see verification steps below).
* [x] **The Subway Test:** Offline color selection updates the hero instantly (optimistic cache write) and syncs once connectivity returns.
* [x] **The "Lost PIN" Test:** N/A — `heroColor` is unencrypted profile metadata, unaffected by vault reset/crypto-shredding.
