# SOS / Crisis Support Modal — global, no dedicated route

**Source:** `src/components/SOSModal.tsx` + trigger buttons in `src/components/AppShell.tsx` (floating) and `src/components/VibrantHeader.tsx` (per-page header) + `src/contexts/LayoutContext.tsx` (`isSOSOpen`/`toggleSOS`) + `src/lib/telemetry.ts` (`trackSosOpened`)
**Personas:** David explicitly — this is the concrete delivery mechanism for his "Primary Safety Anchor" design floor (`docs/PERSONAS.md`). Available to every persona, but built to David's worst-case constraints (max 3 taps, zero cognitive load, no PIN required).
**Tier:** Free, unconditionally, for every user, every tier — no gate of any kind.
**Zero-knowledge status:** Reads only plaintext `users/{uid}.sponsorName`/`.sponsorPhone` (via `useUserProfile()`). Writes nothing itself except PostHog telemetry (`sos_modal_opened`). Deep-linking into Journal's Urge Log template or Vitality's Breath tab may subsequently touch encrypted content on those screens, but the modal itself never does.

## What it does

Not a page — a modal dialog mounted once, globally, in `AppShell.tsx`, reachable from anywhere in the authenticated app via either of two identical trigger buttons: a persistent floating red button (fixed bottom-right, every screen) and a button inside `VibrantHeader` (the per-page header most screens render). Opens instantly to a fixed menu of crisis-support options — no loading state, no fetch required to render the core content.

## How it works

### Reachable even with the vault locked
Per an explicit `AppShell.tsx` code comment (PROJ-104 Phase 1): the modal and its floating trigger button are rendered *outside* the `VaultGate`-protected content tree, specifically so SOS stays reachable when the current route's vault is locked and that page's own content — including its own header/SOS button — never mounts. Z-index is deliberately layered above `VaultGate`'s lock screen (`z-[65]`/`z-[70]` vs. the lock screen's `z-[60]`) so the button and modal are always clickable regardless of vault state.

### Two trigger points, one shared toggle
Both the floating button and the `VibrantHeader` button call the same `toggleSOS()` from `LayoutContext` — a single boolean (`isSOSOpen`) shared app-wide, not per-component state. Opening either way fires `trackSosOpened('shortcut')` — the `trackSosOpened` function's own signature supports distinguishing `'nav' | 'dashboard' | 'shortcut'` sources, but both call sites currently pass the same `'shortcut'` value, so the two entry points aren't actually distinguished in telemetry today despite the plumbing existing for it.

### What's inside
Rendered top to bottom:
1. **Sponsor Connect** (conditional) — shown only if `sponsorPhone` is set in Profile (`docs/screens/profile/general.md`). Two buttons: `tel:` call and a `wa.me` WhatsApp deep link, addressed by name if `sponsorName` is also set. If no sponsor phone is on file, an "Add Sponsor Contact Info" link to `/profile` appears instead at the bottom of the modal.
2. **Immediate Support** — always shown: `tel:988` (US Suicide & Crisis Lifeline) and `tel:911`, side by side.
3. **Urge Surfer** — deep-links to `/tools/urge-surfer` (not vault-gated itself — see `docs/screens/tools/urge-surfer.md`).
4. **Craving Buster** — deep-links to `/games/craving-buster` (also not vault-gated — see `docs/screens/games/craving-buster.md`; this is in fact the game's primary real-world entry point, since it's hidden from the Games Hub's own tile list).
5. **Somatic Anchor** — deep-links to `/vitality` (the Breath tab); shows an inline "Requires unlocking your vault first" note if the vault is currently locked, since Vitality logging itself needs the vault.
6. **Log the Urge** — deep-links to `/journal?template=urge_log`, preselecting the Urge Log journal template; same locked-vault inline note as above.
7. **Find a Meeting** (collapsed accordion, default closed) — five static outbound links: Alcoholics Anonymous, Narcotics Anonymous, SMART Recovery, Recovery Dharma, Women for Sobriety — each `target="_blank"`, no click tracking, no in-app browser.

### Design intent
The modal's own copy — "You are not alone. Choose the support you need right now." — and its flat, non-scrolling menu of options (no multi-step flow, no required fields) matches David's persona rule of zero-friction, single-screen crisis intervention. Two of the six options (Somatic Anchor, Log the Urge) are the only ones that can't be completed with the vault locked, and both say so inline rather than failing silently or blocking navigation.

## Data model

| Source | Encrypted? | Used for |
|---|---|---|
| `users/{uid}.sponsorName`, `.sponsorPhone` | ❌ Plaintext | Sponsor Connect card — set on Profile → General |

No Firestore writes originate from this component itself.

## Gating & limits

None whatsoever — no tier check, no vault-unlock requirement to open the modal or use most of its options, no rate limit. This is one of CLAUDE.md's explicitly named never-gateable crisis-floor features.

## Known gaps / debt

- The two trigger points (floating button, header button) both report the same `'shortcut'` telemetry source, even though `trackSosOpened()`'s type signature already supports distinguishing them (`'nav' | 'dashboard' | 'shortcut'`) — minor analytics gap, not a functional one.
- "Find a Meeting" links are static and untracked — no way to know from telemetry whether this section gets used.

## Related docs

- `docs/PERSONAS.md` — David's "Primary Safety Anchor" design floor; the explicit rule that SOS must be reachable in under 1 second from app launch and without vault unlock.
- `docs/screens/tools/urge-surfer.md`, `docs/screens/games/craving-buster.md` — the two crisis tools this modal deep-links to, both themselves deliberately not vault-gated.
- `docs/screens/journal/write.md` — the Urge Log template this modal preselects.
- `docs/screens/vitality/breath.md` — the Somatic Anchor destination.
- `docs/screens/profile/general.md` — where sponsor contact info is set.
- CLAUDE.md — "Never gate crisis/safety features" rule, naming SOS explicitly.
