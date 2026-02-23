import os

# =============================================================================
# SAFE FILE WRITER
# =============================================================================
def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    # Replace the markdown safeguard '~~~' with standard triple backticks
    final_content = content.replace("~~~", "```").strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Updated: {path}")

# =============================================================================
# PHASE 2: USER GUIDE & LEGAL OVERHAUL (docs-site/)
# =============================================================================

vp_guide = r'''# 📘 User Guide: The 4 Pillars

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
'''

vp_privacy = r'''# 🔒 Privacy Policy 

**My Recovery Toolkit ("MRT", "we", "our")** is committed to protecting your privacy. This policy explains how your information is collected, used, and secured at `www.myrecoverytoolkit.ca`.

**Last Updated:** February 2026

## 1. Our Core Philosophy: Zero-Knowledge Encryption
MRT is built on a **Zero-Knowledge Architecture**.
* **Your Private Data:** Your Journal entries, Workbook answers, and Sponsee notes are encrypted on your device using a key derived from your 4-digit PIN.
* **Our Access:** We (the developers) and our cloud providers (Firebase/Google) **cannot decrypt or read this data**. It is stored as mathematical gibberish (`ciphertext`) on our servers.
* **Your Responsibility:** Because we do not have your encryption key, **we cannot recover your data if you lose your PIN.**

## 2. Information We Collect
We collect data in two categories:

### A. Account & Metadata (Unencrypted)
To operate the service and generate dashboards, the following data is stored in plain text:
* **Authentication:** Email address and User ID.
* **Usage Stats:** App performance, activity streaks, and XP points.
* **Non-Sensitive Content:** Task titles, Mood scores (1-10), and Vitality tags (e.g., "Movement", "Breath"). 

### B. User Generated Content (Encrypted)
The following data is encrypted *before* it leaves your device via AES-GCM:
* **Journals:** The text body of your diary entries.
* **Workbooks:** Your answers to deep-dive recovery questions.

## 3. How We Use Artificial Intelligence (AI)
MRT uses **Google Gemini 2.5 (Flash and Pro models)** to provide coaching, pattern recognition, and sentiment analysis.
* **Consent:** AI analysis only happens when you explicitly click a button (e.g., "Analyze Journal", "Consult Compass").
* **Process:** Your device temporarily decrypts the specific text in-memory, sends it to the AI provider via a secure connection, and displays the result.
* **Stateless Privacy:** We utilize "Stateless" API calls. Your journal entries are **NOT** stored by Google and are **NOT** used to train public AI models. 

## 4. Data Sovereignty
You own your data.
* **Export:** You may download a decrypted JSON or PDF copy of your data at any time.
* **Deletion:** You may delete your account at any time via the Profile page, permanently wiping all data from our servers.

## 5. Contact Us
For technical support or privacy questions, please contact:
**Email:** rpdouglas@gmail.com
'''

vp_tos = r'''# 📜 Terms of Service

**Last Updated:** February 2026

By accessing or using **My Recovery Toolkit (MRT)** via `www.myrecoverytoolkit.ca`, you agree to be bound by these Terms of Service. 

## 1. Medical Disclaimer (Critical)
**MRT IS NOT A MEDICAL DEVICE AND DOES NOT PROVIDE MEDICAL ADVICE.**
* The content, AI analysis, and tools provided are for **informational and self-help purposes only**.
* MRT is not a substitute for professional medical advice, diagnosis, or treatment.
* **In Case of Emergency:** If you are experiencing a medical emergency, suicidal thoughts, or a relapse crisis, call 911 or your local emergency number immediately. Do not rely on this app for crisis intervention.

## 2. Zero-Knowledge & Data Loss
* **Your Security PIN:** You are solely responsible for remembering your PIN.
* **No Recovery:** Because MRT uses Zero-Knowledge encryption, **we cannot reset your PIN or recover your encrypted data** if you forget it.
* **Liability:** MRT and its developers are not liable for any loss of data resulting from a lost PIN, device failure, or failure to manually backup your data.

## 3. AI Features & Hallucinations
* **Accuracy:** Artificial Intelligence (powered by Google Gemini 2.5) can make mistakes or "hallucinate". You acknowledge that advice or insights generated by the "Recovery Coach" or "Analysis Wizard" may be inaccurate, irrelevant, or inappropriate. Always use your own judgment.
* **Usage:** You agree not to use the AI features to generate harmful, illegal, or abusive content.

## 4. Termination
We reserve the right to terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users of the Service.

## 5. Limitation of Liability
To the maximum extent permitted by law, MRT and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data or goodwill.
'''


if __name__ == "__main__":
    print("🚀 Initiating Documentation Sync: Phase 2 (User Guide & Legal)...")
    
    write_file("docs-site/guide.md", vp_guide)
    write_file("docs-site/privacy.md", vp_privacy)
    write_file("docs-site/tos.md", vp_tos)

    print("✨ Phase 2 Complete. Documentation is accurate and up-to-date.")
    print("👉 Next Steps: Run 'python3 scripts/sync_docs_phase2.py', then commit/push the changes. Reply 'Ready for Phase 3' to sync the technical specs.")