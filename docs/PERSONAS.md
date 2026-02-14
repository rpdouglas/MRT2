# 👥 Persona-Based Development Model

Features must pass the "Persona Check" based on the user's emotional state, stage of recovery, and technical environment.

## 🌍 The Users (The Recovery Journey)
*Goal: Sobriety, Stability, and Growth*

### 1. "David" (The User in Crisis)
* **Stage:** Day 1 to 30. Acute distress, high anxiety, cravings.
* **Goal:** De-escalate immediate urges. Access help instantly.
* **UX Constraint:** **Zero Friction.**
    * *Rule:* No complex navigation. SOS button must be visible in < 1s.
    * *Rule:* No login timeouts during active crisis usage.
    * *Rule:* "Urge Log" must be accessible with 1 tap.
* **Tech Needs:** Offline capability (PWA) is critical as they may be in poor signal areas.

### 2. "Ned" (The Pink Cloud)
* **Stage:** 30 to 90 Days. Optimistic, building habits, eager to track progress.
* **Goal:** Gamification and streak tracking.
* **UX Constraint:** **Visual Reward.**
    * *Rule:* Dashboard must prominently display clean time/streaks.
    * *Rule:* Positive reinforcement (confetti/haptics) on task completion is essential.
    * *Rule:* Needs "Quick Add" for daily tasks to maintain momentum.

### 3. "Lisa" (The Service Superstar)
* **Stage:** 7 Years (Maintenance). High-functioning, high-stress.
* **Goal:** Manage sponsee commitments (Step 12) without burnout.
* **UX Constraint:** **Boundary Management.**
    * *Rule:* "Sponsee Dashboard" must organize commitments efficiently to reduce mental load.
    * *Rule:* Needs gentle, non-intrusive "Self-Care Check-ins" to prevent compassion fatigue.
    * *Rule:* UI must not be overwhelming or guilt-inducing; avoid complex scheduling tools that add stress.

### 4. "Walt" (The Zen Master / Maintenance)
* **Stage:** Years 1+. Stable, reflective, focused on service.
* **Goal:** Deep journaling, analyzing long-term patterns, mentorship.
* **UX Constraint:** **Data Sovereignty & Depth.**
    * *Rule:* Export tools (PDF/JSON) must work perfectly for their archives.
    * *Rule:* Encryption must be unbreakable but invisible.
    * *Rule:* Features should focus on "Insights" and "Patterns" rather than simple streaks.

## 🔐 Internal Actors (System & Security)

### 5. "The Architect" (Admin/Developer)
* **Goal:** Deploy safe code, manage schema, ensure uptime.
* **Constraint:** **Zero-Knowledge Breach Prevention.**
    * *Rule:* Never implement a feature that allows the server/admin to see the User PIN.
    * *Rule:* Database maintenance scripts (migrations) must account for encrypted blobs.

### 6. "The Recovery Coach" (The Gemini Agent)
* **Role:** AI Analysis & Pattern Recognition.
* **Goal:** Identify triggers in *decrypted* client-side text without storing the analysis permanently.
* **Constraint:** **Privacy First.**
    * *Rule:* AI never retains context between sessions.
    * *Rule:* Data is analyzed in-memory or via secure stateless cloud functions, then discarded.

## 📱 Hardware Contexts

### 7. "The Mobile User" (Primary)
* **Context:** 90% of usage is on mobile (PWA installed).
* **Constraint:** **Thumb-Friendly UI.**
    * *Rule:* Touch targets 44px+.
    * *Rule:* Vitality logs (breathwork) must prevent screen sleep.
