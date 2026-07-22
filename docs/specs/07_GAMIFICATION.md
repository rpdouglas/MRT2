# 📐 Feature Spec: Gamification Engine (Updated)

**Status:** Live (v1.9)
**Asset Engine:** 12-Medallion Circular Pipeline active.
**UI Placement (PROJ-76):** The Rank/Level/XP display no longer renders on the Dashboard's `SobrietyHero` widget — it now lives in Profile → Achievements (`AchievementsTab.tsx`). The XP economy and level/archetype calculation below are unchanged; only the display location moved.

## 1. XP Economy
| Action | XP Value |
| :--- | :--- |
| Journal Entry | 25 XP (+10 for length) |
| Task Completion | 10 (Low) / 25 (Med) / 50 (High) |
| Clean Milestone | 500 XP (per 30 days) + Medallion Badge |
| Recovery Game Completion (PROJ-72) | 20 XP — feeds the `action` bucket, same as Task Completion |

## 2. Milestone Assets
The following medallions are dynamically rendered in `SobrietyHero.tsx`:
- 30, 60, 90 Days
- 4 through 11 Months
- 1 Year
