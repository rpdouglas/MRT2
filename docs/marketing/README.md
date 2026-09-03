# Marketing & Persona Briefs

Feature-by-feature briefing docs for handing to an LLM (or a copywriter) writing marketing copy about MRT — landing pages, store listings, ads, email, social. Distinct from `docs/screens/`, which is engineering-grade technical reference; these are benefit- and persona-oriented, meant to ground marketing copy in what the product actually does and why it matters for substance-use recovery specifically, not generic wellness-app language.

Each brief covers one feature and follows the same shape: the one-sentence pitch, why it matters clinically/in recovery practice, what it actually does in plain language, how each of MRT's six personas (`docs/PERSONAS.md`) uses it with a suggested marketing angle per persona, how it connects to the rest of the app, and a brand-voice/guardrails section every piece of generated copy must follow.

| Feature | File | Status |
|---|---|---|
| Journal | `journal.md` | ✅ Drafted, reviewed |
| Dashboard | `dashboard.md` | ✅ Drafted (built on a corrected `docs/screens/dashboard.md`) |
| Tools (CBT/SMART worksheets) | `tools.md` | ✅ Drafted (technical docs spot-verified, held up clean) |
| Tasks | `tasks.md` | ✅ Drafted (technical docs corrected — found a real live bug, see below) |
| Vitality | `vitality.md` | ✅ Drafted (technical docs spot-verified, held up clean) |
| Workbooks | `workbooks.md` | ✅ Drafted (technical docs spot-verified, held up clean) |
| Recovery Games | `games.md` | ✅ Drafted (all 8 games + hub spot-verified, held up clean) |
| Insights / Recovery Capital | `insights.md` | ✅ Drafted (technical docs already deeply verified, held up clean) |
| Profile | `profile.md` | ✅ Drafted (heaviest guardrails section in the series — see file) |
| SOS / Crisis Support | `sos-crisis-support.md` | ✅ Drafted — see the note below; **recommend human review before use** |
| Premium Upgrade ("Supporter") | `premium-upgrade.md` | ✅ Drafted — the app's only conversion/pricing surface |

**Full user-facing surface area now covered.** A 2026-09-03 full-app review cross-checked every brief against `src/pages/` and `src/App.tsx`'s routes, plus scanned for app-wide features not tied to any single route. It found two real gaps, both now filled above: the SOS/Crisis Support modal (which isn't a route at all — it's mounted globally in `AppShell.tsx`, so it had no documentation of any kind, technical or marketing, until this pass added `docs/screens/sos-modal.md` alongside its brief) and Premium Upgrade (which had a technical doc but no marketing brief, despite being the app's actual pricing/conversion page). Admin was confirmed correctly out of scope — internal/governance tooling, not a user-facing feature. Welcome (the public landing page) was considered and deliberately left out — it already *is* marketing copy, so a brief about it would be recursive; revisit only if future landing-page copy needs a grounding reference.

**A note on the SOS brief specifically:** crisis-adjacent marketing copy carries more risk than anything else in this series if a single line reads wrong. `sos-crisis-support.md` has an unusually strict guardrails section for that reason, and its own text recommends a human review pass — not just an LLM pass — before any copy generated from it ships.

Each brief draws on the corresponding `docs/screens/` files for accuracy plus `docs/PERSONAS.md` for persona detail, so they stay grounded in the real product rather than generic marketing language. Before drafting a new one, re-verify the underlying `docs/screens/` file(s) against live source first. Lessons from this series worth repeating: the Dashboard brief only came out accurate after that pass caught a factual error and two under-documented components; the Tasks brief only came out accurate after that pass found a real live bug (a documented "Smart Reset" mechanic that turned out to be dead code); Profile's brief needed an unusually heavy guardrails section because its technical docs surfaced more real product rough edges than anywhere else; and the SOS brief only exists because a full-app gap review caught a major feature with zero documentation of any kind.
