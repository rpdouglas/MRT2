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

### Phase 0: Product decision (blocks Phase 2 only)
* [ ] **AI-crawler posture (G9):** product owner decides whether `GPTBot`/`ClaudeBot`/`Google-Extended`/`PerplexityBot`/`CCBot` are allowed or disallowed in `robots.txt`. Recommendation: **allow** them on the public marketing/docs surface only (the zero-knowledge pitch is a differentiator worth having cited by answer engines) — but this is the product owner's call, not an implementation default.

### Phase 1: Crawl & index infrastructure (G1, G2, G7, G11, G12)
* Add `public/robots.txt` (main app) and `docs-site/public/robots.txt` (docs site) — allow all public routes, disallow nothing that isn't already auth-gated (per §2.1 point 1, don't list gated paths — they're already inaccessible without auth), reference each property's `sitemap.xml`.
* Add a small build-time (or hand-maintained, given only 4 public routes) `public/sitemap.xml` for the main app; add `vitepress-plugin-sitemap` (or equivalent) to `docs-site/.vitepress/config.mts` for the docs site's auto-generated sitemap.
* Add `<link rel="canonical">` per route (ties into Phase 2's per-route metadata mechanism).
* Add `<meta name="robots" content="noindex">` to the gated-route shell as defense-in-depth (cheap, since `App.tsx` already knows which routes are wrapped in `PrivateRoute`).
* Register both properties in Google Search Console and Bing Webmaster Tools; submit both sitemaps.

### Phase 2: Per-route metadata + renderability (G3, G4, G5, G6, G13)
* Introduce a lightweight per-route `<head>` mechanism (`react-helmet-async` — check bundle-size impact against `CLAUDE.md`'s no-new-dependency-without-cause posture — or a hand-rolled `useDocumentHead` hook if the 4-route surface doesn't justify a new dependency) so `/`, `/login`, `/links`, `/delete-account` each ship a distinct `<title>`, `<meta description>`, and canonical URL.
* Add one shared OG image (1200×630, using existing brand/marketing assets already in `public/Marketing/`) plus `og:title`, `og:description`, `og:image`, `twitter:card` meta — can start static in `index.html` for the homepage and extend per-route once the metadata mechanism lands.
* Add `SoftwareApplication` + `Organization` JSON-LD to the homepage.
* Solve the renderability gap (G6) for these 4 routes specifically — options to evaluate: (a) a prerender step at build time (e.g. `vite-plugin-ssg`-style static HTML snapshot for just these 4 routes, since the rest of the app is intentionally CSR-only-behind-auth and out of scope), or (b) a minimal Firebase Hosting rewrite that serves a prerendered snapshot for these paths while everything else still falls through to the SPA shell. Do not attempt full SSR for the whole app — that's a architecture change far outside this project's scope and the gated app has no SEO need for it.

### Phase 3: Docs site + AEO content (G8, G10)
* Add per-page `description` (and `title` where it should diverge from the H1) frontmatter across `docs-site/guide/*.md`, `docs-site/support/faq.md`, `privacy.md`, `tos.md`.
* Add `FAQPage` JSON-LD to `docs-site/support/faq.md`, generated from the existing Q&A markdown structure (question headings → `mainEntity` items) — the single highest-leverage AEO deliverable in this project.
* Add an OG image + `og:`/`twitter:` meta to the VitePress theme config (site-wide default, overridable per page).
* Add `public/llms.txt` (main app) — best-effort, low cost, not a hard requirement for phase completion.

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
