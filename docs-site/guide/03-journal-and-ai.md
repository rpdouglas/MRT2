# 📖 The Vault (Journal & AI)

The Journal is your secure space to process emotions, log triggers, and track your daily mood. **All entries here are Zero-Knowledge Encrypted.**

## 1. Writing an Entry
* **Text Mode:** Select a template or free-write. Templates are grouped by recovery modality — Twelve-Step (e.g. "Morning Intention", "Urge Log"), CBT/SMART, DBT, Mindfulness, Harm Reduction, Reset, Trauma-Informed, ACT, Motivational, MAT, and General — 15 templates in all. Twelve-Step templates drop straight into free-write text; the rest open a short guided form, one labeled box per prompt.
* **Metadata:** Always slide the 1-10 Mood scale and add custom tags (e.g., `#Anxiety`, `#Meeting`) to help the AI track your patterns later.

### Voice-to-Vault
Tap the **Microphone** icon to dictate your entry instead of typing.

1. Speak naturally — describe how you're feeling, what happened, or what's on your mind.
2. When you stop, MRT sends the audio to Google Gemini for transcription.
3. Gemini returns the transcribed text, an estimated mood score (1–10), and a set of suggested tags.
4. Review the pre-filled entry, adjust anything you want, then save.

The final entry is **Zero-Knowledge encrypted** before it is written to Firestore — Gemini sees your audio for transcription only and the processed text is never stored in plain form.

> **Best for David:** If you're in an acute state and can't face a blank text field, Voice-to-Vault removes the friction of typing. Just speak.

## 2. History & Navigation
Navigate to the **History** tab to view past entries.
* **Timeline View:** Your entries are grouped by **Year** and **Month**.
* **Navigation:** By default, only the current month is open. Tap any Year or Month header to expand it and view older entries.
* **Search:** Use the top search bar to filter by keyword or tag. Searching automatically expands all groups to show every matching result.
* **Share:** Click the "Share" icon on any card to decrypt it and copy it to your clipboard for a sponsor or therapist.

## 3. AI Analysis Wizard (The Compass)
Click the floating **Analyze** button to have the AI review your past entries and generate an actionable recovery strategy.

### Usage Limits
To protect the system and ensure fair usage, AI analysis is governed by your tier:
* **Standard (Free) Tier:** Limited to 1 Weekly Analysis per week, 1 Monthly Analysis per month, and 1 Deep Pattern scan per month.
* **Supporter (Premium) Tier:** Unlimited, on-demand access to all AI pattern recognition tools.

## 4. Insights & Analytics
Navigate to the **Insights** tab to view your data visually.

### 📊 Emotional Velocity
This gradient chart shows the "flow" of your mood over the last 14 days.
* The purple curve represents your **Mood**.
* The orange line represents the **Temperature**.
* **Why this matters:** Look for patterns. Does your mood dip when the temperature drops? Do you have "spikey" weeks or smooth sailing?

### 📉 Weekly Rhythm (Baseline vs. Reality)
This chart compares your **Current 30 Days** against your **Previous 30 Days**.
* **Solid Purple Bar:** Your average mood for that day of the week *recently*.
* **Dotted Grey Line:** Your average mood for that day *last month*.
* **How to read it:** If the Purple Bar is taller than the Dotted Line, you are improving compared to your baseline!

### ☁️ Recurring Themes (Word Cloud)
See what you talk about most often.
* **Filtering Noise:** MRT automatically hides common template words like "Morning" or "Check-in."
* **Custom Filters:** Tap the **Eye Slash Icon** in the corner to manage your ignored words. If you want to hide a specific name or place from the cloud, add it there.
* **Deep Dive:** Click any word in the cloud to instantly search your journal history for that specific topic!

## 5. Recovery Capital Matrix (ROSC)

The Recovery Capital Matrix lives on the **Insights** page (its own sidebar icon). It provides a monthly snapshot of your holistic wellbeing across the four SAMHSA recovery domains — Health, Home, Purpose, and Community — using a 5-question guided check-in and an optional AI analysis of your recent journal entries.

For the full walkthrough — including the radar chart, vault-locked behaviour, longitudinal overlays, and free vs. premium differences — see the [Insights guide](/guide/10-insights).
