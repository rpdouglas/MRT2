# Play Console Data Safety Questionnaire — Draft Answers

**Status:** Draft, not submitted. Prepared 2026-08-31 while Google Play Console account identity verification is still pending (`docs/BACKLOG.md`), so this is ready to transcribe the moment the account unblocks — it is not a substitute for actually filling out the live form.
**Source data:** `docs/legal/SUB_PROCESSORS.md` (code-verified 2026-08-31). Cross-check against that doc if anything here looks stale.

> **This draft makes engineering-verifiable claims (what data goes where) but does NOT make the legal/product judgment calls Play's form requires — specifically whether recovery/journaling content should be declared under "Health and fitness" or "Sensitive info" categories. That determination should get a deliberate answer from whoever owns compliance for this app, not an inferred default. Flagged inline below, not decided.**

---

## Section 1: Data collection & security — top-level questions

| Question | Answer | Basis |
|---|---|---|
| Does your app collect or share any of the required user data types? | **Yes** | Email, UID, device tokens, usage/app-activity data at minimum |
| Is all user data encrypted in transit? | **Yes** | All traffic to Firebase/Gemini/PostHog/Stripe/Google Drive is HTTPS/TLS by the providers' own defaults; no custom unencrypted transport anywhere in the codebase |
| Do you provide a way for users to request that their data be deleted? | **Yes** | Both in-app (`AccountDeletionModal.tsx`) and a public, no-login-required web route (`/delete-account`, `src/pages/DeleteAccount.tsx`, added under `PROJ-07` specifically for this Play policy requirement) |
| Is your app built to Families Policy requirements? | **No / not applicable** | MRT is an 18+ recovery app, not child-directed; §6 of `PRIVACY_POLICY.md` already states it's not intended for under-13 |

## Section 2: Data types — draft per-category answers

*Play's form asks, per category: collected (Y/N), shared (Y/N), whether it's processed ephemerally, purpose, and whether it's optional or required.*

### Personal info
| Data type | Collected? | Shared?* | Purpose | Required/Optional | Deletable? |
|---|---|---|---|---|---|
| Email address | Yes | No (service providers only — see note below) | Account management, app functionality | Required | Yes |
| User IDs (Firebase UID) | Yes | No | Account management, app functionality, analytics | Required | Yes |

**\*"Shared" note:** Play's own definition of "shared" excludes data transferred to a service provider processing it on your behalf under contract for the app's own functionality — which is how Firebase, Gemini (via the `generateAIInsights` proxy), PostHog, and Stripe (via the official Firebase Extension) are all used here. If that's confirmed for each provider's actual terms (worth a quick check, not assumed here), the correct answer to "shared" is **No** across the board — everything is "collected," processed by contracted service providers, not "shared" with independent third parties in Play's sense. Google Drive is the one exception: that's the *user's own* storage, initiated by the user's own OAuth grant, not MRT sharing data with a third party at all.

### Financial info
| Data type | Collected? | Shared? | Purpose | Required/Optional | Deletable? |
|---|---|---|---|---|---|
| Purchase history / subscription tier | Yes (tier only, e.g. "premium") | No | App functionality (feature gating) | Optional (only for paying users) | Yes |
| Payment info (card details) | **No** | — | — | — | — |

Card details are entered directly into Stripe's hosted Checkout — MRT's own servers and client never receive or store them.

### Health and fitness — ⚠️ needs an explicit decision, not filled in here
MRT is a recovery/mental-health-adjacent app (journaling, CBT/REBT tools, mood tracking, sobriety tracking). Play's taxonomy has a "Health and fitness" data category and a separate, stricter "Sensitive info" framing for apps handling this kind of content. **Whoever owns this submission needs to decide, deliberately:**
- Does mood score / sobriety-tracking / journal-topic data get declared under "Health and fitness"?
- Does the existing Play Store health-app medical disclaimer (`PROJ-90`, shown on Login/Welcome) already satisfy the policy intent here, or does the Data Safety form need its own explicit acknowledgment?

Not answering this here on purpose — it's a compliance judgment call, not something to default silently.

### Messages / App activity
| Data type | Collected? | Shared? | Purpose | Required/Optional | Deletable? |
|---|---|---|---|---|---|
| In-app search/browse history (journal history browsing, tool history) | Yes | No | App functionality | Required | Yes |
| App interactions (task completions, game scores/streaks, feature usage) | Yes | No | App functionality, analytics | Required | Yes |
| Other user-generated content (journal entries, workbook answers, sponsee notes) | Yes | No — encrypted client-side; only decrypted content the user explicitly sends leaves the device (the 9 approved Gemini flows), and even then via a contracted processor, not an independent third party | App functionality (the core product), and AI analysis when explicitly requested | Required for core features | Yes, via account deletion (crypto-shredding) |

### App info and performance
| Data type | Collected? | Shared? | Purpose | Required/Optional | Deletable? |
|---|---|---|---|---|---|
| Crash logs / diagnostics | Yes | No | Analytics, app functionality | Required | N/A (not user-identifying beyond UID) |
| Other performance data (Core Web Vitals) | Yes | No | Analytics | Required | N/A |

### Device or other IDs
| Data type | Collected? | Shared? | Purpose | Required/Optional | Deletable? |
|---|---|---|---|---|---|
| Device ID (FCM push token) | Yes, only if push notifications are enabled | No | App functionality (push delivery) | Optional | Yes — auto-deleted on opt-out per `PRIVACY_POLICY.md` §2 |

---

## Before submitting, for real

1. Resolve the "Health and fitness" categorization decision above — don't let this draft's silence become a default.
2. Confirm the PostHog `defaults: '2026-01-30'` preset's actual session-recording/autocapture/IP-capture behavior (open item in `docs/legal/SUB_PROCESSORS.md` §3) — it affects whether "Device or other IDs" / "Approximate location" need additional declarations.
3. Confirm each processor's DPA/terms actually support the "collected, not shared" framing used throughout this draft (Section 2 header note) — this draft assumes standard service-provider terms for Firebase/Gemini/PostHog/Stripe but that assumption hasn't been checked against their actual current contracts.
4. Re-verify against `docs/legal/SUB_PROCESSORS.md` for drift if significant time has passed since 2026-08-31 before actually submitting.
