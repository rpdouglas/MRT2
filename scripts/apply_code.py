import os

# FENCE pattern to protect markdown backticks
FENCE = chr(96) * 3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# =============================================================================
# 1. docs/PERSONAS.md (Internal Developer & UX Guide)
# =============================================================================
personas_content = r'''# 👥 Persona-Based Development Model

Features must pass the "Persona Check" based on the user's emotional state, stage of recovery, fellowship culture, and technical environment.

## 🌍 The Users (The Recovery Journey)

### 1. "David" (The User in Crisis)
* **Fellowship:** CA (Cocaine Anonymous)
* **Stage:** Day 1 to 30. Relapsed after 2 years. Acute distress, high anxiety.
* **Demographics:** 32, Tech-literate but currently cognitively overloaded.
* **Environment:** Alone in his bedroom at 2 AM. Screen brightness is low.
* **Goal:** De-escalate immediate urges. Access help instantly.
* **UX Constraint:** **Zero Friction.**
    * *Rule:* No complex navigation. SOS button must be visible in < 1s.
    * *Rule:* "Urge Log" and Voice-to-Vault must be accessible with 1 tap.
* **Asset Metadata (VitePress/Marketing):**
    * `headshot`: `/assets/personas/david_headshot.png`
    * `bio_feature`: `/assets/personas/david_bio.jpg`
    * `full_body`: `/assets/personas/david_full.png`
    * `looking_left`: `/assets/personas/david_left.png`

### 2. "Ned" (The Pink Cloud)
* **Fellowship:** NA (Narcotics Anonymous)
* **Stage:** 30 to 90 Days. Optimistic, manic energy, eager to track progress.
* **Demographics:** 24, Digital Native. Expects high-fidelity UI and gamification.
* **Environment:** At the gym, on the bus, constantly moving.
* **Goal:** Gamification, clean-time tracking, and building daily habits.
* **UX Constraint:** **Visual Reward.**
    * *Rule:* Dashboard must prominently display clean time/streaks.
    * *Rule:* Positive reinforcement (confetti/haptics) on task completion is essential.
* **Asset Metadata (VitePress/Marketing):**
    * `headshot`: `/assets/personas/ned_headshot.png`
    * `bio_feature`: `/assets/personas/ned_bio.jpg`
    * `full_body`: `/assets/personas/ned_full.png`
    * `looking_left`: `/assets/personas/ned_left.png`

### 3. "Lisa" (The Service Superstar)
* **Fellowship:** AA (Alcoholics Anonymous)
* **Stage:** 7 Years (Maintenance). High-functioning, high-stress, sponsors 5 women.
* **Demographics:** 45, Working professional, uses her phone primarily for communication/email.
* **Environment:** In her car immediately after chairing a meeting.
* **Goal:** Manage sponsee commitments (Step 12) without burning out.
* **UX Constraint:** **Boundary Management.**
    * *Rule:* "Sponsee Dashboard" must organize commitments efficiently to reduce mental load.
    * *Rule:* Needs gentle, non-intrusive "Self-Care Check-ins" (Vitality Module).
* **Asset Metadata (VitePress/Marketing):**
    * `headshot`: `/assets/personas/lisa_headshot.png`
    * `bio_feature`: `/assets/personas/lisa_bio.jpg`
    * `full_body`: `/assets/personas/lisa_full.png`
    * `looking_left`: `/assets/personas/lisa_left.png`

### 4. "Walt" (The Zen Master)
* **Fellowship:** Recovery Dharma
* **Stage:** 35+ Years. Stable, reflective, focused on mindfulness and sangha.
* **Demographics:** 68, Vietnam Vet. Prefers desktop/tablet. Lower tolerance for tiny touch targets.
* **Environment:** Home office, morning coffee, using a tablet or desktop browser.
* **Goal:** Deep journaling, analyzing long-term patterns, data sovereignty.
* **UX Constraint:** **Data Sovereignty & Accessibility.**
    * *Rule:* Touch targets must be 44px+. Text must be highly legible.
    * *Rule:* Export tools (PDF/JSON) must work perfectly for his archives.
* **Asset Metadata (VitePress/Marketing):**
    * `headshot`: `/assets/personas/walt_headshot.png`
    * `bio_feature`: `/assets/personas/walt_bio.jpg`
    * `full_body`: `/assets/personas/walt_full.png`
    * `looking_left`: `/assets/personas/walt_left.png`
'''

