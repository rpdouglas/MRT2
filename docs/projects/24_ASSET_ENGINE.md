# 📁 Project 24: The Asset Engine

**Status:** 🟢 Done
**Primary Persona:** The Architect (Admin)
**Objective:** Consolidate, type-check, and compress all static media assets into a single TypeScript dictionary to eliminate 404 errors, reduce bundle size, and accelerate UI scaling.

---

## 1. The Executive Summary
**User Story:** * **As** the Architect, I want a strongly typed centralized asset dictionary so that missing or moved images trigger compile-time errors instead of silent production 404s.
**Competitive Gap:** Many apps suffer from "asset rot" as they scale, leading to bloated download sizes and broken images on poor 3G connections. By forcing WebP compression and strict typing, MRT guarantees a lightweight, bulletproof initial load for users in crisis.

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*
* [x] **Data Sensitivity:** Does this feature handle PII or emotional data? **No.** (Static marketing/UI assets only).
* [x] **Encryption Strategy:** Will this use `src/lib/crypto.ts`? **No.**
* [x] **Key Rotation:** Does this data need to be included in `executePinRotation`? **No.**

---

## 3. Schema & Architecture 🗄️

**Directory Restructuring:**
All assets will be moved from the root `/public/` into semantic subdirectories:
* `/public/assets/ui/` (Chips, UI illustrations)
* `/public/assets/marketing/` (Screenshots, Personas)

**Types (`src/data/assets.ts`):**
```typescript
// The single source of truth for all static imagery
export const ASSETS = {
    personas: {
        david: {
            headshot: '/assets/marketing/david_headshot.webp',
            bio: '/assets/marketing/david_bio.webp'
        },
        // ...
    },
    ui: {
        chips: {
            month1: '/assets/ui/medallion_01.webp',
            // ...
        }
    }
} as const;

// Type helper to ensure components only request valid asset paths
export type AssetPath = typeof ASSETS;
```

---

## 4. Implementation Phases 🏗️

### Phase 1: Media Compression & Cleanup
* Run a batch script (Python/Node) to convert all legacy `.png` and `.jpg` marketing assets to `.webp`.
* Delete unused duplicate assets identified in the Asset Mapping audit.

### Phase 2: The Dictionary
* Create `src/data/assets.ts`.
* Map every optimized WebP file into the deeply nested `ASSETS` constant.

### Phase 3: Component Integration
* Update `Welcome.tsx`, `Links.tsx`, and `SobrietyHero.tsx` to replace hardcoded strings (e.g., `src="/personas/david.jpg"`) with the typed dictionary (e.g., `src={ASSETS.personas.david.headshot}`).

### Phase 4: Edge Cases
* [x] What happens on a 320px wide screen (iPhone SE)? **WebP compression ensures the images load instantly even on throttled 3G networks.**

---

## 5. QA & Verification 🧪
* [ ] **Unit Tests:** Write a basic test in `assets.test.ts` to verify the `ASSETS` object is successfully exported and not undefined.
* [ ] **The Build Test:** Run `npm run build` to ensure TypeScript successfully compiles and verifies all referenced asset paths exist in the components.
