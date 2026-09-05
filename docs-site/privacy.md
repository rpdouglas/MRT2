---
description: How My Recovery Toolkit's zero-knowledge encryption works, what data is and isn't collected, and how your privacy is protected.
---

# 🔒 Privacy Policy 

**My Recovery Toolkit ("MRT", "we", "our")** is committed to protecting your privacy. This policy explains how your information is collected, used, and secured at `www.myrecoverytoolkit.ca`.

**Last Updated:** August 2026

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

## 4. Data Storage & Third Parties
We use trusted third-party services to run the app:
* **Google Firebase:** Hosts the database, authentication, push notifications, and static files.
* **Google Generative AI:** Provides the intelligence for analysis features.
* **PostHog:** Provides product analytics (feature usage, performance, error monitoring). PostHog never receives your journal, workbook, or other encrypted content — only event names and non-sensitive metadata.
* **Stripe:** Processes payments for premium subscriptions, via Stripe's own secure checkout. Your card details are entered directly into Stripe's payment page and never pass through our servers.
* **Google Drive (optional):** If you choose to back up your data to Google Drive, a decrypted copy of your export is uploaded directly from your device to your own Google Drive using your own Google account permissions. We do not access or store this backup — it is entirely under your control, and you can revoke access at any time from your Google Account settings.

## 5. Data Sovereignty
You own your data.
* **Export:** You may download a decrypted JSON or PDF copy of your data at any time.
* **Deletion:** You may delete your account at any time via the Profile page, or via a public web link if you can't sign in, permanently wiping all data from our servers.

## 6. Contact Us
For technical support or privacy questions, please contact:
**Email:** rpdouglas@gmail.com
