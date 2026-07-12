# 📐 Feature Spec: Vitality (Somatic Health)

**Status:** Live (v2.0)
**Architecture:** Virtual Module (Abstracted Journal Interface)
**Primary Code:** `src/pages/Vitality.tsx` (thin tab shell) — split across `src/hooks/useVitalityEntries.ts` (data layer, ZK-encrypted writes), `src/hooks/useBreathEngine.ts` (breathwork state machine), `src/hooks/useTodaysVitalityLogs.ts` (real-time log feed), `src/lib/vitalityScoring.ts` (bio-balance/mood-inference logic), and `src/components/vitality/{MoveTab,FuelTab,BreathTab}.tsx` (per-tab UI). Split in PROJ-60.

## 1. Overview
The Vitality module is the somatic regulation engine of MRT. It allows users to track physical health (Movement, Fuel) and nervous system regulation (Breathwork). Unlike other modules, it does not store data in a separate collection; instead, it injects structured, tagged entries into the user's `journals` stream.

## 2. Technical Architecture

### A. The "Virtual" Data Model
Vitality entries are standard Firestore documents in the `journals` collection with specific **Tag Signatures**.

| Category | Primary Tags | Metadata (Stored in Content Body) |
| :--- | :--- | :--- |
| **Movement** | `#Vitality`, `#Movement` | Activity Name, Duration (mins), Intensity (Low/Mod/High) |
| **Nutrition** | `#Vitality`, `#Nutrition` | Meal Type, Hunger Type (Physical/Emotional/Boredom), Hydration Count |
| **Breathwork** | `#Vitality`, `#Mindfulness`, `#Somatic`, `#Regulation` | Duration, Technique (e.g., "Box Breathing (4-4-4-4)") |

* **Smart Mood Integration:** To prevent vitality logs from skewing the user's "Average Mood" charts, the module reads the cached `['journals', uid]` React Query data and derives the user's recent average mood (`inferMoodFromRecentEntries` in `src/lib/vitalityScoring.ts`) and injects it into the journal payload, rather than defaulting to `5`.

### B. The Bio-Rhythm Score
A daily 0-100% score that resets at midnight (Local Device Time). It calculates balance across three pillars:
* `+33.3%` if a log exists with tag `#Movement` created *today*.
* `+33.3%` if a log exists with tag `#Nutrition` created *today*.
* `+33.3%` if a log exists with tag `#Mindfulness` created *today*.

## 3. Sub-Features

### 🏃 Movement & 🍎 Fuel Loggers
Standard form inputs that compile into markdown strings and save as Journal entries. Includes a rapid-tap Hydration counter.

### 🌬️ Breathwork Engine (Vitality 2.0)
A clinical-grade somatic anchor combining visual, haptic, and hardware APIs.
* **State Management:** Bypasses React's standard `setState` rendering batching for the core timer. Uses mutable `useRef` hooks (`timeLeftRef`, `currentPhaseIndex`) to ensure the interval perfectly matches real-world seconds without drifting.
* **Visuals (Organic Halo):** Uses a multi-layered CSS `border-radius` morphing animation linked to dynamic `transitionDuration` properties to emulate the expansion of human lungs.
* **Haptic Engine:** Triggers `navigator.vibrate()` on phase boundaries. 
    * `Inhale/Exhale`: Single distinct pulse (`[40]`).
    * `Hold`: Gentle double-tap (`[20, 50, 20]`).
* **Hardware Safeguard:** Utilizes the `useWakeLock` hook (`navigator.wakeLock.request('screen')`) to strictly prevent the device screen from sleeping or dimming while the engine is running.
* **Customization:** Users can select between `4-7-8`, `4-4-4-4` (Box Breathing), or define a custom array. Custom arrays are persisted in `localStorage`.
