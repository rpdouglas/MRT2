# 📐 Feature Spec: Dashboard (The Hub)

**Status:** Live (v2.6)
**Architecture:** Client-Side Aggregator with Bounded Queries

## 1. Overview
The Dashboard aggregates data from all modules to generate a real-time "Health Snapshot" using 30-day bounded queries to prevent UI thread locking.

**PROJ-76:** Rank/Level/XP and the Journal-streak/Habit-Fire tile numbers were relocated off the Dashboard to Profile → Achievements to reduce cognitive load (see `docs/projects/76_GAMIFICATION_DASHBOARD_RELOCATION.md`). The `SobrietyHero` widget still shows sobriety duration, milestone confetti/share, and the financial-savings row; Vitality and Workbook bento tiles are unchanged.

## 2. Integrated Components
* **Dynamic Anchor:** A time-aware Quick Action bar (Morning/Afternoon/Evening/Night).
* **Daily Reading Card:** Rotates content based on modality preferences (AA, NA, Dharma, etc.).