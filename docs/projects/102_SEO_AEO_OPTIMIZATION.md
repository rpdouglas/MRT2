# 📁 Project 102: SEO & AEO Foundation

**Status:** ⚪ Planned
**Primary Persona:** Lisa (Primary Viral Driver — organic/referral discovery), plus prospective David/Ned/Maya/Walt/Jordan visitors who haven't signed up yet
**Objective:** Make MRT's public surface (marketing splash, `Links`/`DeleteAccount` utility pages, and the VitePress docs site) fully crawlable, indexable, and citable by both traditional search engines and AI answer engines, without touching anything behind `PrivateRoute` — the zero-knowledge boundary makes the authenticated app correctly un-indexable, and that is a feature, not a gap.

---

## 1. The Executive Summary

**User Story:** As Lisa (a sponsor who wants to send sponsees a link, and whose word-of-mouth is MRT's primary growth channel), I want a share of `myrecoverytoolkit.ca` to render a real preview card (not a bare URL) and a search for "zero knowledge recovery journal app" or "is MRT app private" to surface MRT's actual pages and FAQ answers, so that trust is established before a sponsee ever opens the app.

**Competitive Gap:** "I Am Sober", "Reframe", and "Sober Grid" all ship server-rendered marketing sites with OG images, sitemaps, and FAQ/structured content indexed by Google — MRT's zero-knowledge pitch is a stronger trust story than any of them, but right now that story is invisible to search and AI answer engines because the site that tells it (`Welcome.tsx`) ships as an empty `<div id="root">` to any crawler that doesn't execute JavaScript, with no sitemap, no structured data, and no per-page metadata anywhere in the stack.

### Why this is a *narrow* project, deliberately
MRT is a zero-knowledge, auth-gated PWA. Per `CLAUDE.md`, everything under `PrivateRoute` (`/dashboard`, `/journal`, `/tools/*`, `/games/*`, `/insights`, `/admin`, `/debug`, etc.) is user content or app surface that should **never** be indexed — there is nothing to gain from ranking `/journal` in Google, and real risk in accidentally exposing gated routes to crawlers. The entire addressable surface for this project is:

| Property | Route(s) | Rendering | Current state |
|---|---|---|---|
| Main app (public) | `/` (Welcome), `/login`, `/links`, `/delete-account` | Client-rendered SPA (Vite, no SSR/SSG) | No per-route metadata, no OG/Twitter tags, no structured data |
| Main app (gated) | `/dashboard`, `/journal`, `/tools/*`, `/games/*`, `/insights`, `/admin`, `/debug`, etc. | Client-rendered SPA behind `PrivateRoute` | Correctly un-indexable (redirects to `/` when unauthenticated) — **out of scope**, verify defense-in-depth only |
| Docs site | `docs-site/` → VitePress → GitHub Pages (`rpdouglas.github.io/MRT2/...`) | Static-generated (VitePress default) | Generic site-wide title/description, no sitemap, no OG image, no structured data on the FAQ page |

---

## 2. Deep Dive: SEO & AEO Best Practice, Applied to This Architecture

### 2.1 Traditional SEO fundamentals (Google/Bing)
1. **Crawlability** — `robots.txt` must exist and explicitly point to a sitemap; it must not accidentally block the public routes, and doesn't need to block gated routes (auth already does that — `robots.txt` is not an access-control mechanism, and listing gated paths there just advertises them to bad actors).
2. **Indexability signals per page** — unique `<title>`, unique `<meta name="description">`, a canonical `<link>`, and (for anything that must never be indexed, like `/admin` or `/debug`) an explicit `<meta name="robots" content="noindex">` as defense-in-depth beyond the auth redirect.
3. **Sitemap.xml** — machine-readable list of indexable URLs with lastmod dates, submitted to Google Search Console / Bing Webmaster Tools.
4. **Structured data (JSON-LD)** — `SoftwareApplication`/`MobileApplication` schema on the marketing page (enables rich results: ratings, price="Free", OS support), `Organization` schema for brand knowledge-panel eligibility, `FAQPage` schema on any FAQ content.
5. **Open Graph / Twitter Card metadata** — `og:title`, `og:description`, `og:image` (1200×630), `twitter:card`. Without these, every link shared in Slack/iMessage/social renders as a bare, untrusted-looking URL — directly undermines Lisa's referral flow.
6. **Renderability** — Google's crawler executes JS reasonably well, but many secondary crawlers (Bingbot's JS budget, most AI crawlers, link-preview bots for iMessage/Slack/Discord) fetch raw HTML only. A CSR SPA with a static, generic `index.html` shows the *same* generic title/description card for `/`, `/login`, `/links`, and `/delete-account` to any of them — because there's no per-route rendering or prerendering step at all.
7. **Core Web Vitals** — already instrumented (`web-vitals` → PostHog via `onCLS/onINP/onLCP` in `src/main.tsx`). No gap here; not in scope.
8. **Semantic HTML / a11y** — heading hierarchy on `Welcome.tsx` is already reasonable (single `h1`, `h2` section headers, `h3` persona cards); alt text is present on hero/persona images. Minor audit only, not a rebuild.

