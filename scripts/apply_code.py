import os

FENCE = chr(96) * 3
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

vitality_spec_content = r'''# 📐 Feature Spec: Vitality (Somatic Health)

**Status:** Live (v2.0)
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
| **Breathwork** | `#Vitality`, `#Mindfulness`, `#Somatic`, `#Regulation` | Duration, Technique (e.g., "Box Breathing (4-4-4-4)") |

* **Smart Mood Integration:** To prevent vitality logs from skewing the user's "Average Mood" charts, the module uses React Query to silently fetch the user's 7-day average mood (`getSmartMood`) and injects it into the journal payload, rather than defaulting to `5`.

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
'''

vitality_guide_content = r'''# ❤️ The Pulse (Vitality & Breathwork)

Somatic regulation—managing your physical body—is critical to preventing emotional relapse. The Vitality module tracks three pillars of physical health.

## The Bio-Rhythm Score
At the top of the screen, you will see a percentage ring. Logging an activity in any of the three categories below adds 33.3% to your daily score. Aim for 100% every day!

## 1. Movement
Log physical activities (Walking, Gym, Yoga) along with the duration and intensity. 

## 2. Fuel (Nutrition)
A mindful eating tracker. Log your meals and identify if your hunger was *Physical*, *Emotional*, *Boredom*, or just *Habit*. Includes a quick-tap Hydration (H2O) counter.

## 3. Breathwork (Somatic Anchor)
A real-time visual and physical tool to de-escalate anxiety and lower your heart rate. It features an "Organic Halo" visualization and haptic feedback, allowing you to close your eyes and feel the breathing prompts.

* **Start a Session:** Tap **Start Focus** to begin the pacer.
* **Change the Pattern:** Tap the **Settings icon** (⚙️) above the pacer to select a different rhythm. 
  * **Relax (4-7-8):** Best for falling asleep or severe anxiety.
  * **Box Breathing (4-4-4-4):** Best for regaining focus and clarity.
  * **Custom:** Create your own specific intervals. The app will remember them for next time!
* **Completion:** You must complete at least 5 seconds to log a session. When you log the session, it is securely saved to your Journal Vault.
'''

def write_file(relative_path, content):
    absolute_path = os.path.join(PROJECT_ROOT, relative_path)
    os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
    with open(absolute_path, "w", encoding="utf-8") as f:
        f.write(content.replace("__FENCE__", FENCE).strip() + "\n")
    print(f"✅ Synced: {absolute_path}")

if __name__ == "__main__":
    write_file("docs/specs/06_VITALITY.md", vitality_spec_content)
    write_file("docs-site/guide/05-vitality.md", vitality_guide_content)