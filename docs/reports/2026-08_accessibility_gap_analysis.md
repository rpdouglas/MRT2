# ♿ Accessibility Gap Analysis

**Date:** 2026-08-31
**Scope:** Every accessibility dimension of the deployed PWA/TWA — automated CI coverage, WCAG 2.2 AA conformance, and cognitive accessibility for the app's own crisis/discretion personas — benchmarked against 2024-2026 external best practice.
**Prior work (not duplicated here):** `docs/projects/91_ACCESSIBILITY_REMEDIATION.md` (shipped — fixed 4 confirmed violations, added an `@axe-core/playwright` CI gate over 7 routes), `docs/projects/97_DEPENDENCY_HYGIENE_ROUND_2.md` (added `eslint-plugin-jsx-a11y`, triaged 48 findings), `PROJ-98` (15 more accessibility labels). This report starts from what's still uncovered.
**Result:** One real, independently-verified product-safety bug (crisis-access unreachable when locked — fixed this session, see `docs/projects/104_ACCESSIBILITY_PHASE2.md` Phase 1). A meaningful WCAG 2.2 gap on the PIN vault's authentication accessibility. Automated CI coverage is much narrower than it looks (7 of 40 routes). Several structural gaps (zero `aria-live` regions repo-wide, no skip-link, no global reduced-motion baseline). All tracked as phased, spec-gated future work.

---

## 1. The crisis-access finding (headline)

**Independently verified by tracing the actual render tree, not just taken from the research pass that first flagged it.**

`AppShell.tsx:82` always mounts `<SOSModal isOpen={isSOSOpen} .../>`, regardless of vault-lock state — that part is already correct. But the *trigger button* that opens it (`VibrantHeader.tsx:127-134`, `aria-label="Emergency SOS"`) lives inside each page's own header component, which only renders as `VaultGate`'s `children`. The route nesting is `PrivateRoute` → `AppShell` → `VaultGate` → `Page` (confirmed in `src/App.tsx`), and `VaultGate` renders *either* its PIN screen *or* `children` — never both. So on any vault-gated route (Journal, Workbooks, Vitality, most Tools/Games — the majority of the app), a user who is locked has **no visible way to open SOS**, even though the modal itself is sitting in the tree unreachable for lack of a button.

A second, coupled bug surfaced while verifying the fix location: `VaultGate.tsx:214` renders its PIN screen at `z-[60]`, while `SOSModal.tsx:28`'s `Dialog` was `z-50`. Even with a working trigger button, opening SOS from a locked screen would have rendered the modal invisibly *underneath* the lock overlay. Both needed fixing together.

Separately: `SOSModal.tsx:161-172` ("Somatic Anchor" → `/vitality`) and `:175-186` ("Log the Urge" → `/journal?template=urge_log`) route into vault-gated pages. If the vault is locked when SOS is opened, tapping either silently drops the user into PIN entry instead of the calming tool they asked for — directly undercutting the product's own stated design floor for David ("Max 3 taps per flow. Zero cognitive load. Crisis-first design," `CLAUDE.md`). `/tools/urge-surfer` and `/games/craving-buster` are already correctly exempted from `VaultGate` as an established "crisis-tool precedent" (`App.tsx:190-191`'s own comment) — this fix extends the same reasoning to the SOS entry point itself, not the two options that still require unlocking.

**Fixed this session** — see `docs/projects/104_ACCESSIBILITY_PHASE2.md` Phase 1: persistent SOS button in `AppShell.tsx`, z-index fix in `SOSModal.tsx`, and a lock-state-aware hint on the two gated option cards rather than a silent surprise.

