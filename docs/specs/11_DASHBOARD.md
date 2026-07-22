# 📐 Feature Spec: Dashboard (The Hub)

**Status:** Live (v2.6)
**Architecture:** Client-Side Aggregator with Bounded Queries

## 1. Overview
The Dashboard aggregates data from all modules to generate a real-time "Health Snapshot" using 30-day bounded queries to prevent UI thread locking.

**PROJ-76:** Rank/Level/XP and all six bento tiles' stat numbers (Journal streak, Habit Fire, Vitality Rhythm, Workbook Wisdom) were relocated off the Dashboard to Profile → Achievements to reduce cognitive load (see `docs/projects/76_GAMIFICATION_DASHBOARD_RELOCATION.md`). The `SobrietyHero` widget still shows sobriety duration, milestone confetti/share, and the financial-savings row. All six bento tiles (My Journal, My Tasks, My Vitality, My Workbooks, My Games, My Tools) are now plain entry tiles — icon, title, one-line caption — with no stat numbers; the Dashboard no longer queries `journals`/`tasks`/`workbook_answers` at all.

## 2. Integrated Components
* **Dynamic Anchor:** A time-aware Quick Action bar (Morning/Afternoon/Evening/Night).
* **Daily Reading Card:** Rotates content based on modality preferences (AA, NA, Dharma, etc.).