# 📐 Feature Spec: Vitality (Somatic Health)

**Status:** Live (v1.0)
**Architecture:** Virtual Module (Abstracted Journal Interface)
**Primary Code:** `src/pages/Vitality.tsx`

## 1. Overview
The Vitality module is the somatic regulation engine of MRT. It allows users to track physical health (Movement, Fuel) and nervous system regulation (Breathwork). Unlike other modules, it does not store data in a separate collection; instead, it injects structured, tagged entries into the user's `journals` stream.

## 2. Technical Architecture

### A. The "Virtual" Data Model
Vitality entries are standard Firestore documents in the `journals` collection with specific **Tag Signatures**.

| Category | Primary Tags | Metadata (Stored in Content Body) |
| :--- | :--- | :--- |
| **Movement** | `#Vitality`, `#Movement` | Activity Name, Duration (mins), Intensity (Low/Mod/High) |
| **Nutrition** | `#Vitality`, `#Nutrition` | Meal Type, Hunger Type (Physical/Emotional/Boredom), Hydration Count |
| **Breathwork** | `#Vitality`, `#Mindfulness`, `#Meditation` | Duration, Technique ("4-7-8") |

### B. The Bio-Rhythm Score
A daily 0-100% score that resets at midnight (Local Device Time). It calculates balance across three pillars:

* **Calculation:**
    * `+33.3%` if a log exists with tag `#Movement` created *today*.
    * `+33.3%` if a log exists with tag `#Nutrition` created *today*.
    * `+33.3%` if a log exists with tag `#Mindfulness` created *today*.
* **Display:** A progress ring in the Vitality Header and on the Dashboard.

## 3. Sub-Features

### 🏃 Movement Logger
* **Inputs:** Activity Name (Text), Duration (Number), Intensity (Select).
* **Behavior:** Appends a standardized formatted string to the journal body.

### 🍎 Fuel (Nutrition) Logger
* **Inputs:** Meal (Breakfast/Lunch/Dinner), Hunger Type (Physical/Emotional), Water (Counter).
* **Purpose:** Helps users identify emotional eating patterns (e.g., HALT - Hungry, Angry, Lonely, Tired).

### 🌬️ Breathwork Engine (4-7-8)
A real-time visual pacer for nervous system regulation.
* **Cycle Logic:**
    1.  **Inhale (4s):** Circle expands, Opacity 100%.
    2.  **Hold (7s):** Circle stays static, Opacity 80%.
    3.  **Exhale (8s):** Circle contracts, Opacity 50%.
* **State:** Managed via `setInterval` and local React state (`breathPhase`).
* **Completion:** User must complete at least 5 seconds to log a session.

## 4. Edge Cases
* **Offline:** Works fully offline. Logs sync via standard Firestore persistence.
* **Timezones:** The "Today" filter uses the device's local start-of-day. Traveling may reset the daily score visually.

## 5. Verification Checklist
* [ ] **Tag Integrity:** Create a Movement log. Go to Journal History. Does it appear with `#Movement` tag?
* [ ] **Score Update:** Log one item. Does header ring show 33%?
* [ ] **Breathwork:** Run the timer for 20 seconds. Save. Does the journal entry show the correct duration (e.g. "0m 20s")?
