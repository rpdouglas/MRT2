# 📐 Feature Spec: Gamification Engine

**Status:** Live (v1.6)
**Architecture:** Stateless / On-demand Calculation

## 1. XP Economy
| Action | XP Value |
| :--- | :--- |
| Journal Entry | 25 XP (+10 for length) |
| Task Completion | 10 (Low) / 25 (Med) / 50 (High) |
| Workbook Answer | 15 XP |
| Vitality Log | 15 XP |
| Clean Milestone | 500 XP (per 30 days) |

## 2. Streak Logic
* **Journal Streak:** Consecutive days (Local Time).
* **Habit Fire:** Cumulative sum of ALL active recurring task streaks. This rewards building multiple habits simultaneously.

## 3. Archetypes
Derived from dominant XP source: Scholar (Workbooks), Doer (Tasks), Monk (Vitality), Philosopher (Journal).
