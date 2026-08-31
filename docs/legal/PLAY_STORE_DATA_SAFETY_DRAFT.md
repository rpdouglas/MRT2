# Play Console Data Safety Questionnaire — Draft Answers

**Status:** Draft, ready to transcribe. Google Play Console account verification (website + identity/phone) completed 2026-08-31 (`docs/BACKLOG.md`) — this document is now the final answer key for the live form, not a placeholder. All open items resolved 2026-08-31 (see history below); this is not a substitute for actually filling out and submitting the live form.
**Source data:** `docs/legal/SUB_PROCESSORS.md` (code-verified 2026-08-31). Cross-check against that doc if anything here looks stale.
**Health & fitness categorization:** Decided 2026-08-31 by the account/compliance owner — declare under **"Health info."** See §Health and fitness below for the full answer and reasoning.

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

### Health and fitness
**Decided 2026-08-31:** declare under **"Health info."** Google's own definition covers user-entered content about a physical or mental health condition, disability, or other health issue — addiction recovery tracking fits squarely. Zero-knowledge client-side encryption is a *protection* detail for the form (supports "encrypted in transit," "encrypted at rest"), not grounds to skip the category — the plaintext still leaves the device (to Firestore as ciphertext, and transiently to Gemini in the 9 approved flows), which is what triggers the collection declaration regardless of who can read it server-side.

| Data type | Collected? | Shared? | Purpose | Required/Optional | Deletable? |
|---|---|---|---|---|---|
| Health info (mood scores, sobriety/streak tracking, journal entries, workbook answers, CBT/REBT tool content, ROSC assessment scores) | Yes | No — encrypted client-side (AES-GCM) before transit; server (Firestore) only ever holds ciphertext. Decrypted only transiently, client-side or via the `generateAIInsights` proxy, in the 9 approved AI-analysis flows (`CLAUDE.md` Zero-Knowledge Encryption Boundary) — never persisted server-side in plaintext | Core app functionality (recovery tracking); AI-assisted analysis only when the user explicitly requests it | Required for core features | Yes, via account deletion (crypto-shredding, `executeTotalAccountAnnihilation()`) |

The existing Play Store health-app medical disclaimer (`PROJ-90`, shown on Login/Welcome) is a separate in-app UX/legal requirement and doesn't substitute for this form declaration — both apply.

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

### Location
| Data type | Collected? | Shared? | Purpose | Required/Optional | Deletable? |
|---|---|---|---|---|---|
| Approximate location | Yes — confirmed 2026-08-31 via `src/main.tsx:12-15`. PostHog is initialized with `defaults: '2026-01-30'` and no `ip`/geoip overrides, which is PostHog's IP-capture-on default; PostHog derives approximate (city/country-level) location server-side from the captured IP, not precise/GPS location | No | Analytics | Required (tied to the same analytics purpose as other App activity/App info rows; not user-facing-optional the way push tokens are) | N/A — governed by PostHog's own data retention, not an MRT-side per-user delete path today |

---

## Before submitting, for real

1. ~~Resolve the "Health and fitness" categorization decision~~ **Done 2026-08-31** — declared under "Health info," see above.
2. ~~Confirm the PostHog `defaults: '2026-01-30'` preset's IP-capture behavior~~ **Done 2026-08-31** — confirmed via `src/main.tsx:12-15`: no override, so IP-derived approximate location is collected. Added as its own "Location" row above. **Still open:** whether autocapture/session-recording is *enabled at the PostHog project level* wasn't checked (client init doesn't disable it, but actual recording depends on the project dashboard toggle, which isn't visible from this codebase) — worth a quick look at the PostHog project settings before submitting, in case session recordings need their own declaration.
3. Each processor's DPA/terms are assumed to support the "collected, not shared" framing (Section 2 header note) based on Firebase/GCP, PostHog, and Stripe's *published* standard DPAs positioning them as processors/service providers — **not verified against your actual signed/accepted agreements**. Low risk (these are all standard, boilerplate-accepted terms for apps this size) but flagging since it wasn't independently confirmed.
4. Re-verify against `docs/legal/SUB_PROCESSORS.md` for drift if significant time has passed since 2026-08-31 before actually submitting.
