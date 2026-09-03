# Journal — `/journal`

**Parent page:** `src/pages/Journal.tsx` — a thin shell that renders one of three tabs based on the `?tab=` URL search param (`write` default, `history`, `insights`), so tab state survives refresh and supports deep links (e.g. `/journal?tab=write&template=morning-checkin`).

This screen has enough distinct sub-experiences to warrant its own folder — each file below is independently readable.

| Sub-screen | File | Component(s) |
|---|---|---|
| Write | [`write.md`](./write.md) | `JournalEditor.tsx`, `AudioRecorder.tsx`, `TemplatePickerSheet.tsx` |
| History | [`history.md`](./history.md) | `JournalHistory.tsx` |
| Insights | [`insights.md`](./insights.md) | `JournalInsights.tsx`, `ManageWordCloudModal.tsx` |
| Analysis Wizard (modal) | [`analysis-wizard.md`](./analysis-wizard.md) | `JournalAnalysisWizard.tsx` — launched from **History**, not Insights (see note in that file) |

**Personas:** David (crisis processing), Walt (deep reflection/export), Ned (Pink Cloud momentum), Maya (structured tracking) — relevant to every persona as the app's primary input surface.

**Zero-knowledge status:** `journals/{id}` content is AES-GCM encrypted client-side; `mood`/`tags`/`timestamps` on the same doc are plaintext by design. This screen (via the Analysis Wizard and Voice-to-Vault) is two of the nine approved flows allowed to send decrypted content to Gemini — see CLAUDE.md's Zero-Knowledge Encryption Boundary section.

## Related docs

- `docs/specs/01_JOURNAL.md` — existing spec, broadly accurate at the feature level; doesn't reflect the URL-param tab state or that the Analysis Wizard is launched from History rather than Insights.
- `docs/specs/12_USER_GUIDE.md` / `docs-site/guide/03-journal-and-ai.md` — end-user-facing guide content.