**External validation:** crisis-app UX research consistently frames crisis resources as needing to be reachable in one tap, from any screen, without requiring authentication — this app's own `/tools/urge-surfer` and `/games/craving-buster` precedent already reflects that instinct; the SOS entry point itself just hadn't been built to the same standard. ([Frontiers Digital Health framework](https://www.frontiersin.org/journals/digital-health/articles/10.3389/fdgth.2026.1814547/full))

---

## 2. WCAG 2.2 SC 3.3.8 — Accessible Authentication and the PIN vault

WCAG 2.2 (AA) introduced **SC 3.3.8**: authentication must not rely solely on a "cognitive function test" (recalling/transcribing a secret) unless an alternative not relying on recall is also offered, or an assistance mechanism (e.g., paste/password-manager autofill) is provided. **There is no blanket security exemption** — this is a common misconception worth stating plainly. ([W3C Understanding SC 3.3.8](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html))

MRT's 4-digit PIN entry (`VaultGate.tsx`) is textbook "cognitive function test via recall" each time it's required, so SC 3.3.8 applies. Concrete gaps found:
- The **unlock field has no `autoComplete` attribute** (`VaultGate.tsx:182-192`) — the **setup** field correctly uses `autoComplete="new-password"` (`:97,107`), but the unlock field's absence of `autoComplete="current-password"` means most password managers won't offer to autofill it, effectively forcing unaided recall.
- No paste-blocking was found (no `onPaste` handler, no `readOnly`), so autofill/paste is technically possible — just not hinted.
- No "show PIN" reveal toggle, so transcription errors go unmitigated.
- The error state (`"Improper PIN. Access Denied."`, `:149`) isn't tied to the input via `aria-describedby`/`aria-invalid` — screen-reader users get the visual banner but the input itself isn't marked invalid.
- No biometric/WebAuthn alternative exists post-setup.

**Given CLAUDE.md's zero-knowledge architecture (the PIN *is* the encryption key, not just a login credential), there is no server-side "forgot PIN" recovery possible without breaking the security model — so full SC 3.3.8 remediation is an architecture-level decision, not a quick fix.** The externally-researched compliant path: wrap the PIN-derived key in a hardware-backed store (Android Keystore / WebAuthn platform authenticator) so that, after initial setup, returning users unlock via device biometric instead of re-typing — the one-time PIN *creation* step remains a necessary memory task, but repeat *entry* wouldn't need to be. This is flagged as its own future spec, not folded into Phase 2 below. What Phase 2 *does* scope (near-term, non-architectural mitigations): `autoComplete="current-password"`, a show-PIN toggle, `aria-invalid`/`aria-describedby` wiring, and a real lockout countdown instead of the current static "please wait" text (`VaultGate.tsx:155`; the actual lockout duration is already computed server-side in `functions/src/index.ts:44-49` — `computeLockoutSeconds` — just not surfaced to the client UI).

---

## 3. Automated CI coverage is narrower than it looks

`e2e/golden-paths/a11y.spec.ts` scans exactly **7** of `src/App.tsx`'s **40** routes: `/dashboard`, `/vitality`, `/tools`, `/games`, `/games/craving-buster`, `/workbooks`, `/journal`. The **33 uncovered routes** include several that matter most: `/tools/urge-surfer` (a named crisis-tool precedent), `/login`, `/delete-account`, `/admin`, `/profile` (where `AccountDeletionModal` lives), and most individual `/tools/*` and `/games/*` screens. The SOS modal itself is never scanned at all, since axe-core only navigates to URLs and SOS is state-triggered, not a route.

`eslint-plugin-jsx-a11y` suppressions are clean — all 9 `eslint-disable` comments found in `src/` are documented with reasoning (matching `PROJ-97`'s own claim), no undocumented ones.

**Automated tools are necessary but not sufficient, and it's worth naming the real ceiling:** axe-core and similar tools catch roughly 30-40% of WCAG issues in practice — by success-criteria count, only about 16 of 50 WCAG 2.1 AA criteria (and a similar proportion of 2.2's expanded set) are fully automatable; the rest require manual judgment. ([Deque Automated Accessibility Coverage Report](https://www.deque.com/automated-accessibility-coverage-report/)) The existing 7-route axe gate is real, working infrastructure — it just isn't the whole picture, and a naive reading of "we have a CI a11y gate" would overstate actual coverage.

---

## 4. Structural gaps found repeat-clean across the codebase

- **Zero `aria-live` regions exist anywhere in `src/`** (`grep -rn "aria-live" src` → 0 matches, 0 files). No validation-error or dynamic-status live region exists at all — a repo-wide gap, not a per-component one.
- **No skip-to-main-content link** anywhere (`grep -i "skip.to\|skip-link\|SkipLink"` → 0 matches). `AppShell.tsx:111` has `<nav>`, `:180` has `<main>`, but nothing lets a keyboard user bypass the nav.
- **No global `prefers-reduced-motion`/`:focus-visible` CSS baseline** — `docs/ROADMAP.md` Wave 1 already lists this as a planned item; still accurate. Only 2 files handle it explicitly today (`Dashboard.tsx`, `DailyCrossword.tsx`), unchanged since that Roadmap line was written.
- **Touch-target sizing is documented but not enforced.** `.claude/skills/design/SKILL.md` and `docs/design/mrt_design_system.md` both state a 44px-minimum rule; no lint rule or shared component enforces it. 28 occurrences of manual sizing classes (`h-11 w-11`, `min-h-[44px]`, etc.) are scattered across ~19 files, ad hoc.
- **Form-label gaps** on 6 identified inputs: `JournalEditor.tsx`'s free-write textarea (`:340-346`), mood slider (`:353-356`), and tag input (`:374-380`) — all placeholder-only, no programmatic label; `WorkbookSession.tsx:224-231`'s guided-answer textarea — same issue; `Profile.tsx`'s Display Name (`:428-429`) and Sobriety Date (`:441-442`) fields — not associated via `htmlFor`/`id` (contrast with the same file's PIN/contact fields, which do this correctly).
- **3 hand-rolled `fixed inset-0` modals with no Escape-key handling**: `src/components/games/jeopardy/QuestionModal.tsx:24`, `src/components/readings/ReadingModal.tsx:24`, `src/components/dashboard/DynamicAnchorWidget.tsx:182`. `SobrietyHero.tsx`'s equivalent popover already got this fix under `PROJ-91` — these three didn't.
- **React Router doesn't manage focus on route change** — a known, persistent gap in the library itself, not this app's bug ([react-router#5210](https://github.com/ReactTraining/react-router/issues/5210)); best practice is moving focus programmatically to the new route's `<h1>` on navigation.

---

## 5. Cognitive accessibility & persona-specific findings

- **Destructive actions are inconsistent.** Task deletion (`Tasks.tsx:188`), journal-entry deletion (`JournalHistory.tsx:287`), and template deletion (`TemplateEditor.tsx:87`) all use native `window.confirm()` — unstyled, off-brand, no undo window, a known cognitive-load pain point (terse, easy to reflexively dismiss). By contrast, `DeleteAccount.tsx` is properly rigorous: re-authentication step, explicit confirmation screen, clear "there is no recovery" language — correctly high-friction given the zero-knowledge design makes any lesser flow unsafe. The 3 lower-stakes deletions have no comparable reason to skip a styled confirm + undo-toast pattern (`sonner` is already a dependency, unused for this).
- **Plain-language gaps land in exactly the wrong screens.** `SOSModal.tsx:170`: *"De-escalate your nervous system with 4-7-8 breathing"* — clinical phrasing on the crisis screen. `VaultGate.tsx:83-85`: *"Zero-Knowledge Policy... lost PINs cannot be recovered"* — developer jargon shown to brand-new users before any crisis occurs. `VaultGate.tsx:228-229`: *"Since we do not store your PIN, we cannot 'reset' it for you. You must wipe the current lock..."* — abstract procedural language at the exact moment (locked out, possibly distressed) where plain instructions matter most. By contrast, `SOSModal.tsx:74-75`'s actual crisis-first line — *"You are not alone. Choose the support you need right now"* — is simple and warm, showing the app already knows how to do this well elsewhere.
- **Navigation isn't fully consistent.** The hamburger/nav-open control and SOS button both live in per-page `VibrantHeader`, not the persistent `AppShell` chrome. Seven pages pass a `backLink` prop that *replaces* the hamburger with a single-destination back arrow, removing full sidebar access from that screen: `WorkbookDetail.tsx`, `PremiumUpgrade.tsx`, `GamesHub.tsx`, `RecoveryCapital.tsx` (×2), `UrgeSurfer.tsx`, `ResentmentBurner.tsx`. This is a WCAG 3.2.3 (Consistent Navigation)-relevant predictability gap — the nav mechanism silently changes shape per route. (Note: this session's fix moves SOS specifically into `AppShell`, which also incidentally makes SOS immune to this `backLink` issue going forward; the hamburger/nav-access side of this finding is not fixed this session.)
- **No inactivity timeout exists** — checked and confirmed absent (`AuthContext.tsx`, `EncryptionContext.tsx`, repo-wide grep for `idle`/`inactivity`/`visibilitychange`). WCAG 2.2.1 (Timing Adjustable) doesn't apply; nothing to fix here. The only timing mechanic is the server-computed PIN-lockout backoff (`functions/src/index.ts:44-49`), whose *display* gap is covered in §2 above.
- **Jordan persona's discreet-UI promise — confirmed not implemented**, matching the existing open item in `docs/BACKLOG.md` (surfaced 2026-08-31, not re-scoped here): no custom counter labels, no one-tap dose-logging UI (only a multi-tap "MAT Check-In" journal template exists, `src/data/journalTemplates.ts:276-288`), and no dose-reminder notification code path exists yet at all (so "no drug names on lock-screen notifications" is trivially true only because the feature doesn't exist — the existing milestone/task FCM notifications in `functions/src/index.ts:87-96` are already appropriately generic).
- **Stigma-sensitive notification practice, checked against best practice**: current FCM notification bodies (`"🎉 Milestone Reached!"`, `"Keep the Fire Alive 🔥"`) are already generic/non-identifying — good, matches the guidance that lock-screen notification content for sensitive apps should avoid referencing the condition or app purpose. ([ClinicalTrials.gov protocol example](https://cdn.clinicaltrials.gov/large-docs/42/NCT03763942/Prot_SAP_001.pdf)) Worth re-checking once any dose-logging feature is actually built (Jordan's tracked item), since that's exactly where this could regress.
- **"Quick exit" pattern (considered, not recommended for adoption yet)**: a persistent button that instantly navigates away, borrowed from domestic-violence support sites. Flagged during research as a reasonable adaptation for a recovery app used on shared/public devices, but explicitly *not* a formal, validated standard in the recovery-app context the way it is for DV sites — logged as a future product decision, not built speculatively. ([Oomph best-practices on quick-exit](https://www.oomphinc.com/insights/user-safety-quick-exit-best-practices/))

---

## 6. PWA-in-TWA accessibility

A TWA renders the PWA through the device's actual Chrome engine — no separate accessibility API layer sits on top, so TalkBack behavior should be functionally identical to visiting the site in Chrome directly, provided the site is accessible in-browser first. ([Chrome for Developers, TWA overview](https://developer.chrome.com/docs/android/trusted-web-activity)) Since the TWA strips browser chrome (address bar etc.), it's worth a manual TalkBack pass once `PROJ-07`'s Bubblewrap build exists, to confirm skip-links/landmarks still work correctly full-screen — logged as a QA step in `PROJ-104`'s spec, not urgent before that build exists.

---

## 7. Phased closing plan

Full detail in `docs/projects/104_ACCESSIBILITY_PHASE2.md`.

- **Phase 1 (done this session):** Crisis-access reachability — persistent SOS trigger, z-index fix, locked-state hint on the two gated SOS options.
- **Phase 2 (planned):** WCAG 2.2 SC 3.3.8 near-term mitigations on `VaultGate.tsx` — `autoComplete`, show-PIN toggle, `aria-invalid`/`aria-describedby`, lockout countdown. Biometric/WebAuthn alternative deferred to its own future architecture spec.
- **Phase 3 (planned):** Expand `e2e/golden-paths/a11y.spec.ts` to cover `/tools/urge-surfer`, `/login`, `/delete-account`, `/profile`, `/admin`, and an SOS-modal-open assertion.
- **Phase 4 (planned):** Global `prefers-reduced-motion`/`:focus-visible` CSS baseline, skip-to-main-content link, focus-to-`<h1>` on route change, `aria-live="polite"` regions for validation/async states.
- **Phase 5 (planned):** Accessible names for the 6 identified form inputs; Escape-key handling for the 3 remaining hand-rolled modals.
- **Phase 6 (planned):** Replace `window.confirm()` for the 3 lower-stakes destructive actions with a styled confirm + `sonner` undo-toast; plain-language rewrites for the 3 flagged strings.
- **Not re-scoped, cross-referenced only:** Jordan's discreet-UI depth (`docs/BACKLOG.md`, already tracked), the quick-exit pattern (flagged, not adopted), a minimum manual/AT testing regimen — keyboard-only pass, one screen-reader pass per platform (VoiceOver/NVDA/TalkBack), 200-400% zoom/reflow check, using free tools beyond axe (Lighthouse, WAVE, Accessibility Insights, Pa11y) — recommended as a recurring QA checklist item, not a code phase. ([TestGuild 2026 tool roundup](https://testguild.com/accessibility-testing-tools-automation/))
