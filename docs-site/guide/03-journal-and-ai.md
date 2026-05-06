# 📖 The Vault (Journal & AI)

The Journal is your secure space to process emotions, log triggers, and track your daily mood. **All entries here are Zero-Knowledge Encrypted.**

## 1. Writing an Entry
* **Text Mode:** Select a template (like "Morning Check-in" or "Urge Log") or free-write.
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

Navigate to the **Insights** page (sidebar icon) to access the Recovery Capital Matrix — a monthly snapshot of your holistic wellbeing across the four dimensions defined by SAMHSA's recovery framework.

### What is Recovery Capital?
Recovery Capital is the breadth of internal and external resources you can draw upon to sustain recovery. MRT measures it across four domains:

| Domain | What it reflects |
| :--- | :--- |
| **Health** | Physical and emotional wellbeing, self-care, mood trend |
| **Home** | Stability and safety of your living situation |
| **Purpose** | Meaningful activity — work, service, creativity, family |
| **Community** | Connections with people who support your recovery |

### The Monthly Check-In
Once per calendar month, a **"Start this month's check-in"** button appears at the top of the Insights page. Tapping it opens a 5-question guided flow (approximately 60–90 seconds):

1. Answer each question on a 1–5 scale using strength-based language — *"Thriving"* at the top, neutral language at the bottom. There is no failure state.
2. All five questions complete automatically — no back button, no form to submit. The last answer triggers the analysis.
3. If the AI analysis fails mid-way (e.g., lost connectivity), your answers are temporarily saved so you don't have to repeat the check-in on retry.

> **David:** The check-in is designed to take under two minutes. Each screen shows only one question. If you dismiss mid-flow, you'll see "Continue your check-in" next time you open Insights.

### Your Radar Chart
After the check-in, an animated radar chart fills in showing your four domain scores (each 1–10). The polygon draws in from the centre over half a second.

* **Score pills** below the chart colour-code each domain: green (≥ 7), amber (4–6), or muted (1–3). No red states.
* **Total score** is shown at the top: e.g., *"Total Recovery Capital: 31/40."*
* **Longitudinal overlay:** Once you have two or more monthly snapshots, the chart overlays both the current and previous month — a solid polygon for this month, a dashed outline for last month. Walt uses this to track how the *shape* of his recovery changes over time.

### History
Past assessments are listed below the current chart as expandable cards. Tap any card to see that month's full radar chart. If your Vault is unlocked, tapping also decrypts the AI-generated narrative, identified strengths, and compassionate growth suggestions for that month.

### Vault-Locked Behaviour
* **Domain scores** (numbers) are always visible — they are stored unencrypted.
* **AI narrative, strengths, and growth suggestions** require the Vault to be unlocked. If locked, those sections show a blurred placeholder: *"Unlock vault to read your recovery story."*
* The **check-in CTA is hidden** when the Vault is locked — the analysis requires decrypting your journal entries before sending them to Gemini.

### Free vs Premium
* **Free tier:** Completes the self-check-in and receives domain scores derived from your answers alone.
* **Premium:** Gemini reads your last 30 journal entries alongside your check-in answers and produces a blended score, a 2–3 sentence narrative, domain-specific strengths, and compassionate growth suggestions — all encrypted before storage.
