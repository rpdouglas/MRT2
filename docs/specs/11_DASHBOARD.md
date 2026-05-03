# 📐 Feature Spec: Dashboard (The Hub)

**Status:** Live (v2.6)
**Architecture:** Client-Side Aggregator with Bounded Queries

## 1. Overview
The Dashboard aggregates data from all modules to generate a real-time "Health Snapshot" using 30-day bounded queries to prevent UI thread locking. Gamification relies on unencrypted metadata to completely bypass AES-GCM decryption on initial render.

## 2. Integrated Components
* **Dynamic Anchor:** A time-aware Quick Action bar (Morning/Afternoon/Evening/Night).
* **Daily Reading Card:** Rotates content based on modality preferences (AA, NA, Dharma, etc.).