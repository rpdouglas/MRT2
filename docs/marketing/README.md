# Marketing & Persona Briefs

Feature-by-feature briefing docs for handing to an LLM (or a copywriter) writing marketing copy about MRT — landing pages, store listings, ads, email, social. Distinct from `docs/screens/`, which is engineering-grade technical reference; these are benefit- and persona-oriented, meant to ground marketing copy in what the product actually does and why it matters for substance-use recovery specifically, not generic wellness-app language.

Each brief covers one feature and follows the same shape: the one-sentence pitch, why it matters clinically/in recovery practice, what it actually does in plain language, how each of MRT's six personas (`docs/PERSONAS.md`) uses it with a suggested marketing angle per persona, how it connects to the rest of the app, and a brand-voice/guardrails section every piece of generated copy must follow.

| Feature | File | Status |
|---|---|---|
| Journal | `journal.md` | ✅ Drafted, reviewed |
| Dashboard | `dashboard.md` | ✅ Drafted (built on a corrected `docs/screens/dashboard.md`) |
| Tools (CBT/SMART worksheets) | `tools.md` | ✅ Drafted (technical docs spot-verified, held up clean) |
| Tasks | `tasks.md` | ✅ Drafted (technical docs corrected — found a real live bug, see below) |
| Vitality | — | Pending |
| Workbooks | — | Pending |
| Recovery Games | — | Pending |
| Insights / Recovery Capital | — | Pending |

Each brief draws on the corresponding `docs/screens/` files for accuracy plus `docs/PERSONAS.md` for persona detail, so they stay grounded in the real product. Before drafting a new one, it's worth re-verifying the underlying `docs/screens/` file(s) against live source first — the Dashboard brief above only came out accurate after that pass caught a factual error and two under-documented components in the technical doc it was built from.
