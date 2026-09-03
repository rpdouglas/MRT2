# My Profile — Marketing & Persona Brief

**What this document is for:** briefing material for an LLM writing marketing copy about MRT's Profile — identity settings, real vault security, data ownership, and the app's gamification home. Grounded in the real, verified product. **Read the guardrails section closely before writing anything about Data or Security** — this feature area has more real, verified rough edges underneath it than any other brief in the series, and several are easy to accidentally overclaim.

Ninth brief in the series (`docs/marketing/journal.md`, `dashboard.md`, `tools.md`, `tasks.md`, `vitality.md`, `workbooks.md`, `games.md`, `insights.md` before this — the original 8 planned; this one continues past that). Built on `docs/screens/profile/`, itself deeply verified against live source in an earlier pass (including a real, unrelated correctness bug in the Achievements tab's XP math, and several genuine account-deletion/import/backup gaps) — held up accurate here too.

---

## The one-sentence pitch

**My Profile is where your identity, your real vault security, full ownership of your data, and every milestone you've earned all live — the trust layer behind everything else in MRT.**

---

## Why this matters in recovery

- **The privacy promise made everywhere else in the app is actually enforced here.** Changing a PIN doesn't just gate a login — it re-derives the encryption key and re-encrypts everything already written, under the new key. "Not even we can read it" (see `docs/marketing/journal.md`) is backed by real, working cryptography a person can trigger themselves.
- **Real data ownership matters for a recovery product specifically.** Someone should never feel trapped in an app holding their most personal writing. A genuine, unrestricted export — free, any time — is a real answer to that fear, not a locked-in walled garden.
- **Milestones deserve a home, but not everyone's home screen.** Streaks and levels matter enormously to some people and would clutter someone else's calm daily landing page — so achievements live here, one deliberate tap away, not pushed on anyone who doesn't want them (see `docs/marketing/dashboard.md`'s note on why the Dashboard itself stays quiet).

**Marketing framing:** "the control room" — identity, real security, your data, your milestones, all in one place, none of it forced on you elsewhere in the app.

---

## What Profile actually does

### General — identity and the details that power everything else
Name, sobriety date, sponsor contact information, a financial savings tracker, personalization (accent color, daily reading preferences), and notification settings. This is also where account tier is shown. Two details worth using in copy: the sponsor contact set here is what powers one-tap sponsor calling from the crisis (SOS) flow, and the financial numbers entered here are what drive the Dashboard's running savings total.

### Security — real vault control, not just a password screen
Changing a vault PIN here does more than update a login: it re-encrypts every piece of protected content — journal entries, workbook answers, everything — under a freshly derived key. It's built to be safely resumable if interrupted partway through. There's also a "start fresh" reset option for a forgotten PIN — an honest tradeoff of true zero-knowledge privacy: there's no company backdoor to recover a lost PIN, so starting over is the only way back in.

### Data — full ownership, exportable any time
A complete, free, unrestricted export of a person's own data, whenever they want it — no waiting period, no fee. A formatted PDF report is available on Premium for something more shareable or printable. For anyone signed in with Google, an optional cloud backup keeps a copy safely off-device. And if someone ever wants to leave, account deletion is available directly from this tab.

### Achievements — every milestone, one deliberate visit away
Rank and level, an earned "archetype" reflecting where someone's energy has gone (reflection, action, vitality, or structured practice), and dedicated streak cards for Journal, Tasks, Vitality, and Workbooks. Kept off the Dashboard on purpose — visit it when it's motivating, not because it's unavoidable.

---

## How each persona uses Profile

MRT designs around six real recovery personas (full detail in `docs/PERSONAS.md`). Do not invent details beyond what's here or in the personas doc.

### Walt — "The Zen Master" (35+ years, AA-origin, now Recovery Dharma)
> *"Recovery is a lifelong practice of mindfulness and reflection."*

The Data tab is Walt's tab. A full, unrestricted export of his own data — years of it — whenever he wants it, is exactly the data-sovereignty story his persona work names directly.

**Marketing angle:** decades of writing, and it's still entirely his to take with him.

### Ned — "The Pink Cloud" (Day 30–90, Narcotics Anonymous)
> *"I'm going to crush it today!"*

Achievements is Ned's home base for exactly the stats/streaks/level energy his persona thrives on — deliberately kept one tap away rather than forced onto the Dashboard everyone else sees.

**Marketing angle:** the gamification he wants, without it being pushed on anyone who doesn't.

### David and Jordan
General's sponsor-contact field is genuinely relevant to David — it's what makes one-tap sponsor calling possible from a crisis moment — but Profile itself isn't a dedicated David or Jordan screen. Don't force a deeper story here; their moments belong to Tools and Tasks respectively.

### Lisa and Maya
No dedicated story in Profile specifically. If needed, Maya might appreciate Achievements' precise, numeric stat cards (consistent with her general preference for auditable data elsewhere in the app), but this isn't a named fit in the persona documentation — keep any mention light.

---

## How Profile connects to the rest of MRT

- **The vault PIN managed here protects everything** — Journal, Workbooks, Vitality, and Recovery Games all rely on the same key.
- **Sponsor contact feeds the crisis (SOS) flow directly.**
- **Financial tracker numbers feed the Dashboard's savings display.**
- **Achievements consolidates what used to live on the Dashboard** — the same stats, moved here specifically to keep the home screen calm (see `docs/marketing/dashboard.md`).

---

## Brand voice & marketing guardrails

Everything from `docs/marketing/journal.md`'s guardrails applies here too. Profile carries more real, verified rough edges underneath it than any other feature in this series — read these carefully:

- **Don't claim account deletion erases everything, completely.** Say "deletes your account and its primary recovery data" — not "permanently erases all your data" or similar absolute language. There are verified gaps in what the deletion process currently covers.
- **Don't promise reliable, guaranteed cloud backup.** Frame Google Drive auto-sync as a convenience, not a guarantee — "an optional backup layer," not "your data is always safely backed up." A failed sync currently has no visible error.
- **Don't claim Import restores a full backup.** It only brings back journal entries — not tasks, workbooks, or game history, even from a file this same app exported. Say "bring back old journal entries," never "restore your full backup."
- **Don't describe the vault-reset process as a strong security gate.** Keep copy to "reset and start fresh if you forget your PIN" — don't claim it requires re-verifying identity or describe it as equivalent in rigor to account deletion's process.
- **Keep gamification framing qualitative, not numeric.** "Earn XP, level up, unlock an archetype" is fine; don't cite specific point values or formulas in copy — they're implementation detail that can change.
- **Keep export claims general.** "Export everything, any time, for free" is accurate and strong — don't itemize specific data categories in a way that could go stale as the schema evolves.

---

## Quick reference: personas at a glance

| Persona | Stage | Path | Profile's job for them |
|---|---|---|---|
| David | Day 1–30 | CA | Sponsor contact here powers one-tap crisis calling — no dedicated tab story |
| Ned | Day 30–90 | NA | Achievements — his gamification home |
| Lisa | 7 years | AA | No dedicated story |
| Walt | 35+ years | AA → Recovery Dharma | Data tab — full, unrestricted export |
| Maya | 6–18 months | SMART/CBT/secular | No dedicated story; Achievements' precise stats may still appeal |
| Jordan | Day 1–12mo+ | MAT + MARA/SMART | No dedicated story |
