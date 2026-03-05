# 🚀 Changelog

Stay up to date with the latest features, fixes, and improvements to My Recovery Toolkit.

### v1.1.1 (The Ledger Polish Update)
* **New:** **Future Task Safety:** Added a warning modal to prevent accidentally completing tasks scheduled for later dates, keeping your daily stats accurate.
* **Improvement:** **High-Performance Log:** The completed task history is now virtualized and grouped by Year/Month (just like the Journal Vault), ensuring smooth 60fps scrolling even with thousands of logged habits.
* **Fix:** **Timezone Stability:** Recurring tasks no longer accidentally show up as overdue on the exact day they are created due to timezone calculation bugs.
* **Fix:** **Smart Routing:** Clarified tab routing so exactly 7 days out is pushed to "Later", keeping "This Week" strictly focused on the immediate horizon.

### v1.1.0 (The Visuals & Hardening Update)
* **New:** **Gradient Insights:** Replaced basic charts with a beautiful "Emotional Velocity" area chart and a "Baseline vs Reality" weekly rhythm tracker.
* **New:** **Smart Word Cloud:** Added a filter button to hide specific words from your recurring themes. 
* **New:** **Template Library:** Upgraded journal templates with structured, recovery-focused prompts (e.g., HALT check, Morning Intention).
* **Improvement:** **Journal History:** Grouped entries by Year and Month for easier navigation of long timelines.
* **Security:** **Hardened:** Added comprehensive unit tests for core data operations and verified PIN rotation safety.

### v1.0.1 (Core Polish Update)
* **Improvement:** Journal entries now appear instantly in your History list after saving. No more manual refreshing!
* **Improvement:** Task titles now wrap text naturally, so longer AI-generated Action Plans are fully readable.
* **Fix:** Resolved a bug where deleting a journal entry might leave a "ghost" card until the next login.

### v1.0.0 (Initial Launch)
* **Feature:** Initial Public Release!
* **Feature:** Zero-Knowledge Client-Side Encryption (AES-GCM).
* **Feature:** The Horizon Gamification Dashboard.
* **Feature:** The Pulse (Vitality Tracking & Breathwork).
* **Feature:** The Compass (Gemini 2.5 AI Analysis).
* **Feature:** Task Ledger with Smart Resets.
