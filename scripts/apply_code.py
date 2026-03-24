import os

FENCE = chr(96) * 3

def update_file(filepath, content):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content.replace('__FENCE__', FENCE))
    print(f"✅ Synchronized: {filepath}")

def main():
    print("🚀 Initiating Post-Sprint Doc Sync...\n")

    # 1. Update Technical Spec
    update_file('docs/specs/04_WORKBOOKS.md', r"""# 📐 Feature Spec: Wisdom (Workbooks & Library)

**Status:** Live (v2.1)
**Storage:** `users/{uid}/workbook_answers/{workbookId_questionId}`

## 1. Data Structure
To prevent state conflicts, each answer is stored as an individual document.
* **ID Format:** `[workbookId]_[questionId]`
* **Fields:** `answer` (Encrypted), `isEncrypted` (Bool), `updatedAt` (Timestamp).

## 2. The Library Hub (`Workbooks.tsx`)
The main entry point is structured via a dual-tab navigation system:
* **Workbooks Tab:** Renders the interactive, 12-Step, Buddhist logic flows, and Specialty workbooks (e.g., Women for Recovery).
* **Literature Tab:** A placeholder for upcoming classic reading materials and daily meditations.

## 3. Reading Experience & Mobile UX (`WorkbookSession.tsx`)
* **Zen Mode:** A full-screen, distraction-free reading layer using `@tailwindcss/typography`.
* **Mobile Keyboard Protection:** The layout uses strict flexbox constraints (`flex-1 min-h-0` on the parent, `shrink-0` on the question text, and `flex-1 resize-none` on the textarea). This ensures that when virtual keyboards appear on iOS/Android, the input area shrinks dynamically rather than pushing the question context off the screen.
* **Data Safety:** Answers are auto-saved to Firestore via `useAutoSave` every 2 seconds. Data is encrypted client-side *before* transmission.

## 4. AI Integration
* **Coach:** On-demand, individual question feedback via `getGeminiCoaching` (powered by ultra-fast `flash-lite`).
* **Compass:** Aggregate section analysis via `analyzeFullWorkbook`. Suggested actions added to Habits are tagged with `source: 'ai'` to route them to the Action Plan tab.
""")

    # 2. Update User Guide
    update_file('docs-site/guide/06-workbooks.md', r"""# 🧭 The Library & The Compass

The Workbooks module is your centralized hub for structured, deep-dive recovery literature (like the 12-Steps, Recovery Dharma, and Women for Recovery). **All answers are Zero-Knowledge Encrypted.**

## The Library Hub
When you open the Workbooks page, you will see two tabs:
* **Workbooks:** Interactive step-work, cognitive behavioral therapy (CBT) exercises, and specialty paths.
* **Literature:** (Coming Soon) A repository of classic reading materials and daily meditations.

## Zen Mode & Auto-Save
* When you open a section, the app enters a distraction-free reading mode.
* The interface is optimized for mobile devices; the question will always stay pinned to the top of your screen even when your keyboard is open.
* As you type your answers, look at the top right of the screen. The app **Auto-Saves** and encrypts your work every 2 seconds.

## The Insight Engine
Stuck on a tough question (like Step 4 resentments)? Type your initial thoughts, then click the **"AI Insight"** button in the sticky toolbar. The Insight Engine will provide gentle, instantaneous reflection to help you dig deeper.

## Asking the Compass
From the main Workbook menu, click the floating **"Consult Compass"** button.
1. Select a specific section (e.g., Step 1), or the entire workbook.
2. The AI will decrypt your answers in-memory, analyze them, and generate a comprehensive Wisdom Report highlighting your **Strengths**, **Blind Spots**, and a 3-step **Action Plan**.
3. Click the `+` icon next to any Action Plan item to instantly add it to your Tasks ledger!
""")

    # 3. Update Changelog
    update_file('docs-site/support/changelog.md', r"""# 🚀 Changelog

### v1.9.0 (The Content Expansion Update)
* **New:** **Women for Recovery Workbook:** Added a completely new, 8-section specialty workbook focused on self-discovery, emotional awareness, boundaries, and overdose survival reframing.
* **Improvement:** **Specialty Themes:** Added a dedicated 'specialty' workbook category that triggers a unique purple (Heart) UI theme to distinguish it from traditional 12-Step or Dharma paths.

### v1.8.0 (The Medallion Update)
* **New:** **Monthly Milestones:** Added unique, high-fidelity circular recovery medallions for every month of the first year of sobriety.
* **Improvement:** **Reliable Sharing:** Implemented an image pre-loader in the Sobriety Hero to ensure medallions appear perfectly in social media exports.
* **Dev:** **Asset Pipeline:** Created Python-based automation for segmenting and processing transparent PWA assets.

Stay up to date with the latest features, fixes, and improvements to My Recovery Toolkit.

### v1.7.0 (The Virality Update)
* **New:** **Milestone Celebrations:** Hitting major clean-time milestones (30 days, 6 months, 1 year) now triggers a celebratory confetti burst on your dashboard and transforms your Sobriety Hero card into a highly shareable badge.
* **Improvement:** **AI Task Clarity:** Tasks generated by the AI Compass or Analysis Wizard now feature a clear "+7 Days" badge in your Action Plan to help you track when they were scheduled.
* **Improvement:** The image export tool now formats your milestones into a perfect square for seamless sharing on Instagram and Facebook.

### v1.6.0 (The Pre-Launch Polish Update)
* **New:** **Changelog Beacon:** You'll now receive a friendly toast notification on your dashboard when a new update is released.
* **New:** **Contextual Help:** Added a quick-access help icon to the main navigation header so you can easily access this User Guide from anywhere.
* **Improvement:** **AI Cost Shield:** Implemented clear rate-limiting for AI Analysis Wizard usage on the Free Tier, while maintaining unlimited access for Premium Supporters.

### v1.5.0 (The Supporter Update)
* **New:** **MRT Supporter Tier:** We have officially launched our Premium "Supporter" tier. By upgrading, you not only unlock unlimited AI Deep Dives, custom Journal Templates, and PDF Exports, but you also help keep the core crisis tools completely free for users who need them most.
* **New:** **Manage Subscription:** Seamless, secure integration with Stripe to manage your subscription directly from your Profile.

### v1.4.0 (The Momentum & Crisis Update)
* **New:** **Financial Freedom Tracker:** You can now enter your historical substance cost in your Profile. The dashboard will automatically calculate and display exactly how much money you've saved by staying clean.
* **New:** **The Urge Surfer:** Added a 5-minute interactive somatic grounding tool (accessible via the SOS menu and Tools tile). This feature uses the 5-4-3-2-1 method to help you ride out intense cravings, securely logging your victory to your journal when the wave passes.

### v1.3.1 (The Privacy & Marketing Update)
* **New:** **Right to be Forgotten:** You now have complete, automated control over your data. You can permanently delete your account directly from the Profile Data tab.
* **New:** **Native Link Tree:** Added a beautifully designed public `/links` page to easily share the app.

### v1.3.0 (The Wisdom & Intelligence Update)
* **New:** **Gemini 3.1 Pro Upgrade:** The "Analysis Wizard" and "Compass" now utilize Google's latest Gemini 3.1 Pro model.

### v1.0.0 (Initial Launch)
* **Feature:** Initial Public Release with Zero-Knowledge Client-Side Encryption (AES-GCM).
""")

    # 4. Update Sprint Board
    update_file('docs/SPRINT_BOARD.md', r"""# 🏃 Active Sprint Board

**Current Phase:** Sprint 8.3 (Infrastructure & QA)

## ✅ Completed Sprints
- [x] **Sprint 8.1:** Virality & Polish (PROJ-20). Milestone confetti, AI task badges.
- [x] **Sprint 8.2:** Medallion Pipeline (PROJ-24). Refined circular chips + transparency automation.
- [x] **Sprint 8.3:** Content Expansion. Integrated "Women for Recovery" specialty workbook with tailored UI routing.

## 🟡 Sprint 8.0: The Road to 5,000 (Active)
- [ ] **Admin:** Receive $50,000 funding tranche.
- [ ] **PROJ-07:** Finalize Android App Store deployment.
""")

    print("\n🎉 Post-Sprint Audit Complete. System state is synced.")

if __name__ == "__main__":
    main()