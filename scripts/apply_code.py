import os

FENCE = chr(96) * 3
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# =============================================================================
# 1. docs/projects/04.6_SECTOR_5_VITALITY.md
# =============================================================================
project_content = r'''# 📁 Project 04.6: Sector 5 - The Pulse (Dogfooding & Polish)

**Status:** 🟡 Active
**Primary Persona:** David (The Crisis User), Ned (The Pink Cloud)
**Objective:** Rigorously stress-test the Vitality module's hardware APIs, animation syncing, and mathematical scoring to ensure a flawless somatic grounding experience.

---

## 1. The Executive Summary
**User Story:** * **As** David (experiencing a craving/panic attack), I want to use the 4-7-8 Breathwork Pacer so that I can regulate my nervous system.
* **As** Ned, I want to log my gym workouts and meals so I can achieve a 100% Bio-Rhythm score.

**Competitive Gap:** Other apps offer static text instructions for breathing. MRT offers a real-time, hardware-aware pacer that prevents the screen from sleeping.

---

## 2. Implementation Phases (The Dogfooding Plan) 🏗️

### Phase 1: The Bio-Rhythm Engine (Logic & Math)
* **The "99.9%" Bug:** The app currently adds `33.3` for each of the 3 logs (Movement, Fuel, Breath). Does this result in `99.9%` instead of `100%` on the UI due to floating-point math?
* **The Midnight Reset:** If a user travels across time zones, does the local `startOfDay` calculation accurately reset their ring to 0% at exactly local midnight?

### Phase 2: The Somatic Safeguard (Hardware Validation)
* **The WakeLock Test:** Does `navigator.wakeLock.request('screen')` successfully prevent an iOS and Android device from dimming during a 3-minute breathwork session?
* **The Background Test:** If the user minimizes the app to check a text message and comes back, does the WakeLock gracefully re-engage, or does the app crash?

### Phase 3: The Crisis UX (Animation Sync)
* **The Drift Test:** The `setInterval` in JS fires every 1000ms. The CSS transition takes 4000ms. If the browser lags, do the visual ring and the text instructions fall out of sync?
* **The Haptic Feedback:** Does `navigator.vibrate(50)` trigger correctly upon saving a log, providing that crucial micro-reward for "Ned"?

### Phase 4: Data Integration (The Vault Cross-Pollination)
* **Tag Integrity:** When a user logs a "Lunch" fuel entry, does it correctly format as a Journal Entry in Firestore?
* **Virtual Module Rendering:** Do these Vitality logs render beautifully in the `JournalHistory.tsx` timeline, or do they look like broken/empty journal cards?

---

## 3. QA & Verification 🧪
* [ ] **Unit Tests:** Verify `calculateVitalityStats` in `gamification.test.ts` accurately calculates streaks bridging across midnight.
* [ ] **The Subway Test:** Start the breath pacer while offline. Save the session. Verify it queues locally and syncs to Firestore upon reconnection.
'''

# =============================================================================
# 2. docs/SPRINT_BOARD.md
# =============================================================================
sprint_board_content = r'''# 🏃 Active Sprint Board

**Sprint:** 4.8 "The Crucible: Dogfooding & Polish"
**Start Date:** 2026-03-05
**Goal:** Perform rigorous manual QA ("Dogfooding") to identify and eradicate UX friction in Tasks, Vitality, Wisdom, and Insights.

## ✅ Sprints 1-4: Foundation & Ledger (Completed)
- [x] Auth UI, Onboarding Redirect, Dashboard Identity, Journal Cache.
- [x] Sector 4: The Ledger (Tasks) fully scaled, time-zone hardened, and Virtuoso grouped.

## 🟡 Sprint 4.8: The Dogfooding Phase (Active)

### 📍 Sector 5: The Pulse (Vitality) - [ACTIVE FOCUS]
- [ ] **Phase 1: Math & Timezones:** Verify the 100% Bio-Rhythm calculation and midnight resets.
- [ ] **Phase 2: Hardware:** Verify `useWakeLock` prevents screen dimming and handles backgrounding gracefully.
- [ ] **Phase 3: Animation Sync:** Ensure the CSS breathing circle perfectly matches the 4-7-8 JS interval without drifting.
- [ ] **Phase 4: Data Flow:** Verify Vitality logs render correctly inside the Journal History tab without breaking the UI.

### ⏳ Sector 6 & 7 (Pending)
- [ ] **Sector 6: The Compass (Wisdom):** Test auto-save latency, mobile keyboard UX, and AI coaching.
- [ ] **Sector 7: Insights Log:** Test rendering of massive AI responses and markdown parsing.

## 🧊 Backlog (Sprint 5+)
- [ ] **PROJ-09:** The GTM Engine (VitePress Rewrite)
- [ ] **PROJ-05:** The Service Network (Encrypted Rolodex + Secure Drop)
- [ ] **PROJ-10:** Crisis & Momentum (Urge Surfer + Freedom Calculator)
- [ ] **PROJ-14:** The Deep Mind (Local RAG + Rich Media)
- [ ] **PROJ-07:** The Launch Engine (TWA Wrapper + Push Notifications)
'''

def write_file(relative_path, content):
    absolute_path = os.path.join(PROJECT_ROOT, relative_path)
    dirname = os.path.dirname(absolute_path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    final_content = content.replace("__FENCE__", FENCE).strip() + "\n"
    with open(absolute_path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Created/Updated: {absolute_path}")

if __name__ == "__main__":
    print("🚀 Initializing Sector 5 Project Plan...")
    write_file("docs/projects/04.6_SECTOR_5_VITALITY.md", project_content)
    write_file("docs/SPRINT_BOARD.md", sprint_board_content)
    print("✨ Sector 5 Dogfooding Plan is locked and loaded.")