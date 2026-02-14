import os
from datetime import date

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip())
    print(f"✅ Created: {path}")

current_date = date.today().strftime("%B %d, %Y")

# ==========================================
# 1. PRIVACY POLICY
# ==========================================
privacy_content = f"""
# 🔒 Privacy Policy for My Recovery Toolkit (MRT)

**Last Updated:** {current_date}

**My Recovery Toolkit ("MRT", "we", "our")** is committed to protecting your privacy. This policy explains how your information is collected, used, and secured.

## 1. Our Core Philosophy: Zero-Knowledge Encryption
MRT is built on a **Zero-Knowledge Architecture**.
* **Your Private Data:** Your Journal entries, Workbook answers, and Sponsee notes are encrypted on your device using a key derived from your PIN.
* **Our Access:** We (the developers) and our cloud providers (Firebase/Google) **cannot decrypt or read this data**. It is stored as mathematical gibberish (`ciphertext`) on our servers.
* **Your Responsibility:** Because we do not have your encryption key, **we cannot recover your data if you lose your PIN.**

## 2. Information We Collect
We collect data in two categories:

### A. Account & Metadata (Unencrypted)
To operate the service, the following data is stored in plain text:
* **Authentication:** Email address and User ID (via Firebase Auth).
* **Usage Stats:** App performance, error logs, and activity streaks (e.g., "User logged in today").
* **Non-Sensitive Content:** Task titles, Mood scores (1-10), and Vitality tags (e.g., "Movement", "Breath"). We use these to generate charts/graphs.

### B. User Generated Content (Encrypted)
The following data is encrypted *before* it leaves your device:
* **Journals:** The text body of your diary entries.
* **Workbooks:** Your answers to deep-dive recovery questions.
* **Service Data:** Names and notes regarding people you sponsor.

## 3. How We Use Artificial Intelligence (AI)
MRT uses Artificial Intelligence (Google Gemini) to provide coaching and analysis.
* **Consent:** AI analysis only happens when you explicitly click a button (e.g., "Analyze Journal", "Consult Compass").
* **Process:** Your device temporarily decrypts the specific text, sends it to the AI provider via a secure connection, and displays the result.
* **Privacy:** We utilize "Stateless" API calls. Your journal entries are **NOT** used to train Google's public AI models. The data is processed in memory and then discarded by the AI provider.

## 4. Data Storage & Third Parties
We use trusted third-party infrastructure to host the app:
* **Google Firebase:** Hosts the database, authentication, and static files.
* **Google Generative AI:** Provides the intelligence for analysis features.

## 5. Data Sovereignty
You own your data.
* **Export:** You may download a decrypted JSON or PDF copy of your data at any time via the Profile page.
* **Deletion:** You may delete your account at any time. This permanently wipes all data (Encrypted and Unencrypted) from our servers.

## 6. Children's Privacy
MRT is not intended for individuals under the age of 13. We do not knowingly collect data from children.

## 7. Contact Us
For technical support or privacy questions, please contact:
**Email:** rpdouglas@gmail.com
"""

# ==========================================
# 2. TERMS OF SERVICE
# ==========================================
terms_content = f"""
# 📜 Terms of Service

**Last Updated:** {current_date}

By accessing or using **My Recovery Toolkit (MRT)**, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not use the application.

## 1. Medical Disclaimer (Critical)
**MRT IS NOT A MEDICAL DEVICE AND DOES NOT PROVIDE MEDICAL ADVICE.**
* The content, AI analysis, and tools provided are for **informational and self-help purposes only**.
* MRT is not a substitute for professional medical advice, diagnosis, or treatment.
* **In Case of Emergency:** If you are experiencing a medical emergency, suicidal thoughts, or a relapse crisis, call 911 or your local emergency number immediately. Do not rely on this app for crisis intervention.

## 2. Zero-Knowledge & Data Loss
* **Your Security PIN:** You are solely responsible for remembering your PIN.
* **No Recovery:** Because MRT uses Zero-Knowledge encryption, **we cannot reset your PIN or recover your encrypted data** if you forget it.
* **Liability:** MRT and its developers are not liable for any loss of data resulting from a lost PIN, device failure, or failure to backup your data.

## 3. User Responsibilities
You agree not to:
* Use the app for any illegal purpose.
* Attempt to reverse-engineer the encryption protocols.
* Enter Personal Identifiable Information (PII) of others (e.g., Sponsees) into unencrypted fields (like Task Titles).

## 4. AI Features
* **Accuracy:** Artificial Intelligence can make mistakes ("hallucinations"). You acknowledge that advice or insights generated by the "Recovery Coach" or "Compass" may be inaccurate or inappropriate. Always use your own judgment.
* **Usage:** You agree not to use the AI features to generate harmful, illegal, or abusive content.

## 5. Termination
We reserve the right to terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users of the Service.

## 6. Limitation of Liability
To the maximum extent permitted by law, MRT and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.

## 7. Governing Law
These Terms shall be governed by the laws of Ontario, Canada, without regard to its conflict of law provisions.

## 8. Changes to Terms
We reserve the right to modify these terms at any time. Your continued use of the app after changes constitutes acceptance of the new terms.
"""

# ==========================================
# Execution
# ==========================================
print("🚀 Generating Legal Documentation for App Store Compliance...")

write_file("docs/legal/PRIVACY_POLICY.md", privacy_content)
write_file("docs/legal/TERMS_OF_SERVICE.md", terms_content)

print("\n✨ Legal Docs Created!")
print("👉 Folder: docs/legal/")
print("📝 NOTE: Before publishing, verify the 'Contact Email' and 'Governing Law' sections.")