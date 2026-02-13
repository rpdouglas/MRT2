# 🔒 Privacy Policy for My Recovery Toolkit (MRT)

**Last Updated:** February 13, 2026

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