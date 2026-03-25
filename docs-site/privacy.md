# 🔒 Privacy Policy 

**My Recovery Toolkit ("MRT", "we", "our")** is committed to protecting your privacy. This policy explains how your information is collected, used, and secured at `www.myrecoverytoolkit.ca`.

**Last Updated:** March 2026

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
* **Device Tokens:** If you opt-in to Push Notifications, we securely store your device FCM token to deliver generic reminders (e.g., "You have tasks due today"). These tokens contain no personal information and are automatically deleted if you disable notifications.

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
