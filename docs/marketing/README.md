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

**Original 8-brief series complete**, now extended with Profile. Each brief draws on the corresponding `docs/screens/` files for accuracy plus `docs/PERSONAS.md` for persona detail, so they stay grounded in the real product rather than generic marketing language. Before drafting a new one (e.g. Admin, if ever needed for marketing — unlikely, since it's an internal/governance surface, not a user-facing feature), re-verify the underlying `docs/screens/` file(s) against live source first. Two lessons from this series worth repeating: the Dashboard brief only came out accurate after that pass caught a factual error and two under-documented components; the Tasks brief only came out accurate after that pass found a real live bug (a documented "Smart Reset" mechanic that turned out to be dead code); and Profile's brief needed an unusually heavy guardrails section because its underlying technical docs surfaced more real, verified product rough edges (silent auto-backup failures, incomplete account deletion, Import only restoring journals, a weak Reset Vault confirmation) than any other feature covered so far — none of which belong in customer-facing copy.
