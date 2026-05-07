# 📊 Insights & Recovery Capital

The **Insights** page (sidebar icon) is your analytical home — it combines the Recovery Capital Matrix (a monthly holistic check-in) with your full AI Insights log (a history of every Compass analysis you've ever generated).

---

## 1. Recovery Capital Matrix (ROSC)

Recovery Capital is the breadth of internal and external resources you can draw upon to sustain recovery. MRT measures it once per calendar month across four domains defined by SAMHSA's recovery framework:

| Domain | What it reflects |
| :--- | :--- |
| **Health** | Physical and emotional wellbeing, self-care, mood trend |
| **Home** | Stability and safety of your living situation |
| **Purpose** | Meaningful activity — work, service, creativity, family |
| **Community** | Connections with people who support your recovery |

### The Monthly Check-In

Once per calendar month, a **"Start this month's check-in"** button appears at the top of the Insights page. The check-in is rate-limited to one per calendar month — consistent with clinical ROSC methodology and designed to prevent compulsive reassessment.

Tapping it opens a 5-question guided flow (approximately 60–90 seconds):

1. Answer each question on a 1–5 scale using strength-based language — *"Thriving"* at the top, neutral language at the bottom. There is no failure state.
2. All five questions advance automatically — no back button, no form to submit. The last answer triggers the analysis.
3. If the AI analysis fails mid-way (e.g., lost connectivity), your answers are temporarily saved so you don't have to repeat the check-in on retry.

> **David:** The check-in is designed to take under two minutes. Each screen shows only one question. If you dismiss mid-flow, you'll see "Continue your check-in" next time you open Insights.

### Your Radar Chart

After the check-in, an animated radar chart fills in showing your four domain scores (each 1–10). The polygon draws in from the centre over half a second.

* **Score pills** below the chart colour-code each domain: green (≥ 7), amber (4–6), or muted (1–3). No red states.
* **Total score** is shown at the top: e.g., *"Total Recovery Capital: 31/40."*
* **Longitudinal overlay:** Once you have two or more monthly snapshots, the chart overlays both the current and previous month — a solid polygon for this month, a dashed outline for last month. This lets you track how the *shape* of your recovery changes over time.

### History

Past assessments are listed below the current chart as expandable cards. Tap any card to see that month's full radar chart. If your Vault is unlocked, tapping also decrypts the AI-generated narrative, identified strengths, and compassionate growth suggestions for that month.

### Vault-Locked Behaviour

Domain scores (the numbers) are stored unencrypted and are always visible. The AI narrative and suggestions are encrypted — this table shows exactly what requires the Vault:

| Content | Encrypted? | Visible when Vault locked? |
| :--- | :--- | :--- |
| Domain scores (1–10 per domain) | No | Always visible |
| Total score | No | Always visible |
| AI narrative, strengths, growth areas | Yes (AES-GCM) | Blurred — *"Unlock vault to read your recovery story."* |
| Check-in CTA button | — | Hidden — analysis requires decrypting your journals before sending to Gemini |

### Free vs. Premium

| | Free | Premium |
| :--- | :--- | :--- |
| Monthly check-in | ✅ | ✅ |
| Domain scores from self-report | ✅ | ✅ |
| Gemini reads your last 30 journal entries | ❌ | ✅ |
| Blended AI score + narrative | ❌ | ✅ |
| Identified strengths + growth suggestions | ❌ | ✅ |
| AI output encrypted before storage | — | ✅ |

---

## 2. The AI Insights Log

Below the ROSC panel, the Insights page shows a chronological log of every AI analysis you have generated from the Journal or Workbooks. These are the outputs from the **AI Analysis Wizard (The Compass)** — journal pattern reports, workbook Wisdom Reports, and deep pattern scans.

### Filtering

Use the filter bar at the top to narrow your log:
* **All** — every insight, newest first.
* **Journal** — insights generated from your journal history.
* **Workbook** — Wisdom Reports generated from your step-work answers.

### Navigation

Insights are grouped by **Year** and **Month**. Tap any year or month header to expand it. The total count per group is shown in the header so you can see at a glance how your engagement has changed over time.
