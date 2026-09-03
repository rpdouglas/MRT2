# Tools → Resentment Burner — `/tools/resentment-burner`

**Source:** `src/components/smart_tools/ResentmentBurner.tsx`
**Personas:** General — a "Right Now" crisis-adjacent tool, not persona-targeted in `docs/PERSONAS.md` by name.
**Tier:** Free — no `<PremiumGate>`, no rate limit (there's nothing to gate — no AI call, no Firestore write).
**Zero-knowledge status:** N/A — this is the one tool in the entire app that writes **nothing** to Firestore. Text never leaves the device, encrypted or not.

## What it does

An ephemeral, purely client-side venting space: write out a resentment, then watch it burn away with an SVG combustion animation. `toolsRegistry.ts`'s own description is explicit about the guarantee: "No data is ever saved."

## How it works

- `<PrivateRoute><ResentmentBurner /></PrivateRoute>` in `App.tsx` — auth-gated like every other route, but (like Urge Surfer) **not** wrapped in `<VaultGate>`. Since it never touches encryption or Firestore, there's no vault-key dependency to gate on in the first place.
- All state is local component `useState`: `text`, `isBurning`, `isBurned`, `burnProgress`, `embers[]`. Nothing is persisted to `sessionStorage` or `localStorage` either — a page refresh mid-write loses the text with no warning, which is consistent with the tool's own "ephemeral" framing but worth knowing if a user expects any recovery.
- The burn animation is a hand-built SVG filter chain (`feTurbulence` + `feDisplacementMap` + `feColorMatrix` + `feBlend` + `feComponentTransfer`, id `combustion-filter`) driven by a `requestAnimationFrame` loop over 2.8 seconds (`burnProgress` 0→1, eased with a cubic ease-in `progress³`), plus 30 randomly-positioned CSS-animated "ember" divs. No external animation or particle library.
- `handleBurn()` requires non-empty trimmed text; on completion the loop clears `text`, `embers`, and `burnProgress` and flips to `isBurned`. There is no undo, no confirmation dialog before burning, and no save-before-burn option — burning is the only way to exit the writing view besides navigating away entirely.
- Post-burn screen offers "Return to Hub" (`/tools`) or "Burn Another" (resets to the writing view).

## Data model

None. No Firestore document of any kind is created by this screen — not in `journals`, not tagged as a SMART Tool, nowhere.

## Gating & limits

None — free, unrestricted, no vault dependency.

## Known gaps / debt

- Because nothing persists, there's no way to distinguish "user opened this and burned something" from "user never opened it" in any analytics/completion surface — it doesn't appear in `useSmartToolCompletions`, has no History route, and has no card badge on the Hub (consistent with `hub.md`'s card-variant description: Resentment Burner uses the plain simple card, no completion count).
- No autosave/recovery of in-progress text on refresh or accidental navigation — arguably intentional given the "ephemeral, no trace" promise, but a genuine loss-of-work risk if a user writes something long and, say, their browser reloads before they mean to burn it.

## Related docs

- `docs/screens/tools/README.md` — parent index; "Resentment Burner writes nothing to Firestore at all — the only truly ephemeral tool in the app."
- `docs/screens/tools/hub.md` — its card variant on the Hub.
- `docs/specs/18_CBT_ENGINE.md` §3 — "Bypasses `SmartToolContainer` and Firestore entirely."
