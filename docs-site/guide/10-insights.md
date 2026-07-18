# 📊 My Insights & Recovery Capital

The **Insights** page (sidebar icon) is your analytical home — it combines the Recovery Capital Matrix (a monthly holistic check-in) with your full AI Insights log (a history of every Compass analysis you've ever generated).

<figure class="my-8 text-center">
  <img 
    src="/screenshots/walt-insights.webp" 
    alt="My Insights Dashboard" 
    class="rounded-3xl border-4 border-slate-900 shadow-xl max-w-[280px] sm:max-w-[320px] mx-auto block mb-3"
  />
  <figcaption class="text-xs text-slate-500 font-medium max-w-sm mx-auto">
    <strong>My Insights:</strong> Walt's Emerald Theme (representing long-term reflection) displaying AI-generated pattern summaries, Resilience Pillars, and relapse risk levels.
  </figcaption>
</figure>

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

### Your Pill Capsules

After the check-in, an animated set of segmented pill capsules fills in, showing your four domain scores (each 1–10). The segments light up sequentially with premium glassmorphic gradients.

* **Score numbers** alongside each domain pill display your exact score, with dynamic trend indicators (e.g., `▲ +2`) showing month-over-month growth.
* **Total score** is shown prominently at the top: e.g., *"31 / 40."*
* **Longitudinal comparison:** Once you have two or more monthly snapshots, the pill segments from your previous month are subtly "ghosted" in the background behind your current score. This lets you instantly visualize your momentum and growth over time.

### History

Past assessments are listed below the current chart as expandable cards. Tap any card to see that month's full pill capsules. If your Vault is unlocked, tapping also decrypts the AI-generated narrative, identified strengths, and compassionate growth suggestions for that month.

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
