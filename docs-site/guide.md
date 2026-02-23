# 📘 User Guide: The 4 Pillars

Welcome to the official manual for **My Recovery Toolkit (MRT)**. MRT is a high-performance, privacy-first digital companion designed to support your recovery journey.

## 1. The Horizon (Dashboard)
The Dashboard is your command center. It provides a real-time snapshot of your recovery momentum.
* **Clean Time & Streaks:** Tracks your continuous days and active habit streaks.
* **Bio-Rhythm:** A daily 0-100% score that measures your balance across three pillars: Movement, Nutrition, and Mindfulness.
* **Level & Archetype:** As you complete tasks and journal entries, you earn XP, leveling up and revealing your recovery archetype (e.g., *Scholar*, *Doer*, *Monk*).

## 2. Recovery Vault (Security)
MRT uses **Client-Side AES-GCM encryption**. Your journal entries and workbook answers are locked behind a 4-digit PIN *before* they ever leave your device.
* **Zero-Knowledge:** We never store your PIN on our servers, and we cannot read your data.
* **The "Lost PIN" Rule:** Because we don't have your key, **we cannot reset your PIN**. If you lose it, your encrypted data is permanently unrecoverable. 
* **Client-Side Search:** You can instantly search your entire journal history. Our search engine decrypts your entries locally in memory, allowing you to find specific words or tags without compromising privacy.

## 3. The Deep Dive (Insights & AI)
Journaling is the core of MRT. Use **Smart Templates** to prompt your daily inventory.
* **Analysis Wizard:** Track emotional patterns over time using our on-demand AI coach (powered by Gemini 2.5). 
* **Trend Indicators:** The Insights tab features rolling 30-day trend arrows, giving you a clear visual indicator of whether your average mood is improving or declining.
* **Interactive Word Cloud:** Tap any word in your Insights Word Cloud to instantly filter your Journal History for that exact trigger or emotion.

## 4. The Spark & Pulse
* **Tasks & Habits:** Manage daily routines in the Ledger. If you miss a recurring habit, MRT performs a **Smart Reset** to help you start fresh tomorrow without schedule debt or guilt.
* **Vitality:** Regulate your nervous system with the built-in **4-7-8 Breathwork** visual pacer, and log your physical movement and fuel.

---

## ☁️ How to Setup Google Drive Auto-Sync
Because a lost PIN results in data loss, we highly recommend enabling Cloud Auto-Sync. This creates a secure, decrypted JSON backup in your personal Google Drive that you control.

1. Go to your **Profile** -> **Data Management**.
2. Ensure you are signed in to MRT using your Google Account.
3. Every 7 days, when you unlock your vault, MRT will silently sync your latest entries to a file named `mrt_backup.json` in your Google Drive. 
4. *Manual Export:* You can also export your data to a beautifully formatted PDF to share with a sponsor or therapist at any time.
