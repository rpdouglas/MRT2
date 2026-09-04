---
description: Answers to common questions about My Recovery Toolkit's zero-knowledge encryption, offline support, AI privacy, and account deletion.
# PROJ-102 (SEO/AEO) Phase 3: FAQPage structured data, hand-kept in sync with
# the Q&A content below — if you edit a question or answer here, update the
# matching entry in this JSON-LD block too. This is the single highest-value
# AEO change in the project: answer engines (Google AI Overviews, ChatGPT,
# Perplexity) parse FAQPage schema directly when answering "is MRT private"
# / "does MRT train on my data" style queries.
head:
  - - script
    - type: application/ld+json
    - |
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "I forgot my PIN. Can you reset it?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No. MRT uses Zero-Knowledge encryption. Your PIN is the mathematical key used to encrypt your data. We do not store it, and we cannot bypass it. If you forget your PIN, your encrypted data (Journals, Workbooks) is permanently lost."
            }
          },
          {
            "@type": "Question",
            "name": "Is Google Gemini training on my private journal entries?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No. When you request AI analysis, your data is decrypted locally, sent securely to Google's Enterprise API, processed statelessly, and instantly discarded. It is explicitly excluded from their public AI training models."
            }
          },
          {
            "@type": "Question",
            "name": "Can I use the app offline?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! MRT is built with \"Offline-First\" technology. If you are in a basement meeting room with no cell service, you can still write journal entries and log habits. The app will save them locally and sync them to the cloud the moment you reconnect."
            }
          },
          {
            "@type": "Question",
            "name": "How do I delete my account?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Go to your Profile → Data tab and click Request Account Deletion in the Danger Zone. This instantly and permanently destroys your authentication profile and all associated data records on our servers."
            }
          }
        ]
      }
---

# ❓ Frequently Asked Questions

### 🔒 Security
**I forgot my PIN. Can you reset it?**
No. MRT uses Zero-Knowledge encryption. Your PIN is the mathematical key used to encrypt your data. We do not store it, and we cannot bypass it. If you forget your PIN, your encrypted data (Journals, Workbooks) is permanently lost. 

**Is Google Gemini training on my private journal entries?**
No. When you request AI analysis, your data is decrypted locally, sent securely to Google's Enterprise API, processed statelessly, and instantly discarded. It is explicitly excluded from their public AI training models.

### 📶 Connectivity
**Can I use the app offline?**
Yes! MRT is built with "Offline-First" technology. If you are in a basement meeting room with no cell service, you can still write journal entries and log habits. The app will save them locally and sync them to the cloud the moment you reconnect.

### ⚙️ Account
**How do I delete my account?**
Go to your **Profile → Data** tab and click **Request Account Deletion** in the Danger Zone. This instantly and permanently destroys your authentication profile and all associated data records on our servers.