### 2.2 AEO (Answer Engine Optimization) — what's different from SEO
AEO targets being *cited* by LLM-backed answer surfaces (Google AI Overviews, ChatGPT/SearchGPT, Perplexity, Gemini) rather than ranked in a blue-link list. The mechanics that matter most for a project this size:
1. **Direct-answer content structure** — Q&A pairs with the question as a literal heading and a self-contained answer directly beneath it (MRT already has this shape in `docs-site/support/faq.md` — it just isn't marked up or indexed for it).
2. **`FAQPage` JSON-LD** — the single highest-leverage AEO change available here. It's the structured-data format answer engines and Google's "People Also Ask" both parse directly, and MRT's FAQ content (PIN recovery, Gemini training claims, offline support, account deletion) is exactly the kind of trust-building, citable content answer engines surface for "is [app] private" / "does [app] train on my data" style queries.
3. **`llms.txt`** — an emerging (not yet universally adopted, but low-cost and directionally correct) plain-text convention at `/llms.txt` giving LLM crawlers a curated index of the site's most important pages, distinct from `sitemap.xml`'s exhaustive-and-mechanical purpose. Cheap to add; treat as best-effort, not a load-bearing deliverable.
4. **Explicit AI-crawler posture in `robots.txt`** — `GPTBot`, `ClaudeBot`, `Google-Extended`, `PerplexityBot`, `CCBot`, etc. are separate user-agents that respect (or don't) their own `robots.txt` blocks independent of the general `*` rule. Given MRT's zero-knowledge/privacy positioning, the product owner should make a **deliberate choice** — allow them (so MRT's privacy story gets cited by answer engines) vs. block them (if training-data participation is itself a concern) — rather than leaving it unset by omission. This is a decision this project should surface to the product owner, not one Claude should make unilaterally.
5. **Author/organization trust signals** — consistent NAP (name/description) across the marketing page, docs site, and structured data reinforces the entity graph answer engines use to decide whether to cite a source at all.
6. **Renderability matters even more for AEO than SEO** — several AI crawlers are known to do lightweight or no JS execution. A prerendered/static `index.html` per public route is the precondition for *any* of the content-quality work above to be visible to them at all.

---

## 3. Gap Analysis

Findings from a direct audit of the current build (`index.html`, `vite.config.ts`, `src/App.tsx`, `src/pages/Welcome.tsx`, `firebase.json`, `docs-site/.vitepress/config.mts`, `public/`, `docs-site/public/`, `.github/workflows/deploy*.yaml`) as of 2026-08-30.

| # | Gap | Where | Severity | SEO/AEO/Both |
|---|---|---|---|---|
| G1 | No `robots.txt` anywhere (main app or docs site) | `public/`, `docs-site/public/` | High | Both |
| G2 | No `sitemap.xml` anywhere | `public/`, `docs-site/` | High | Both |
| G3 | Single static `<title>`/`<meta description>` in `index.html` shared by all 4 public routes (`/`, `/login`, `/links`, `/delete-account`) — no per-route metadata mechanism exists (no `react-helmet-async` or equivalent) | `index.html`, `src/App.tsx` | High | Both |
| G4 | No Open Graph / Twitter Card tags (`og:title`, `og:description`, `og:image`, `twitter:card`) — no OG image asset exists in `public/` either | `index.html` | High | SEO (social sharing / Lisa's referral flow) |
| G5 | No structured data (JSON-LD) anywhere — no `SoftwareApplication`, no `Organization`, no `FAQPage` | `index.html`, `docs-site/` | High | Both (FAQPage is the #1 AEO lever available) |
| G6 | 100% client-side rendering with no prerender/SSG step for the 4 public routes — non-JS-executing crawlers (many AI bots, link-preview bots) see an empty `<div id="root">` | `vite.config.ts`, build pipeline | High | Both (precondition for G3–G5 to matter) |
| G7 | No canonical `<link rel="canonical">` on any page | `index.html` | Medium | SEO |
| G8 | Docs site (VitePress): no sitemap plugin, no per-page `description` frontmatter (all pages inherit one generic site description), no OG image config, no `FAQPage` JSON-LD on `support/faq.md` despite ready-made Q&A content | `docs-site/.vitepress/config.mts`, `docs-site/support/faq.md` | High | Both |
| G9 | No explicit AI-crawler posture (`GPTBot`, `ClaudeBot`, `Google-Extended`, `PerplexityBot`, `CCBot`) — currently unset by omission rather than by product decision | `robots.txt` (doesn't exist yet) | Medium | AEO — **needs a product-owner decision**, see §4 Phase 0 |
| G10 | No `llms.txt` | `public/` | Low | AEO (best-effort, emerging standard) |
| G11 | No Google Search Console / Bing Webmaster verification (no meta tag, no verification file) — can't measure indexing status or query performance for either property once fixed | N/A | Medium | SEO (measurement, not rendering) |
| G12 | No explicit `noindex` on gated routes as defense-in-depth (currently relies solely on the `PrivateRoute` redirect-to-`/` behavior) | `src/App.tsx` route definitions | Low | SEO (belt-and-suspenders only — auth already prevents real exposure) |
| G13 | `Login.tsx`, `Links.tsx`, `DeleteAccount.tsx` have no distinct page identity for search — e.g. "delete recovery toolkit account" is a real, ownable search query but currently indistinguishable from the homepage | `src/pages/*.tsx` | Low | SEO |

**Not a gap (verified, no action needed):**
- Core Web Vitals tracking (`web-vitals` → PostHog, `src/main.tsx`) — already instrumented.
- PWA manifest (`vite-plugin-pwa`) — complete with icons, theme color, maskable icon.
- Heading hierarchy / alt text on `Welcome.tsx` — already reasonable; only a light audit needed, not a rebuild.
- Gated-route indexability risk — `PrivateRoute` already redirects unauthenticated visitors to `/`, so there is no real content exposure; G12 is precautionary hardening only.

---

## 4. Implementation Phases

### Phase 0: Product decision (blocks Phase 2 only) — ✅ DECIDED 2026-08-30
* [x] **AI-crawler posture (G9):** **Allow retrieval/answer-engine crawling; block training-data crawling.** The product owner chose a split posture rather than a blanket allow/deny — MRT's zero-knowledge pitch and FAQ content should be *citable* by live answer engines, but the underlying page content shouldn't be scraped into third-party model *training* corpora. This distinction is real and already encoded in most major crawlers' separate user-agent tokens (a "training" bot and a "live retrieval" bot from the same company are different UAs, not a flag on one bot):

  | Bucket | User-agents | `robots.txt` posture |
  |---|---|---|
  | Retrieval / answer-engine (live lookups, user-triggered fetches, search indexes) | `OAI-SearchBot`, `ChatGPT-User`, `Claude-User`, `Claude-SearchBot`, `PerplexityBot`, `Perplexity-User` | **Allow** |
  | Training-data collection | `GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`, `Bytespider`, `Applebot-Extended`, `Meta-ExternalAgent` | **Disallow** all paths |
  | Everything else (`Googlebot`, `Bingbot`, standard `Applebot`, generic `*`) | — | **Allow** (unaffected — these are conventional search indexers, not AI-training crawlers, and were never in scope for G9) |

  This mapping is the concrete input Phase 1's `robots.txt` implementation works from. It should be treated as a snapshot, not a permanent list — crawler names and their stated purpose (training vs. retrieval) do shift over time, so revisit this table if a bot's documented behavior changes or a new major one appears.

### Phase 1: Crawl & index infrastructure (G1, G2, G11, G12) — ✅ DONE 2026-08-30, G7 deferred to Phase 2, G11 outstanding
* [x] `public/robots.txt` (main app) and `docs-site/public/robots.txt` (docs site) — `Allow: /` for everything except the Phase 0 training-crawler block list; no gated paths listed (per §2.1 point 1); each references its own `sitemap.xml`.
* [x] `public/sitemap.xml` — hand-maintained, the 4 public app routes, per the plan (fixed small surface, doesn't justify a build step).
* [x] `scripts/generate-docs-sitemap.mjs` — walks `docs-site/.vitepress/dist` after `vitepress build` and emits `sitemap.xml` from whatever pages actually exist, so new guide/support pages never require a manual sitemap edit. Wired into `docs:build`. No new dependency added (`vitepress-plugin-sitemap` wasn't needed — the whole generator is ~40 lines, in keeping with the existing `scripts/generate-build-info.js`-style convention already used in this repo).
* [x] **Bonus fix, found while validating the sitemap against a real build:** `docs-site/.vitepress/config.mts` had `base: '/'`, but the site deploys to GitHub Pages at `rpdouglas.github.io/MRT2/` (`.github/workflows/deploy-docs.yaml`) — every asset request (`/assets/*.css`, `/assets/*.js`) was resolving against the wrong origin in production, i.e. the live docs site was almost certainly serving broken/unstyled pages. Fixed to `base: '/MRT2/'` and confirmed via a real build that asset and internal-nav links now carry the correct prefix. Not one of G1–G13 — a pre-existing bug this project's validation step happened to surface.
* [x] `<meta name="robots" content="noindex, nofollow">` injected client-side by `PrivateRoute` (`src/App.tsx`) for every authenticated route, on top of the existing redirect-to-`/login`; `index.html` now carries an explicit `<meta name="robots" content="index, follow">` default for the public shell so the contrast is visible in source. **Known limitation, not a regression:** this only reaches crawlers that execute JS (Google, Bing) — a non-JS crawler hitting `/dashboard` directly still receives the generic `index.html` shell with the public-default `index, follow` meta, because the SPA has no server-side per-route rendering. That's the same CSR limitation G6/Phase 2 already names; G12 was always scoped as defense-in-depth on top of the auth redirect, not a full fix for non-JS crawlers.
* [ ] `<link rel="canonical">` per route (G7) — genuinely needs Phase 2's per-route metadata mechanism; adding one static canonical to today's single shared `index.html` would incorrectly tell crawlers `/login`, `/links`, and `/delete-account` are duplicates of `/`, which is worse than no canonical at all. Deferred as planned.
* [ ] Register both properties in Google Search Console and Bing Webmaster Tools; submit both sitemaps (G11) — requires access to the live domains/DNS, not something to do from this session; flagging as the one Phase 1 item still needing the product owner.

**Verification performed:** `npm run lint`, `npm run build`, and `npm run test:once` (701 tests) all pass with these changes. Both `public/robots.txt`/`public/sitemap.xml` and the docs site's `robots.txt`/generated `sitemap.xml` were confirmed reachable and correctly served from a local static build (`vite preview`-equivalent) of both `dist/` outputs — not just present in source.

### Phase 2: Per-route metadata + renderability (G3, G4, G5, G6, G13) — ✅ DONE 2026-08-31
* [x] `src/hooks/usePageMeta.ts` — hand-rolled per-route `<head>` mechanism (no `react-helmet-async`: only 4 routes ever need this, so a dependency wasn't justified). Upserts `<title>`, `<meta description>`, `<link rel="canonical">`, full `og:*`/`twitter:*` tags, and an optional JSON-LD `<script>`, on mount. Wired into `Welcome.tsx` (`/`), `Login.tsx` (`/login`), `Links.tsx` (`/links`), and `DeleteAccount.tsx` (`/delete-account`) with distinct, real titles/descriptions per route (closes G13 — `/delete-account` in particular is a real Google Play–mandated page and a real search query, not just an SEO nicety).
* [x] `public/og-image.png` (1200×630) — generated via `scripts/generate-og-image.mjs`, a Playwright-rendered composite matching `Welcome.tsx`'s hero styling (brand mark, gradient, tagline, trust badge), following the same asset-generation pattern already used by `scripts/generate_screenshots.js`. Not part of the build pipeline — a committed static asset, re-run by hand if the tagline changes. Excluded from the PWA's offline precache (`vite.config.ts` `globIgnores`) since it's fetched only by link-preview bots/crawlers, never by the app itself.
* [x] `SoftwareApplication` + `Organization` JSON-LD added to the homepage only, via `usePageMeta`'s `jsonLd` option.
* [x] **G6 (renderability), solved via build-time prerendering (option a), not a Hosting-side rewrite:** `scripts/prerender-public-routes.mjs` runs after `vite build` (now the last step of `npm run build`), spins up the built app under `vite preview`, and uses a real headless browser to capture the fully-rendered HTML of exactly the 4 public routes. Critically, it **first copies the plain (pre-prerender) `dist/index.html` to `dist/app-shell.html`** — the untouched empty-`<div id="root">` CSR shell — before writing the prerendered `index.html`/`login.html`/`links.html`/`delete-account.html`. `firebase.json`'s SPA catch-all rewrite now points at `app-shell.html` instead of `index.html`, and `"cleanUrls": true` was added so `/login` resolves to the static `login.html` (matching the canonical URLs `usePageMeta` already emits) before the rewrite is ever considered. Net effect, verified against the real `firebase.json` config via the Firebase Hosting emulator: the 4 public routes now serve real, distinct, crawlable markup to a plain `curl` (no JS execution) request, while every gated route (`/dashboard`, `/journal`, `/admin`, etc.) and any unknown path still receive the exact same empty CSR shell as before — zero behavior change for the auth-gated app.

**Verification performed:** `npm run lint`, `npm run build` (full pipeline including the new prerender step), and `npm run test:once` (701 tests) all pass. Ran the real `firebase.json` config against the actual `dist/` build via `firebase emulators:start --only hosting` and confirmed with plain `curl` (no browser, no JS): `/`, `/login`, `/links`, `/delete-account` each return distinct real `<title>`/description/canonical markup; `/login.html` 301-redirects to `/login`; `/dashboard` and an unknown path both still return the untouched empty CSR shell; `/robots.txt` and `/sitemap.xml` remain reachable.

### Phase 3: Docs site + AEO content (G8, G10) — ✅ DONE 2026-08-31
* [x] Added `description` frontmatter to all 18 docs-site pages (13 `guide/*.md`, `support/faq.md`, `support/changelog.md`, `privacy.md`, `tos.md`, `index.md`) — each page now has a real, distinct meta description instead of inheriting the one site-wide default. No `title` frontmatter overrides added: every page's existing H1 already reads cleanly as a page title, so diverging would only create inconsistency between the visible heading and the browser tab.
* [x] `docs-site/.vitepress/config.mts` — added a `transformHead` hook that computes a canonical URL, `og:title`/`og:description`/`og:url`, and `twitter:title`/`twitter:description` **per page** from that page's own resolved title and frontmatter description (using the same extensionless URL scheme `scripts/generate-docs-sitemap.mjs` already emits, so canonical/og:url and the sitemap agree). Static site-wide defaults (`og:type`, `og:site_name`, `og:image`, `twitter:card`, `twitter:image`) live in the top-level `head` array. `docs-site/public/og-image.png` is a copy of the main app's Phase 2 OG image — same brand, one shared asset, no reason to generate a second one.
* [x] **`FAQPage` JSON-LD (G10's highest-value item)** — added directly to `docs-site/support/faq.md` via VitePress's per-page frontmatter `head` field, with all 4 existing Q&A pairs (PIN recovery, Gemini training, offline support, account deletion) as `mainEntity` items. Hand-kept in sync with the visible content by design (a code comment in the frontmatter says so) rather than parsed from markdown at build time — one small, rarely-changed file didn't justify a content-extraction pipeline. Verified as syntactically valid JSON-LD, not just present in source.
* [x] `public/llms.txt` (main app) — a short curated index (product blurb + links to the app, guide, FAQ, privacy, ToS, changelog) for LLM crawlers, per the emerging convention. Best-effort as planned; not validated against any formal spec since none is standardized yet.

**Verification performed:** `npm run lint`, `npm run build`, `npm run docs:build`, and `npm run test:once` (701 tests) all pass. Built the real docs site and confirmed: every page carries a distinct `<title>`/description/canonical matching its frontmatter; `support/faq.html`'s JSON-LD block parses as valid JSON with `@type: FAQPage` and all 4 questions present; `og-image.png` is served from the built output; the sitemap generator still finds all 18 pages.

### Phase 4: Verification & QA
* [ ] `robots.txt` reachable and syntactically valid on both properties (main app, docs site); confirm via Search Console's robots tester.
* [ ] `sitemap.xml` reachable, valid XML, all 4 public app routes + all docs-site pages listed with correct `lastmod`.
* [ ] Each of the 4 public app routes renders a **distinct** `<title>`/description when fetched with a plain HTTP client (`curl`) — not just in a JS-executing browser — proving the renderability fix actually solves G6, not just G3.
* [ ] Rich Results Test (Google) validates `SoftwareApplication`, `Organization`, and `FAQPage` JSON-LD with zero errors.
* [ ] Social share preview (paste the homepage URL into Slack/iMessage/Twitter card validator) renders the OG image + title/description correctly.
* [ ] Confirm zero gated routes (`/dashboard`, `/journal`, `/admin`, `/debug`, etc.) are reachable by an unauthenticated `curl` request beyond the existing redirect-to-`/` behavior — this project must not weaken that boundary.
* [ ] `npm run build` and `npm run lint` stay clean; no new console warnings from a metadata library if one is added.
* [ ] Confirm Firebase Hosting `headers`/`rewrites` in `firebase.json` still serve `robots.txt`/`sitemap.xml` as static files rather than being swallowed by the SPA catch-all rewrite (`"source": "**" → "/index.html"`) — this is a real risk given the current rewrite rule and needs an explicit exception.

---

## 5. QA & Verification 🧪
* **Unit Tests:** any new metadata hook (`useDocumentHead` or `react-helmet-async` wrapper) gets a test asserting it sets `document.title`/meta tags correctly per route; a test asserting gated routes still redirect unauthenticated visitors (regression guard for G12).
* **The Subway Test:** N/A — this project touches only public, unauthenticated surfaces; no offline-data implications.
* **The "Lost PIN" Test:** N/A — no crypto/vault involvement; this project has zero Firestore or encryption surface (confirmed no new collections, no `crypto.ts` changes needed).
* **Crawler simulation:** `curl -A "Googlebot"` and `curl -A "GPTBot"` (plain HTTP, no JS) against all 4 public routes and confirm real, distinct, non-empty `<title>`/meta content — this is the actual acceptance test for G6, since a browser-based check alone would miss the CSR rendering gap entirely.