# =============================================================================
# 2. docs/business/06_PERSONA_PLAYBOOK.md (Marketing Guide)
# =============================================================================
playbook_content = r'''# 🎭 The Persona Playbook (Story-Driven Marketing)

**Strategy:** Recovery isn't a straight line; it's a million different stories. We market MRT by showing how it adapts to four distinct stages and fellowships of recovery.

## 1. David (The Fresh Starter - CA Focus)
* **The Stage:** Day 1. Relapsed after 2 years sober.
* **The Pain Point:** Crushing shame. Isolation. The physical anxiety of early detox.
* **Internal Monologue:** *"I can't believe I'm back here. I can't look my sponsor in the eye. I need help but I'm too ashamed to speak."*
* **The MRT Solution:** * **The Vault:** Absolute, Zero-Knowledge privacy to process his shame without judgment.
    * **The SOS Button:** A 1-tap lifeline at 2 AM when cravings hit.
* **Marketing Vibe:** "Sky Blue" - Hopeful, safe, a gentle reset. *What if the bravest first step you can take is a private one?*

## 2. Ned (The Pink Cloud Pro - NA Focus)
* **The Stage:** 90 Days. 
* **The Pain Point:** Manic energy. Wants to fix his whole life today. High risk of overcommitting, crashing, and burning out.
* **Internal Monologue:** *"I feel amazing! I'm going to the gym twice a day, going to 90 meetings in 90 days, and starting a business!"*
* **The MRT Solution:**
    * **The Ledger (Tasks):** Channels his wild energy into structured, grounded daily momentum.
    * **Smart Resets:** Forgives missed tasks to prevent the shame-spiral of "schedule debt" when he inevitably drops a ball.
* **Marketing Vibe:** Action-oriented, vibrant. Turning chaotic gratitude into grounded momentum.

## 3. Lisa (The Service Superstar - AA Focus)
* **The Stage:** 7 Years. Sponsors 5 women.
* **The Pain Point:** Burnout. Running on fumes. Saving everyone else but neglecting her own Step 10 & 11 maintenance. Resentments building up.
* **Internal Monologue:** *"I've been on the phone with sponsees for three hours. I'm exhausted, but if I don't help them, who will? I haven't meditated in weeks."*
* **The MRT Solution:**
    * **The Pulse (Breathwork):** Immediate somatic regulation to find quiet in the chaos.
    * **The Vault:** A safe, locked place to vent her own resentments about the fellowship without violating her sponsees' trust.
* **Marketing Vibe:** "Warm Amber" - Calm, self-care focused. *If service is key to recovery, is self-care the key to service?*

## 4. Walt (The Grand Sponsor - Recovery Dharma Focus)
* **The Stage:** 35+ Years. Vietnam Vet. 
* **The Pain Point:** Subtle complacency. The shift from "maintaining sobriety" to "active spiritual growth." Hard to see his own patterns after decades.
* **Internal Monologue:** *"I haven't had an urge to drink in 30 years, but why am I so irritable with my wife this month? What am I missing?"*
* **The MRT Solution:**
    * **The Compass (AI Insights):** Scans his entries to find hidden emotional velocity and blind spots he missed in his mindfulness practice.
    * **Data Sovereignty:** Exporting his journals to leave a spiritual legacy.
* **Marketing Vibe:** Deep wisdom, introspection. *How does technology support your path to deeper liberation?*
'''

def write_file(relative_path, content):
    absolute_path = os.path.join(PROJECT_ROOT, relative_path)
    os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
    with open(absolute_path, "w", encoding="utf-8") as f:
        f.write(content.replace("__FENCE__", FENCE).strip() + "\n")
    print(f"✅ Synced: {absolute_path}")

if __name__ == "__main__":
    print("🚀 Fleshing out Personas and Asset Metadata...")
    write_file("docs/PERSONAS.md", personas_content)
    write_file("docs/business/06_PERSONA_PLAYBOOK.md", playbook_content)
    print("✨ Documentation successfully updated with Fellowship alignment and Empathy Mapping.")