# Links — `/links`

**Source:** `src/pages/Links.tsx` + `src/components/PWAInstallBanner.tsx` (referenced install-detection logic; the banner itself is not embedded in this page — see below)
**Personas:** None — a generic public "link-in-bio"-style page (per `docs/specs/12_USER_GUIDE.md`), not scoped to any persona.
**Tier:** N/A — public, unauthenticated page. No tier concept applies.
**Zero-knowledge status:** N/A — static content only, no Firestore reads or writes, no auth calls.

## What it does

A single-purpose "link-in-bio" style landing page (dark hero, profile-style header, a vertical stack of tappable link cards) intended for use outside the app itself — e.g. a social-media bio link or QR code — pointing visitors to the web app, an external Install App Guide, a demo video, and a support contact.

## How it works

- Static array `LINKS` of four items, each rendered as either an internal `<Link>` (React Router) or an external `<a target="_blank" rel="noopener noreferrer">`, decided by the item's `isExternal` flag:
  1. **Open Web App** — internal, `to="/"` (routes to `Welcome.tsx`, not directly to `/dashboard` or `/login`).
  2. **Install App Guide** — external, `https://rpdouglas.github.io/MRT2/guide/installation` (a static docs site, not an in-app page).
  3. **Watch the Demo** — external, a YouTube link.
  4. **Contact Support** — external, `mailto:support@myrecoverytoolkit.ca`.
- Each card is an icon (Heroicons outline) in a gradient tile + title + subtitle, with an `active:scale-95` tap animation.
- A "Zero-Knowledge Encrypted • Private" trust line in the footer — text only, no functional tie to encryption on this page (no auth or data calls happen here at all).

### Relationship to `PWAInstallBanner.tsx`
Contrary to a literal reading of "embeds `PWAInstallBanner.tsx` logic," **this page does not import or render `PWAInstallBanner` component itself** — there is no install-prompt UI on `/links` beyond the static "Install App Guide" link card, which just navigates to an external written guide. The actual live install-prompt banner (`PWAInstallBanner.tsx`) is a separate, globally-mounted component (used elsewhere in the app shell, not on this page) that detects install eligibility and offers an in-context install action. Its detection logic, for reference:
- **iOS detection:** `/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream` combined with `!window.navigator.standalone` (i.e. not already running as an installed PWA). iOS has no `beforeinstallprompt` event, so the banner instead shows static instructions ("1. Tap Share → 2. Tap Add to Home Screen") rather than a one-tap install button.
- **Android/Desktop detection:** listens for the browser-native `beforeinstallprompt` event (`window.addEventListener('beforeinstallprompt', ...)`), calls `e.preventDefault()` to suppress the browser's own mini-infobar, stores the event (`deferredPrompt`), and shows an "Install Now" button that calls `deferredPrompt.prompt()` on click, awaiting `deferredPrompt.userChoice` to know if the user accepted or dismissed.
- **Dismissal persistence:** `localStorage.getItem('pwa_install_dismissed')` — set on dismiss, checked before showing either variant, so a dismissed banner does not reappear (no expiry/TTL on this flag).
- Both eligibility checks (`showIOSPrompt`, initial `isVisible`) run via lazy `useState` initializers so they're computed once at mount, guarded by `typeof window === 'undefined'` for SSR-safety (not applicable to this client-only SPA in practice, but defensive).

## Data model

None. No Firestore collections are read or written by this page.

## Gating & limits

None — public page, no tier or auth requirement to view it.

## Known gaps / debt

- The page's "Install App Guide" link is a static external doc, not a live install trigger — a visitor who wants to install right now (rather than read instructions) has no in-page install button; they'd need to already have the live `PWAInstallBanner` surfaced elsewhere in the app, or follow the external guide's own instructions manually.
- No visible connection between this page and `PWAInstallBanner.tsx` in code — the task-level framing that this page "embeds `PWAInstallBanner.tsx` logic" does not hold literally; documenting the actual relationship (external guide link only) here to avoid future confusion.

## Related docs

- `docs/specs/12_USER_GUIDE.md` — describes this page's intended link-in-bio purpose and the Install App Guide it points to.
- `src/components/PWAInstallBanner.tsx` — the actual live install-prompt component, mounted elsewhere in the app (not on this page).
